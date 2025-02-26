import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { appEnv } from 'src/env';
import { QueController } from './que.controller';
import { QueProcessor } from './que.worker';
import { QueQueueEventsListener } from './que.listener';

@Module({
  imports: [
    BullModule.forRoot({
      connection: { host: appEnv.REDIS_HOST, port: appEnv.REDIS_PORT },
      defaultJobOptions: {
        attempts: 0, // Max number of attempts for failed jobs
        removeOnComplete: 1000, // Keep data for the last 1000 completed jobs
        removeOnFail: 3000, // Keep data for the last 3000 failed jobs
        backoff: 2000, // Wait at least 2 seconds before attempting the job again, after failure
      },
    }),
    BullModule.registerQueue({ name: 'video' }),
  ],
  controllers: [
    QueController
  ],
  providers: [
    QueProcessor,
    QueQueueEventsListener
  ],
})
export class QueModule {}
