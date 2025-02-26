import { Field, InputType, registerEnumType } from '@nestjs/graphql';
import { BaseListInput } from 'src/shared/base-list/base-list-input.dto';

export enum SubscriptionPlanOrderByField {
  createdAt = 'createdAt',
  name = 'name',
  price = 'price',
}

registerEnumType(SubscriptionPlanOrderByField, {
  name: 'subscriptionPlanOrderByField',
});

@InputType()
export class ListSubscriptionPlanInput extends BaseListInput {
  @Field(() => String, { nullable: true })
  name: string;

  @Field(() => SubscriptionPlanOrderByField, {
    nullable: true,
    defaultValue: SubscriptionPlanOrderByField.createdAt,
  })
  orderByField?: SubscriptionPlanOrderByField;
}
