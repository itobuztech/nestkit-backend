import { Field, ObjectType, registerEnumType } from "@nestjs/graphql";
import { PrivilegeGroup, PrivilegeName, PrivilegeType } from "@prisma/client";

registerEnumType(PrivilegeGroup, {
  name: 'privilegeGroup',
});

registerEnumType(PrivilegeName, {
  name: 'privilegeName',
});
registerEnumType(PrivilegeType, {
  name: 'privilegeType',
});

@ObjectType()
export class RolePrivilegeResponse {
  @Field(() => PrivilegeGroup) group: PrivilegeGroup;
  @Field(() => PrivilegeName) name: PrivilegeName;
  @Field() id: string;
  @Field(() => PrivilegeType) type: PrivilegeType;
}

@ObjectType()
export class RoleGetResponse {
  @Field() title: string;
  @Field() type: string;
  @Field({ nullable: true }) description?: string;
  @Field() id: string;
  @Field() createdAt: Date;
  @Field() updatedAt: Date;
  @Field({ nullable: true }) deletedAt: Date;

  @Field(() => [RolePrivilegeResponse])
  privilege: RolePrivilegeResponse[];
}