import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class CreateUpdatePlanInfoResponse {
  @Field(() => String)
  id: string;

  @Field(() => String)
  message: string;
}
