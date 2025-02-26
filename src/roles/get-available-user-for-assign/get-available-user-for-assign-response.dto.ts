import { Field, ObjectType } from "@nestjs/graphql";
import { BaseListResponse } from "src/shared/base-list/base-list-response.dto";

@ObjectType()
export class AvailableForAssignUser {
  @Field() id: string;
  @Field({ nullable: true }) name: string;
  @Field() email: string;
}

@ObjectType()
export class GetUserForAssignResponse {
  @Field(() => [AvailableForAssignUser])
  users: AvailableForAssignUser[];

  @Field(() => BaseListResponse)
  pagination: BaseListResponse;
}