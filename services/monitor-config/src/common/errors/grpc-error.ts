import { RpcException } from '@nestjs/microservices';

export enum GrpcErrorCode {
  INVALID_ARGUMENT = 3,
  NOT_FOUND = 5,
  INTERNAL = 13,
}

export class GrpcError extends RpcException {
  constructor(code: GrpcErrorCode, message: string) {
    super({
      code,
      message,
    });
  }

  static invalidArgument(message: string): GrpcError {
    return new GrpcError(GrpcErrorCode.INVALID_ARGUMENT, message);
  }

  static notFound(message: string): GrpcError {
    return new GrpcError(GrpcErrorCode.NOT_FOUND, message);
  }

  static internal(message = 'Internal server error'): GrpcError {
    return new GrpcError(GrpcErrorCode.INTERNAL, message);
  }
}
