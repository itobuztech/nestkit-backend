import { Field, InputType } from '@nestjs/graphql';
import { BaseListInput } from 'src/shared/base-list/base-list-input.dto';

@InputType()
export class AssignRoleUserInput extends BaseListInput {
  @Field(() => String)
  roleId: string;

  @Field(() => String, { nullable: true })
  search?: string;
}
