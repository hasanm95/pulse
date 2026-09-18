import { IsArray, IsIn, IsInt, IsNotEmpty, IsUrl, IsUUID, Min } from "class-validator";

export class CreateMonitorRequestDto {
    @IsNotEmpty()
    @IsUrl()
    url: string;

    @IsIn(['http', 'tcp', 'ping'])
    type: string;

    @IsInt()
    @Min(10)
    interval_seconds: number;

    @IsArray()
    regions: string[];
}

export class GetMonitorParamDto {
    @IsUUID()
    id!: string;
}