package server

import (
	pb "github.com/hasanm95/pulse/services/auth/proto"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Server struct {
	pb.UnimplementedAuthServiceServer
	pool *pgxpool.Pool
	secretKey string
}

func New(pool *pgxpool.Pool, secretKey string) *Server {
	return &Server{pool: pool, secretKey: secretKey}
}