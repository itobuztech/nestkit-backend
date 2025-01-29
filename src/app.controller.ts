import { Body, Controller, Get, Inject, OnModuleInit, Post } from '@nestjs/common';

import { ClientGrpc, ClientProxy, EventPattern, GrpcMethod } from '@nestjs/microservices';
import { AppService } from './app.service';

@Controller()
export class AppController implements OnModuleInit {

  private usersService: any;

  constructor(
    private readonly appService: AppService,
    @Inject('USERS_SERVICE') private grpcClient: ClientGrpc,
    @Inject('NOTIFICATION_SERVICE') private readonly rabbit_mq_client: ClientProxy,
  ) {}

  onModuleInit() {
    this.usersService = this.grpcClient.getService('UsersService');
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
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

  @Post('notification-create')
	async createNotification(@Body() payload: any) {
		this.rabbit_mq_client.emit('order_created', payload);
    return payload;
	}

  @EventPattern('order_created')
	async handleOrderCreated(data: Record<string, unknown>) {
		console.log('Order created', data);
		// Send mail to users
	}
}
