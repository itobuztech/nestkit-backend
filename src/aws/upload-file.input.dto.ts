import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class UploadFileInput {
  @Field(() => String)
  name: string;

  @Field(() => String)
  mimetype: string;

  @Field(() => String)
  fileBuffer: Buffer;
}
