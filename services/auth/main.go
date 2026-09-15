package main

import (
	"context"
	"log"
	"net"

	pb "github.com/hasanm95/pulse/services/auth/proto"

	"google.golang.org/grpc"

	"github.com/hasanm95/pulse/services/auth/internal/config"
	"github.com/hasanm95/pulse/services/auth/internal/database"
)

type server struct {
	pb.UnimplementedAuthServiceServer
}

func (s *server) HealthCheck(ctx context.Context, req *pb.HealthRequest) (*pb.HealthResponse, error) {
	return &pb.HealthResponse{
		Status: "ok",
	}, nil
}

func main() {
	ctx := context.Background()

	cfg, err := config.Load()
	if err != nil {
		log.Fatal(err)
	}

	pool, err := database.New(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatal(err)
	}
	defer pool.Close()

	log.Println("Database connected")

	listener, err := net.Listen("tcp", ":"+cfg.Port)
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}

	grpcServer := grpc.NewServer()
	pb.RegisterAuthServiceServer(grpcServer, &server{})

	log.Printf("AUTH grpc server started on port %s\n", cfg.Port)

	if err := grpcServer.Serve(listener); err != nil {
		log.Fatal(err)
	}
}