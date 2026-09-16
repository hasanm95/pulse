import { IsNotEmpty, IsString } from "class-validator";

export class RefreshTokenRequestDto {
    @IsString()
    @IsNotEmpty({message: "refresh token shouldn't be empty"})
    refresh_token: string
}