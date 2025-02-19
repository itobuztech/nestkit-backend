import { Field, InputType } from '@nestjs/graphql';
import { SubscriptionFeature } from '@prisma/client';
import { IsUUID } from 'class-validator';

@InputType()
export class CreatePlanInfoInput {
  @Field(() => String)
  title: string;

  @Field(() => String, { nullable: true })
  description: string;

  @Field(() => SubscriptionFeature, { nullable: true })
  feature: SubscriptionFeature;

  @Field(() => Boolean, { nullable: true })
  enabled: boolean;

  @Field(() => String)
  @IsUUID(undefined, { message: 'Please provide a valid plan id' })
  planId: string;
}
