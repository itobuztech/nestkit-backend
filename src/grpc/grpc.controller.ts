import { Controller, Get, Inject, OnModuleInit } from '@nestjs/common';
import { ClientGrpc, GrpcMethod } from '@nestjs/microservices';

@Controller()
export class GrpcController implements OnModuleInit {
  private usersService: any;

  constructor(@Inject('USERS_SERVICE') private grpcClient: ClientGrpc) {}

  onModuleInit() {
    this.usersService = this.grpcClient.getService('UsersService');
  }

  @Get('grpc-client')
  async getUsers() {
    return this.usersService.GetUser({ email: 'Jon@gmail.com' });
  }

  @GrpcMethod('UsersService', 'GetUser')
  findOne(data: any) {
    console.log(data);
    return data;
  }

  @GrpcMethod('UsersService', 'CreateUser')
  createUser(data: any) {
    console.log(data);
    return data;
  }
}
