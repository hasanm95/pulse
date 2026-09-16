import { Controller, HttpCode, HttpStatus, Inject, OnModuleInit, Post } from "@nestjs/common";
import { AuthServiceClient, HealthResponse } from "./auth.interface.js";
import { ClientGrpc } from "@nestjs/microservices";
import { Observable } from "rxjs";


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

    @Post('health')
    @HttpCode(HttpStatus.OK)
    healthCheck(): Observable<HealthResponse> {
        return this.authService.healthCheck({});
    }
}