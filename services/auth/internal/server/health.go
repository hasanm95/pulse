package server

import (
	"context"

	pb "github.com/hasanm95/pulse/services/auth/proto"
)

func (s *Server) HealthCheck(ctx context.Context, req *pb.HealthRequest) (*pb.HealthResponse, error) {
	return &pb.HealthResponse{
		Status: "ok",
	}, nil
}