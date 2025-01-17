import { Field, InputType, Int, registerEnumType } from '@nestjs/graphql';

export enum AssignRoleUserOrder {
  ASC = 'asc',
  DESC = 'desc',
}

registerEnumType(AssignRoleUserOrder, {
  name: 'Order',
});

@InputType()
export class AssignRoleUserInput {
  @Field(() => String)
  roleId: string;

  @Field(() => String, { nullable: true })
  search?: string;

   @Field(() => Int, { nullable: true })
    page?: number;
  
    @Field(() => Int, { nullable: true })
    pageSize?: number;
  
    @Field(() => AssignRoleUserOrder, { nullable: true, defaultValue: AssignRoleUserOrder.DESC })
    orderBy?: AssignRoleUserOrder;
}
