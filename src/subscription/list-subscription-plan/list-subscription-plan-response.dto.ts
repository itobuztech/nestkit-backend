import { Field, ObjectType } from '@nestjs/graphql';
import { IsOptional } from 'class-validator';
import { BaseListResponse } from 'src/shared/base-list/base-list-response.dto';

@ObjectType()
export class SubscriptionPlanResponse {
  @Field(() => String)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  description: string | null;

  @Field(() => Number)
  price: number;

  @Field(() => String)
  currency: string;

  @Field(() => Number)
  durationDays: number;

  @Field(() => Boolean)
  isActive: boolean;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  @Field(() => Date, { nullable: true })
  deletedAt: Date | null;
}

@ObjectType()
export class ListSubscriptionPlanResponse {
  @Field(() => [SubscriptionPlanResponse])
  subscriptionPlans: SubscriptionPlanResponse[];

  @Field(() => BaseListResponse)
  pagination: BaseListResponse;
}
