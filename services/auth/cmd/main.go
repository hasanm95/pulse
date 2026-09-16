package main

import (
	"context"
	"log"
	"net"

	pb "github.com/hasanm95/pulse/services/auth/proto"

	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"

	"github.com/hasanm95/pulse/services/auth/internal/config"
	"github.com/hasanm95/pulse/services/auth/internal/database"
	"github.com/hasanm95/pulse/services/auth/internal/server"
)

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
	reflection.Register(grpcServer)
	pb.RegisterAuthServiceServer(grpcServer, server.New(pool, cfg.SecretKey))

	log.Printf("AUTH grpc server started on port %s\n", cfg.Port)

	if err := grpcServer.Serve(listener); err != nil {
		log.Fatal(err)
	}
}