import { IsUrl, IsUUID } from "class-validator";

export class SubscribeDto {
    @IsUUID()
    plan_id!: string;

    @IsUrl()
    success_url!: string;

    @IsUrl()
    cancel_url!: string;
}