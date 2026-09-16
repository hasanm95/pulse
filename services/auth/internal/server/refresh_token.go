package server

import (
	"context"
	"errors"
	"time"

	pb "github.com/hasanm95/pulse/services/auth/proto"

	"github.com/jackc/pgx/v5"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func (s *Server) RefreshToken(ctx context.Context, req *pb.RefreshTokenRequest) (*pb.RefreshTokenResponse, error) {
	hash := hashToken(req.RefreshToken)

	var userID, orgID, role string

	err := s.pool.QueryRow(ctx,
		`SELECT users.id, users.org_id, users.role
		 FROM refresh_tokens
		 JOIN users ON users.id = refresh_tokens.user_id
		 WHERE refresh_tokens.token_hash = $1
		   AND refresh_tokens.expires_at > now()`,
		hash,
	).Scan(&userID, &orgID, &role)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, status.Error(codes.Unauthenticated, "invalid or expired refresh token")
		}

		return nil, status.Error(codes.Internal, "failed to validate refresh token")
	}

	rawRefreshToken, tokenHash, err := generateRefreshToken()
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to generate refresh token")
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to start transaction")
	}
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx,
		`DELETE FROM refresh_tokens WHERE token_hash = $1`,
		hash,
	)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to invalidate refresh token")
	}

	_, err = tx.Exec(ctx,
		`INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
		 VALUES ($1, $2, $3)`,
		userID,
		tokenHash,
		time.Now().Add(refreshTokenTTL),
	)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to store refresh token")
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, status.Error(codes.Internal, "failed to commit transaction")
	}

	accessToken, err := s.generateAccessToken(userID, orgID, role)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to generate access token")
	}

	return &pb.RefreshTokenResponse{
		AccessToken:  accessToken,
		RefreshToken: rawRefreshToken,
		ExpiresIn:    int32(accessTokenTTL.Seconds()),
	}, nil
}