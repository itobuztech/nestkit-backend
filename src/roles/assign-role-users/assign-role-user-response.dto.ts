import { Field, ObjectType } from "@nestjs/graphql";
import { BaseListResponse } from "src/shared/base-list/base-list-response.dto";

@ObjectType()
export class AssignedUser {
  @Field() id: string;
  @Field({ nullable: true }) name: string;
  @Field() email: string;
}

@ObjectType()
export class AssignRoleUserResponse {
  @Field(() => [AssignedUser])
  users: AssignedUser[];

  @Field(() => BaseListResponse)
  pagination: BaseListResponse;
}