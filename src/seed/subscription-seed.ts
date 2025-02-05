import { PrismaClient, SubscriptionFeature } from '@prisma/client';
import appEnv from 'src/env';
const prismaClient = new PrismaClient();

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


export async function SubscriptionSeed() {
  await subscriptionPlan();
  await subscriptionInfo();
}
