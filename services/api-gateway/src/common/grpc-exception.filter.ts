import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import { Response } from "express";


@Catch()
export class GrpcExceptionFilter implements ExceptionFilter {
    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = exception.details || exception.message || 'Internal server error';

        if (exception && typeof exception.code === 'number') {
            switch (exception.code) {
                case 3:
                statusCode = HttpStatus.BAD_REQUEST;
                break;
                case 16:
                statusCode = HttpStatus.UNAUTHORIZED;
                break;
                case 7:
                statusCode = HttpStatus.FORBIDDEN;
                break;
                case 5:
                statusCode = HttpStatus.NOT_FOUND;
                break;
                case 6: 
                statusCode = HttpStatus.CONFLICT;
                break;
                case 13: 
                statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
                break;
                default:
                statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
                break;
            }
        } else if (exception instanceof HttpException) {
            statusCode = exception.getStatus();
            const res = exception.getResponse();
            message = typeof res === 'object' && (res as any).message ? (res as any).message : exception.message;
        }

        response.status(statusCode).json({
            statusCode: statusCode,
            message: message,
            error: HttpStatus[statusCode].replace(/_/g, ' '),
            timestamp: new Date().toISOString(),
        });
    }
}