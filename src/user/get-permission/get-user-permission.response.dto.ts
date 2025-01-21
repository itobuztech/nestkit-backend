import { Field, ObjectType } from "@nestjs/graphql";
import { RolePrivilegeResponse } from "src/roles/get-role/role-get-response.dto";

@ObjectType()
export class GetUserRole {
  @Field(() => String)
  id: string;

  @Field(() => String)
  title: string;
}

@ObjectType()
export class GetUserPermissionResponse {
  @Field(() => [GetUserRole]) 
  roles: GetUserRole[];

  @Field(() => [RolePrivilegeResponse])
  privilege: RolePrivilegeResponse[];

}