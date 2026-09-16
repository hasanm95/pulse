package server

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"log"
	"time"

	pb "github.com/hasanm95/pulse/services/auth/proto"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5"
	"golang.org/x/crypto/bcrypt"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

const (
	accessTokenTTL  = 15 * time.Minute
	refreshTokenTTL = 30 * 24 * time.Hour
)

func (s *Server) Login(ctx context.Context, req *pb.LoginRequest) (*pb.LoginResponse, error) {
	var (
		userID       string
		orgID        string
		passwordHash string
		role         string
	)

	err := s.pool.QueryRow(ctx,
		`SELECT id, org_id, password_hash, role FROM users WHERE email = $1`,
		req.Email,
	).Scan(&userID, &orgID, &passwordHash, &role)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, status.Error(codes.Unauthenticated, "invalid email or password")
		}
		return nil, status.Error(codes.Internal, "failed to look up user")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(req.Password)); err != nil {
		return nil, status.Error(codes.Unauthenticated, "invalid email or password")
	}

	accessToken, err := s.generateAccessToken(userID, orgID, role)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to generate access token")
	}

	rawRefreshToken, tokenHash, err := generateRefreshToken()
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to generate refresh token")
	}

	_, err = s.pool.Exec(ctx,
		`INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
		userID, tokenHash, time.Now().Add(refreshTokenTTL),
	)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to store refresh token")
	}

	return &pb.LoginResponse{
		AccessToken:  accessToken,
		RefreshToken: rawRefreshToken,
		ExpiresIn:    int32(accessTokenTTL.Seconds()),
	}, nil
}

func (s *Server) generateAccessToken(userID, orgID, role string) (string, error) {
	claims := jwt.MapClaims{
		"user_id": userID,
		"org_id":  orgID,
		"role":    role,
		"exp":     time.Now().Add(accessTokenTTL).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.secretKey))
}

func generateRefreshToken() (raw string, hash string, err error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", "", err
	}

	raw = base64.URLEncoding.EncodeToString(bytes)
	hash = hashToken(raw)

	log.Printf("[login] raw %s, hash %s", raw, hash)

	return raw, hash, nil
}