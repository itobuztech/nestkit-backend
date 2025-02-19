import { Field, InputType } from '@nestjs/graphql';
import { IsOptional } from 'class-validator';

@InputType()
export class CreateSubscriptionPlanInput {
  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  description?: string;

  @Field(() => Number)
  price: number;

  @Field(() => String, { nullable: true })
  currency: string;

  @Field(() => Number)
  durationDays: number;

  @Field(() => Boolean, { nullable: true, defaultValue: true })
  isActive: boolean;
}
