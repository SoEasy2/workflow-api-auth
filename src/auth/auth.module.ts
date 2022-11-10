import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AppLogger } from '../shared/logger/logger.service';
import { v4 as uuidv4 } from 'uuid';
import { JwtService } from './jwt.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'USERS_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'auth-service',
            brokers: ['kafka:9092'],
          },
          consumer: {
            groupId: `users-consumer-${uuidv4()}`,
            rebalanceTimeout: 10000,
          },
        },
      },
    ]),
    ClientsModule.register([
      {
        name: 'MAILER_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'mail-service',
            brokers: ['kafka:9092'],
          },
          consumer: {
            groupId: `mailer-consumer-${uuidv4()}`,
            rebalanceTimeout: 10000,
          },
        },
      },
    ]),
  ],
  providers: [AuthService, AppLogger, JwtService],
  controllers: [AuthController],
})
export class AuthModule {}
