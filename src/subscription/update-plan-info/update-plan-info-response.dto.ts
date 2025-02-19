import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class UpdatePlanInfoResponse {
  @Field(() => String)
  id: string;

  @Field(() => String)
  message: string;
}
