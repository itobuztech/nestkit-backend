import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { SubscriptionFeature } from '@prisma/client';
import { BaseListResponse } from 'src/shared/base-list/base-list-response.dto';

registerEnumType(SubscriptionFeature, {
  name: 'SubscriptionFeature',
});

@ObjectType()
export class PlanInfoResponse {
  @Field(() => String)
  id: string;

  @Field(() => String)
  title: string;

  @Field(() => String, { nullable: true })
  description: string | null;

  @Field(() => SubscriptionFeature, { nullable: true })
  feature: SubscriptionFeature | null;

  @Field(() => Number)
  order: number;

  @Field(() => Boolean)
  enabled: boolean;

  @Field(() => String)
  planId: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  @Field(() => Date, { nullable: true })
  deletedAt: Date | null;
}

@ObjectType()
export class ListPlanInfoResponse {
  @Field(() => [PlanInfoResponse])
  planInfoList: PlanInfoResponse[];

  @Field(() => BaseListResponse)
  pagination: BaseListResponse;
}
