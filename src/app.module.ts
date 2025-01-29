import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { SentryModule } from '@sentry/nestjs/setup';

import { RoleModule } from './roles/role.module';
import { PostModule } from './post/post.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { WorkspaceModule } from './workspace/workspace.module';
import { MediaModule } from './media/media.module';
import { ThrottleTestModule } from './throttle-test/throttle-test.module';
import { ThrottlerModule, ThrottlerModuleOptions } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { GqlThrottlerGuard } from './auth/throttler.guard';
import { AwsModule } from './aws/aws.module';
import appEnv from './env';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    SentryModule.forRoot(),
    PrismaModule,
    ThrottlerModule.forRootAsync({
      useFactory: (): ThrottlerModuleOptions => ([
        {
          ttl: appEnv.THROTTLE_TTL,
          limit: appEnv.THROTTLE_LIMIT,
        },
      ]),
    }),
    AuthModule,
    ThrottleTestModule,
    WorkspaceModule,
    RoleModule,
    PostModule,
    UserModule,
    MediaModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      introspection: true,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      playground: false,
      csrfPrevention: false,
      plugins: [ApolloServerPluginLandingPageLocalDefault()],
    }),
    AwsModule,

    // GRPC Client
    ClientsModule.register([
      {
        name: 'USERS_SERVICE',
        transport: Transport.GRPC,
        options: {
          package: 'users',
          protoPath: join(process.cwd(), 'src/grpc/users.proto'),
          url: appEnv.GRPC_CONNECTION_URL,
        },
      },
    ]),

    // RabbitMQ Client

    ClientsModule.register([
			{
				name: 'NOTIFICATION_SERVICE',
				transport: Transport.RMQ,
				options: {
					urls: [appEnv.RABBIT_MQ_URL],
					queue: 'notification_queue',
					queueOptions: {
						durable: false,
					},
				},
			},
		]),
    
    // Always place to bottom
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'),
    }),
  ],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: GqlThrottlerGuard,
    },
  ],
  controllers: [AppController],
})
export class AppModule {}
