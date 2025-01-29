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
    origin:
      appEnv.CORS_ORIGIN === '*'
        ? appEnv.CORS_ORIGIN
        : appEnv.CORS_ORIGIN.split(','), // Allow all origins
  });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'users',
      protoPath: join(process.cwd(), 'src/grpc/users.proto'),
      url: 'localhost:4001',
      onLoadPackageDefinition: (pkg, server) => {
        new ReflectionService(pkg).addToServer(server);
      },
    },
  });

 
  await app.startAllMicroservices();

  // Enable global config
  app.useGlobalPipes(new AppValidationPipe());
  app.useGlobalFilters(new GlobalExceptionFilter());

  await app.listen(appEnv.PORT);

  console.log(`Server is running on http://localhost:${appEnv.PORT}`);
}
bootstrap();
