import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import appEnv from './env';
import './shared/sentry/sentry-init';
import { AppValidationPipe } from './validator.pipe';
import { NestExpressApplication } from '@nestjs/platform-express';
import { GlobalExceptionFilter } from './global-exception.filter';
import { join } from 'path';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ReflectionService } from '@grpc/reflection';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({
    origin: appEnv.CORS_ORIGIN.split(',')
  });

  // GRPC Server
  // Adding GRPC microservice
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'users',
      protoPath: join(process.cwd(), 'src/grpc/users.proto'),
      url: appEnv.GRPC_CONNECTION_URL,
      onLoadPackageDefinition: (pkg, server) => {
        new ReflectionService(pkg).addToServer(server);
      },
    },
  });

  // RabbitMQ Consumer
  app.connectMicroservice<MicroserviceOptions>({
		transport: Transport.RMQ,
		options: {
			urls: [appEnv.RABBIT_MQ_URL],
			queue: 'notification_queue',
			queueOptions: {
				durable: false,
			},
		},
  });

 
  // Start all microservices
  await app.startAllMicroservices();

  // Enable global config
  app.useGlobalPipes(new AppValidationPipe());
  app.useGlobalFilters(new GlobalExceptionFilter());

  await app.listen(appEnv.PORT);

  console.log(`Server is running on http://localhost:${appEnv.PORT}`);
}
bootstrap();
