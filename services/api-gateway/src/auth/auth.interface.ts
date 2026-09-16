import { Observable } from "rxjs";


export interface HealthRequest {}

export interface HealthResponse {
    status: string;
}

export interface SignupRequest {
    orgName: string;
    email: string;
    password: string;
}

export interface SignupResponse {
    orgId: string;
    userId: string;
}

export interface LoginRequest {
   email: string;
   password: string;
}

export interface LoginResponse {
   accessToken: string;
   refreshToken: string;
   expiresIn: number;
}

export interface RefreshTokenRequest {
    refreshToken: string;
}

export interface RefreshTokenResponse {
   accessToken: string;
   expiresIn: number;
}

export interface LogoutRequest {
    refreshToken: string;
}

export interface LogoutResponse {}

export interface ValidateTokenRequest {
   accessToken: string;
}

export interface ValidateTokenResponse {
   userId: string;
   orgId: string;
   role: string;
}

export interface AuthServiceClient {
    healthCheck(request: HealthRequest): Observable<HealthResponse>;
    signup(request: SignupRequest): Observable<SignupResponse>;
    login(request: LoginRequest): Observable<LoginResponse>;
    refreshToken(request: RefreshTokenRequest): Observable<RefreshTokenResponse>;
    logout(request: LogoutRequest): Observable<LogoutResponse>;
    validateToken(request: ValidateTokenRequest): Observable<ValidateTokenResponse>;
}