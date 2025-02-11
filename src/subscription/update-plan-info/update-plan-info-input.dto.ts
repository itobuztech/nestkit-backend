import { Field, InputType } from '@nestjs/graphql';
import { SubscriptionFeature } from '@prisma/client';
import { IsOptional, IsUUID } from 'class-validator';

@InputType()
export class UpdatePlanInfoInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID(undefined, { message: 'Please provide a valid plan id' })
  id: string;

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
