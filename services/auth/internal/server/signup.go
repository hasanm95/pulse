package server

import (
	"context"
	"errors"
	"log"

	pb "github.com/hasanm95/pulse/services/auth/proto"
	"github.com/jackc/pgx/v5/pgconn"
	"golang.org/x/crypto/bcrypt"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func (s *Server) Signup(ctx context.Context, req *pb.SignupRequest) (*pb.SignupResponse, error) {
	log.Printf("[signup] org name %s", req.OrgName)
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to process password")
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to start transaction")
	}
	defer tx.Rollback(ctx)

	var orgID string
	err = tx.QueryRow(ctx,
		`INSERT INTO organizations (name) VALUES ($1) RETURNING id`,
		req.OrgName,
	).Scan(&orgID)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to create organization")
	}

	var userID string
	err = tx.QueryRow(ctx,
		`INSERT INTO users (org_id, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id`,
		orgID, req.Email, string(hashedPassword), "owner",
	).Scan(&userID)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return nil, status.Error(codes.AlreadyExists, "email already registered")
		}
		return nil, status.Error(codes.Internal, "failed to create user")
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, status.Error(codes.Internal, "failed to commit transaction")
	}

	return &pb.SignupResponse{
		OrgId:  orgID,
		UserId: userID,
	}, nil
}