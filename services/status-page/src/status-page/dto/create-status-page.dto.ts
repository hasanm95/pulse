import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class CreateStatusPageDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, { message: 'slug must be lowercase letters, numbers, and hyphens only' })
  slug!: string;

  @IsString()
  @IsNotEmpty()
  company_name!: string;
}