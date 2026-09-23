import { Body, Controller, Get, HttpCode, HttpStatus, Inject, OnModuleInit, Post, Req } from "@nestjs/common";
import { BillingServiceClient, CancelSubscriptionResponse, GetPlansResponse, GetUsageResponse, HealthResponse, SubscribeResponse } from "./billing.interface.js";
import { ClientGrpc } from "@nestjs/microservices";
import { Public } from "../common/decorators/public.decorator.js";
import { Observable } from "rxjs";
import { SubscribeDto } from "./dto/subscribe.dto.js";


@Controller("billing")
export class BillingController implements OnModuleInit {
    private billingService: BillingServiceClient
    private client: ClientGrpc

    constructor(@Inject("BILLING_PACKAGE") client: any){
        this.client = client as ClientGrpc
    }

    onModuleInit() {
        this.billingService = this.client.getService<BillingServiceClient>("BillingService")
    }

    @Public()
    @Get("health")
    @HttpCode(HttpStatus.OK)
    healthCheck(): Observable<HealthResponse>{
        return this.billingService.healthCheck({})
    }

    @Public()
    @Get("plans")
    getPlans(): Observable<GetPlansResponse> {
        return this.billingService.getPlans({})
    }

    @Post("subscribe")
    subscribe(@Req() request: Request, @Body() dto: SubscribeDto): Observable<SubscribeResponse> {
        const orgId = request["user"].orgId;
        const email = request["user"].email;

        return this.billingService.subscribe({
            orgId,
            email,
            planId: dto.planId,
            successUrl: dto.successUrl,
            cancelUrl: dto.cancelUrl
        })
    }

    @Post("cancel")
    cancelSubscription(@Req() request: Request): Observable<CancelSubscriptionResponse>{
        const orgId = request["user"].orgId;
        return this.billingService.cancelSubscription({orgId})
    }

    @Get("usage")
    getUsage(@Req() request: Request): Observable<GetUsageResponse> {
        const orgId = request["user"].orgId;
        return this.billingService.getUsage({orgId})
    }
}