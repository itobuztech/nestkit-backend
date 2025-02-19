import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class DeletePlanResponse {
  @Field(() => Boolean)
  success: boolean;

  @Field(() => String)
  message: string;
}
