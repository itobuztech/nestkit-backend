import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class CreatePlanInfoResponse {
  @Field(() => String)
  id: string;

  @Field(() => String)
  message: string;
}
