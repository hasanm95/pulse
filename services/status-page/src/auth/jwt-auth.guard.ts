import { CanActivate, ExecutionContext, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const secret = process.env.SECRET_KEY;
    if (!secret) {
      // Fail loudly - never silently verify against a placeholder secret
      throw new InternalServerErrorException('Server misconfigured: SECRET_KEY not set');
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Missing authentication token');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret,
        algorithms: ['HS256'], // explicit, matching how Auth signs tokens
      });
      request['user'] = payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired authentication token');
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}