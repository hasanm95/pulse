import { IsUrl, IsUUID } from "class-validator";

export class SubscribeDto {
    @IsUUID()
    planId!: string;

    @IsUrl()
    successUrl!: string;

    @IsUrl()
    cancelUrl!: string;
}