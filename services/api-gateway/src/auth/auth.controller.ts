import { Body, Controller, Get, HttpCode, HttpStatus, Inject, OnModuleInit, Post } from "@nestjs/common";
import { AuthServiceClient, HealthResponse, LoginResponse, LogoutResponse, RefreshTokenResponse, SignupResponse, ValidateTokenResponse } from "./auth.interface.js";
import { ClientGrpc } from "@nestjs/microservices";
import { Observable } from "rxjs";
import { SignupRequestDto } from "./dto/signup-request.dto.js";
import { RefreshTokenRequestDto } from "./dto/refresh-token.dto.js";
import { ValidateTokenRequestDto } from "./dto/validate-token-request.dto.js";
import { LoginRequestDto } from "./dto/login-request.dto.js";


@Controller("auth")
export class AuthController implements OnModuleInit {
    private authService: AuthServiceClient
    private client: ClientGrpc;

    constructor(@Inject('AUTH_PACKAGE') client: any) {
        this.client = client as ClientGrpc;
    }

    onModuleInit() {
        this.authService = this.client.getService<AuthServiceClient>('AuthService')
    }

    @Get('health')
    @HttpCode(HttpStatus.OK)
    healthCheck(): Observable<HealthResponse> {
        return this.authService.healthCheck({});
    }

    @Post("signup") signup(@Body() request: SignupRequestDto): Observable<SignupResponse> { 
        return this.authService.signup({ 
            orgName: request.org_name, 
            email: request.email, 
            password: request.password, 
        }); 
    }

    @Post("login")
    login(@Body() request: LoginRequestDto): Observable<LoginResponse> {
        return this.authService.login(request);
    }

    @Post("refresh-token")
    refreshToken(@Body() request: RefreshTokenRequestDto): Observable<RefreshTokenResponse>{
        return this.authService.refreshToken({
            refreshToken: request.refresh_token
        })
    }

    @Post("logout")
    logout(@Body() request: RefreshTokenRequestDto): Observable<LogoutResponse> {
        return this.authService.logout({
            refreshToken: request.refresh_token
        })
    }

    @Post("validate-token")
    validateToken(@Body() request: ValidateTokenRequestDto): Observable<ValidateTokenResponse> {
        return this.authService.validateToken({
            accessToken: request.access_token
        })
    }
}