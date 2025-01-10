import { Field, InputType } from '@nestjs/graphql';
import { AccessLevel } from '@prisma/client';

@InputType()
export class uploadFileInput {
  @Field(() => String)
  originalname: string;

  @Field(() => String)
  path: string;

  @Field(() => String)
  mimetype: string;

  @Field(() => AccessLevel, { nullable: true })
  accessLevel?: AccessLevel;
}
