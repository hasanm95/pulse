import { CanActivate, ExecutionContext, Inject, Injectable, OnModuleInit, UnauthorizedException } from "@nestjs/common";
import { AuthServiceClient } from "../../auth/auth.interface.js";
import { Reflector } from "@nestjs/core";
import { ClientGrpc } from "@nestjs/microservices";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator.js";
import { firstValueFrom } from "rxjs";


@Injectable()
export class AuthGuard implements CanActivate, OnModuleInit {
    private authService: AuthServiceClient

    constructor(
        private reflector: Reflector,
        @Inject("AUTH_PACKAGE") private readonly client: any
    ){}

    onModuleInit() {
        const grpcClient = this.client as ClientGrpc
        this.authService = grpcClient.getService<AuthServiceClient>("AuthService")
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        // 1. Check if the route is marked with @Public()
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass()
        ])

        if (isPublic){
            return true
        }

        // 2. Extract authorization credentials from HTTP request header context
        const request = context.switchToHttp().getRequest()
        const authHeader = request.headers.authorization

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException("Missing or malformed authorization token")
        }

        const token = authHeader.split(" ")[1]

        // 3. Remote execute authorization logic via Go microservice gRPC client channel
        // Errors bubble up automatically to GrpcExceptionFilter (UNAUTHENTICATED (16) -> 401)
        const result = await firstValueFrom(
            this.authService.validateToken({accessToken: token})
        )

        // 4. On success: Attach context data properties onto the active request instance
        request.user = {
            userId: result.userId,
            orgId: result.orgId,
            role: result.role,
        };

        return true;
    }
}