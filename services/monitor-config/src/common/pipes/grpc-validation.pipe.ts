import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { validate, ValidationError } from 'class-validator';
import { GrpcError } from '../errors/grpc-error.js';

type DtoClass<T extends object> = new () => T;
type DtoMapper<T extends object> = (value: unknown) => T;

@Injectable()
export class GrpcValidationPipe<T extends object> {
  constructor(
    private readonly dtoClass: DtoClass<T>,
    private readonly mapper: DtoMapper<T>,
  ) {}

  async transform(value: unknown): Promise<T> {
    const dto = Object.assign(new this.dtoClass(), this.mapper(value));

    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      throw GrpcError.invalidArgument(this.formatErrors(errors));
    }

    return dto;
  }

  private formatErrors(errors: ValidationError[]): string {
    return errors
      .map((error) => {
        const constraints = error.constraints
          ? Object.values(error.constraints).join(', ')
          : 'Invalid value';

        return `${error.property}: ${constraints}`;
      })
      .join('; ');
  }
}
