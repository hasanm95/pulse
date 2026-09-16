package server

import (
	"context"

	pb "github.com/hasanm95/pulse/services/auth/proto"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func (s *Server) Logout(ctx context.Context, req *pb.LogoutRequest) (*pb.LogoutResponse, error) {
	hash := hashToken(req.RefreshToken)

	_, err := s.pool.Exec(ctx, `DELETE FROM refresh_tokens WHERE token_hash = $1`, hash)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to log out")
	}

	return &pb.LogoutResponse{}, nil
}