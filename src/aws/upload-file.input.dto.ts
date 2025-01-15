import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class uploadFileInput {
  @Field(() => String)
  name: string;

  @Field(() => String)
  mimetype: string;

  @Field(() => String)
  fileBuffer: Buffer;
}
