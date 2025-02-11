import { Module } from '@nestjs/common';
import { ListSubscriptionPlanService } from './list-subscription-plan/list-subscription-plan.service';
import { CreateUpdateSubscriptionPlanService } from './create-update-subscription-plan/create-update-subscription-plan.service';
import { ListPlanInfoService } from './list-plan-info/list-plan-info.service';
import { CreatePlanInfoService } from './create-plan-info/create-plan-info.service';
import { UpdatePlanInfoService } from './update-plan-info/update-plan-info.service';
import { DeletePlanInfoService } from './delete-plan-info/delete-plan-info.service';
import { DeletePlanService } from './delete-plan/delete-plan.service';

@Module({
  providers: [
    ListSubscriptionPlanService,
    CreateUpdateSubscriptionPlanService,
    ListPlanInfoService,
    CreatePlanInfoService,
    UpdatePlanInfoService,
    DeletePlanInfoService,
    DeletePlanService,
  ],
  exports: [],
})
export class SubscriptionModule {}
