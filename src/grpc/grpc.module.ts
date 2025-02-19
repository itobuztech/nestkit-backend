import { GrpcController } from './grpc.controller';
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import appEnv from 'src/env';

@Module({
  imports: [
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
  ],
  controllers: [GrpcController],
  providers: [],
})
export class GrpcModule {}
