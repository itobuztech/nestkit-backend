import { Module } from '@nestjs/common';
import { ListSubscriptionPlanService } from './list-subscription-plan/list-subscription-plan.service';
import { CreateSubscriptionPlanService } from './create-subscription-plan/create-subscription-plan.service';

@Module({
  providers: [ListSubscriptionPlanService, CreateSubscriptionPlanService],
  exports: [],
})
export class SubscriptionModule {}
