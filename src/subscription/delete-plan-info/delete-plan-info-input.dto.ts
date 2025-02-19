import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class DeletePlanInfoInput {
  @Field(() => String)
  id: string;

  @Field(() => Boolean, { nullable: true })
  fromStash?: boolean;
}
