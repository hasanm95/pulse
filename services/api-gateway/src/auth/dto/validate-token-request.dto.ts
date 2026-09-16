import { IsString } from "class-validator";

export class ValidateTokenRequestDto {
    @IsString()
    access_token: string;
}