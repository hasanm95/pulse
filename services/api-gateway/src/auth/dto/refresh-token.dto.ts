import { IsString } from "class-validator";

export class RefreshTokenRequestDto {
    @IsString()
    refresh_token: string
}