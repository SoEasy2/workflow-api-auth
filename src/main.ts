import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ExceptionFilter } from './exceptions/rpc-exception.filter';
import { ValidationPipe } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.KAFKA,
      options: {
        client: {
          brokers: ['kafka:9092'],
          clientId: 'auth-service',
        },
        consumer: {
          groupId: `auth-consumer-${uuidv4()}`,
          allowAutoTopicCreation: true,
        },
      },
    },
  );

  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  app.useGlobalFilters(new ExceptionFilter());

  app.enableShutdownHooks();

  await app.listen();
}
bootstrap().then(() => {
  console.log('Auth service is running');
});
