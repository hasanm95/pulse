import { IsNotEmpty, IsString } from "class-validator";

export class ValidateTokenRequestDto {
    @IsString()
    @IsNotEmpty({message: "access token shouldn't be empty"})
    access_token: string;
}