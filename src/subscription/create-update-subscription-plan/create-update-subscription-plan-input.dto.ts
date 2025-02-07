import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, IsUUID } from 'class-validator';

@InputType()
export class CreateUpdateSubscriptionPlanInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID(undefined, { message: 'Please provide a valid plan id' })
  id?: string;

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
