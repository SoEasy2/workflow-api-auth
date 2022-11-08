import { Controller, UseFilters, UsePipes, ValidationPipe } from '@nestjs/common';
import { AppLogger } from '../shared/logger/logger.service';
import { AuthService } from './auth.service';
import { User } from './entities/User';
import {
  EventPattern,
  MessagePattern,
  Payload,
  RpcException,
} from '@nestjs/microservices';
import {
  TOPIC_AUTH_REGISTER,
  TOPIC_AUTH_REGISTER_REPLY,
} from '../common/constants';
import { IKafkaMessage } from '../common/interfaces/kafka-message.interface';
import { CreateUserDto } from './dto/create-user-dto';
import { ExceptionFilter } from '../exceptions/rpc-exception.filter';
import { IResponseAuth } from './interfaces/response-auth.interface';

@UseFilters(new ExceptionFilter())
@UsePipes(new ValidationPipe({ transform: true }))
@Controller('auth')
export class AuthController {
  constructor(
    private readonly appLogger: AppLogger,
    private readonly authService: AuthService,
  ) {
    this.appLogger.setContext(AuthController.name);
  }
  @MessagePattern(TOPIC_AUTH_REGISTER)
  async registerUser(
    @Payload() message: IKafkaMessage<CreateUserDto>,
  ): Promise<IResponseAuth> {
    try {
      this.appLogger.log(
        `[AuthController][${TOPIC_AUTH_REGISTER}] -> [registerUser]`,
      );
      return await this.authService.registerUser(message.value);
    } catch (err) {
      console.log('ERROR', err);
      this.appLogger.error(
        err,
        err.stack,
        `[AuthController][${TOPIC_AUTH_REGISTER}] -> [registerUser]`,
      );
      throw new RpcException(JSON.stringify(err));
    }
  }
  @EventPattern(TOPIC_AUTH_REGISTER_REPLY)
  async logRegisterUser(): Promise<void> {
    this.appLogger.log(
      `[AuthController][${TOPIC_AUTH_REGISTER}][SEND] -> [registerUser]`,
    );
  }
}
