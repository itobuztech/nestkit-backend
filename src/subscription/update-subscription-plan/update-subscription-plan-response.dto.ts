import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class UpdateSubscriptionPlanResponse {
  @Field(() => String)
  id: string;

  @Field(() => String)
  message: string;
}
