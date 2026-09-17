import {
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsUrl,
  Min,
} from 'class-validator';
import { MonitorStatus, MonitorType } from '../monitor.types.js';

export class CreateMonitorDto {
  @IsUUID()
  orgId!: string;

  @IsNotEmpty()
  url!: string;

  @IsIn(['http', 'tcp', 'ping'])
  type!: MonitorType;

  @IsInt()
  @Min(10)
  intervalSeconds!: number;

  @IsArray()
  regions!: string[];
}

export class GetMonitorDto {
  @IsUUID()
  id!: string;
}

export class ListMonitorsDto {
  @IsUUID()
  orgId!: string;
}

export class UpdateMonitorDto {
  @IsUUID()
  id!: string;

  @IsOptional()
  @IsNotEmpty()
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
  status?: MonitorStatus;
}

export class DeleteMonitorDto {
  @IsUUID()
  id!: string;
}
