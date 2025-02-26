import { Field, InputType, Int, registerEnumType } from '@nestjs/graphql';

export enum GetUserForAssignOrder {
  ASC = 'asc',
  DESC = 'desc',
}

registerEnumType(GetUserForAssignOrder, {
  name: 'GetUserForAssignOrder',
});

@InputType()
export class GetUserForAssignInput {
  @Field(() => String)
  roleId: string;

  @Field(() => String, { nullable: true })
  search?: string;

  @Field(() => Int, { nullable: true })
  page?: number;

  @Field(() => Int, { nullable: true })
  pageSize?: number;

  @Field(() => GetUserForAssignOrder, {
    nullable: true,
    defaultValue: GetUserForAssignOrder.DESC,
  })
  orderBy?: GetUserForAssignOrder;
}
