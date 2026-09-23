import { RpcException } from '@nestjs/microservices';

export enum GrpcErrorCode {
  INVALID_ARGUMENT = 3,
  NOT_FOUND = 5,
  ALREADY_EXISTS = 6,
  INTERNAL = 13,
}

export class GrpcError extends RpcException {
  constructor(code: GrpcErrorCode, message: string) {
    super({ code, message });
  }
  static invalidArgument(message: string) { return new GrpcError(GrpcErrorCode.INVALID_ARGUMENT, message); }
  static notFound(message: string) { return new GrpcError(GrpcErrorCode.NOT_FOUND, message); }
  static alreadyExists(message: string) { return new GrpcError(GrpcErrorCode.ALREADY_EXISTS, message); }
  static internal(message = 'Internal server error') { return new GrpcError(GrpcErrorCode.INTERNAL, message); }
}