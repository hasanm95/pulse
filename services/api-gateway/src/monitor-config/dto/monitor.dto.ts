import { IsArray, IsIn, IsInt, IsNotEmpty, IsOptional, IsUrl, IsUUID, Min } from "class-validator";

export class CreateMonitorRequestDto {
    @IsNotEmpty()
    @IsUrl()
    url: string;

    @IsIn(['http', 'tcp', 'ping'])
    type: string;

    @IsInt()
    @Min(10)
    intervalSeconds: number;

    @IsArray()
    regions: string[];
}

export class MonitorParamDto {
    @IsUUID()
    id!: string;
}

export class UpdateMonitorRequestDto {
    @IsOptional()
    @IsNotEmpty()
    @IsUrl()
    url?: string;

    @IsOptional()
    @IsInt()
    @Min(10)
    intervalSeconds?: number;

    @IsOptional()
    @IsArray()
    regions?: string[];

    @IsOptional()
    @IsIn(['active', 'paused'])
    status?: string;
}