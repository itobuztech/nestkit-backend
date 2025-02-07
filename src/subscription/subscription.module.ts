import { Module } from '@nestjs/common';
import { ListSubscriptionPlanService } from './list-subscription-plan/list-subscription-plan.service';

@Module({
  providers: [ListSubscriptionPlanService],
  exports: [],
})
export class SubscriptionModule {}
