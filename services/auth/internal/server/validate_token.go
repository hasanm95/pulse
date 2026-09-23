package server

import (
	"context"
	"fmt"

	"github.com/golang-jwt/jwt/v5"
	pb "github.com/hasanm95/pulse/services/auth/proto"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func (s *Server) ValidateToken(ctx context.Context, req *pb.ValidateTokenRequest) (*pb.ValidateTokenResponse, error){
	token, err := jwt.Parse(req.AccessToken, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return []byte(s.secretKey), nil
	})

	if err != nil || !token.Valid{
		return nil, status.Error(codes.Unauthenticated, "invalid or expired access token")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, status.Error(codes.Internal, "failed to read token claims")
	}

	userID, ok := claims["user_id"].(string)
	if !ok {
		return nil, status.Error(codes.Internal, "user id is missing")
	}
	orgID, ok := claims["org_id"].(string)
	if !ok {
		return nil, status.Error(codes.Internal, "org id is missing")
	}
	role, ok := claims["role"].(string)
	if !ok {
		return nil, status.Error(codes.Internal, "role is missing")
	}
	email, ok := claims["email"].(string)
	if !ok {
		return nil, status.Error(codes.Internal, "emal is missing")
	}

	return &pb.ValidateTokenResponse{
		UserId: userID,
		OrgId:  orgID,
		Role:   role,
		Email: email,
	}, nil
}

