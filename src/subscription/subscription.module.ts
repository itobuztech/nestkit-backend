import { Module } from '@nestjs/common';
import { ListSubscriptionPlanService } from './list-subscription-plan/list-subscription-plan.service';
import { CreateUpdateSubscriptionPlanService } from './create-update-subscription-plan/create-update-subscription-plan.service';

@Module({
  providers: [ListSubscriptionPlanService, CreateUpdateSubscriptionPlanService],
  exports: [],
})
export class SubscriptionModule {}
