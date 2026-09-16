import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class SignupRequestDto {
    @IsString()
    @IsNotEmpty({message: "Organization name is required"})
    org_name: string;

    @IsEmail({}, { message: 'Please provide a valid email address' })
    email: string;

    @IsString()
    @IsNotEmpty({ message: 'Password is required' })
    @MinLength(6, { message: 'Password must be at least 6 characters long' })
    password: string;
}