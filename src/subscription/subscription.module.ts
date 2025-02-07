import { Module } from '@nestjs/common';
import { ListSubscriptionPlanService } from './list-subscription-plan/list-subscription-plan.service';
import { CreateUpdateSubscriptionPlanService } from './create-update-subscription-plan/create-update-subscription-plan.service';
import { ListPlanInfoService } from './list-plan-info/list-plan-info.service';

@Module({
  providers: [
    ListSubscriptionPlanService,
    CreateUpdateSubscriptionPlanService,
    ListPlanInfoService,
  ],
  exports: [],
})
export class SubscriptionModule {}
