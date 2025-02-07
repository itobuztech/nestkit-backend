import { Field, InputType, registerEnumType } from '@nestjs/graphql';
import { BaseListInput } from 'src/shared/base-list/base-list-input.dto';

export enum PlanInfoOrderByField {
  createdAt = 'createdAt',
  title = 'title',
}

registerEnumType(PlanInfoOrderByField, {
  name: 'planInfoOrderByField',
});

@InputType()
export class ListPlanInfoInput extends BaseListInput {
  @Field(() => String, { nullable: true })
  title: string;

  @Field(() => String)
  planId: string;

  @Field(() => PlanInfoOrderByField, {
    nullable: true,
    defaultValue: PlanInfoOrderByField.createdAt,
  })
  orderByField?: PlanInfoOrderByField;
}
