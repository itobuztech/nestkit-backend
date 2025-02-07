import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class CreateUpdateSubscriptionPlanResponse {
  @Field(() => String)
  id: string;

  @Field(() => String)
  message: string;
}
