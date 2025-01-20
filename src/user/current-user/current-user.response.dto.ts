import { Field, ObjectType } from "@nestjs/graphql";
import { UserType } from "@prisma/client";

@ObjectType()
 class CurrentUserWorkspace {

  @Field(() => String) 
  id: string;

  @Field(() => String) 
  name: string;
}

@ObjectType()
export class CurrentUserResponse {
  @Field(() => String) 
  email: string;

  @Field(() => String, { nullable: true }) 
  name: string | null;

  @Field(() => String) 
  id: string;

  @Field(() => String, { nullable: true }) 
  profileImage: string | null;

  @Field(() => String, { nullable: true }) 
  userType: UserType;

  @Field(() => Number) 
  sessionCount: number;

  @Field(() => [CurrentUserWorkspace])
  workspace: CurrentUserWorkspace[];

}