import { Module } from '@nestjs/common';
import { ListSubscriptionPlanService } from './list-subscription-plan/list-subscription-plan.service';
import { CreateUpdateSubscriptionPlanService } from './create-update-subscription-plan/create-update-subscription-plan.service';
import { ListPlanInfoService } from './list-plan-info/list-plan-info.service';
import { CreateUpdatePlanInfoService } from './create-update-plan-info/create-update-plan-info.service';

@Module({
  providers: [
    ListSubscriptionPlanService,
    CreateUpdateSubscriptionPlanService,
    ListPlanInfoService,
    CreateUpdatePlanInfoService,
  ],
  exports: [],
})
export class SubscriptionModule {}
