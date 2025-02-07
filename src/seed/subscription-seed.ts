import {
  DiscountType,
  PaymentGateway,
  PaymentStatus,
  PrismaClient,
  SubscriptionFeature,
  UserType,
} from '@prisma/client';
import appEnv from 'src/env';
const prismaClient = new PrismaClient();
import { faker } from '@faker-js/faker';

async function subscriptionPlan() {
  await prismaClient.subscriptionPlan.deleteMany();

  await prismaClient.subscriptionPlan.create({
    data: {
      name: 'Trial',
      description: 'Trial Plan',
      price: 0,
      currency: appEnv.DEFAULT_CURRENCY,
      durationDays: 30,
    },
  });

  await prismaClient.subscriptionPlan.create({
    data: {
      name: 'Basic',
      description: 'Basic Plan',
      price: 100,
      currency: appEnv.DEFAULT_CURRENCY,
      durationDays: 30,
    },
  });

  await prismaClient.subscriptionPlan.create({
    data: {
      name: 'Premium',
      description: 'Premium Plan',
      price: 500,
      currency: appEnv.DEFAULT_CURRENCY,
      durationDays: 30,
    },
  });

  await prismaClient.subscriptionPlan.create({
    data: {
      name: 'Ultimate',
      description: 'Ultimate Plan',
      price: 1000,
      currency: appEnv.DEFAULT_CURRENCY,
      durationDays: 30,
    },
  });
}

async function subscriptionInfo() {
  await prismaClient.subscriptionPlanInfo.deleteMany();

  const subscriptionPremiumPlan = await prismaClient.subscriptionPlan.findFirst({
    where: {
      name: 'Premium',
    },
  });

  if (!subscriptionPremiumPlan) {
    return;
  }

  await prismaClient.subscriptionPlanInfo.create({
    data: {
      title: 'Custom Role',
      description: 'More role customization',
      feature: SubscriptionFeature.CUSTOM_ROLE,
      planId: subscriptionPremiumPlan.id,
      enabled: true,
    },
  });

  /// Add more subscription info here
  const subscriptionUltimatePlan = await prismaClient.subscriptionPlan.findFirst({
    where: {
      name: 'Ultimate',
    },
  });

  if (!subscriptionUltimatePlan) {
    return;
  }

  await prismaClient.subscriptionPlanInfo.create({
    data: {
      title: 'Custom Role',
      description: 'More role customization',
      feature: SubscriptionFeature.CUSTOM_ROLE,
      planId: subscriptionUltimatePlan.id,
      enabled: true,
    },
  });

  await prismaClient.subscriptionPlanInfo.create({
    data: {
      title: 'Media Manager',
      description: 'Media Manager',
      feature: SubscriptionFeature.MEDIA,
      planId: subscriptionUltimatePlan.id,
      enabled: true,
    },
  });
}

async function couponSeed() {
  await prismaClient.coupon.deleteMany();
  await prismaClient.coupon.createMany({
    data: [
      {
        code: faker.string.alphanumeric(8),
        description: faker.lorem.sentence(),
        discountType: DiscountType.PERCENTAGE,
        discountValue: 10,
        minPurchaseAmount: 200,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
      {
        code: faker.string.alphanumeric(8),
        description: faker.lorem.sentence(),
        discountType: DiscountType.PERCENTAGE,
        discountValue: 20,
        minPurchaseAmount: 1000,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 182 * 24 * 60 * 60 * 1000),
      },
    ],
  });
}

async function subscriptionSeed() {
  await prismaClient.subscription.deleteMany();
  const users = await prismaClient.user.findMany({
    where: { userType: UserType.USER },
    take: 2,
  });
  const plans = await prismaClient.subscriptionPlan.findMany({ take: 2 });
  const coupons = await prismaClient.coupon.findMany({ take: 2 });
  await Promise.all(
    users.map(async (user, index) => {
      await prismaClient.subscription.create({
        data: {
          userId: user.id,
          planId: plans[index].id,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          couponId: coupons[index].id,
        },
      });
    }),
  );
}

async function paymentSeed() {
  await prismaClient.payment.deleteMany();
  const subscriptions = await prismaClient.subscription.findMany({
    include: { plan: true, coupon: true },
  });
  await Promise.all(
    subscriptions.map(async (subscription, index) => {
      await prismaClient.payment.create({
        data: {
          subscriptionId: subscription.id,
          amount: subscription.plan.price - (subscription.plan.price * (subscription.coupon?.discountValue || 0)) / 100,
          appliedCouponId: subscription.couponId,
          gateway: PaymentGateway.RAZORPAY,
          status: index % 2 ? PaymentStatus.FAILED : PaymentStatus.SUCCESS,
        },
      });
    }),
  );
}

export async function SubscriptionSeed() {
  await subscriptionPlan();
  await subscriptionInfo();
  await couponSeed();
  await subscriptionSeed();
  await paymentSeed();
}
