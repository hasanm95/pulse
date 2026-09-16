package server

import (
	"context"
	"errors"

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
		 WHERE refresh_tokens.token_hash = $1 AND refresh_tokens.expires_at > now()`,
		hash,
	).Scan(&userID, &orgID, &role)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, status.Error(codes.Unauthenticated, "invalid or expired refresh token")
		}
		return nil, status.Error(codes.Internal, "failed to validate refresh token")
	}

	accessToken, err := s.generateAccessToken(userID, orgID, role)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to generate access token")
	}

	return &pb.RefreshTokenResponse{
		AccessToken: accessToken,
		ExpiresIn:   int32(accessTokenTTL.Seconds()),
	}, nil
}