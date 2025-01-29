import { Controller, Get, Inject, OnModuleInit } from '@nestjs/common';

import { ClientGrpc, GrpcMethod } from '@nestjs/microservices';
import { AppService } from './app.service';

@Controller()
export class AppController implements OnModuleInit {

  private usersService: any;

  constructor(
    private readonly appService: AppService,
    @Inject('USERS_SERVICE') private client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.usersService = this.client.getService('UsersService');
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('users')
  async getUsers() {
    return this.usersService.GetUser({ email: 'Jon@gmail.com' });
  }

  @GrpcMethod('UsersService', 'GetUser')
  findOne(data: any) {
    console.log(data);
    return data;
  }

  @GrpcMethod('UsersService', 'CreateUser')
  create(data: any) {
    console.log(data);
    return data;
  }
}
