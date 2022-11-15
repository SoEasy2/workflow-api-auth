import {
  Controller,
  UseFilters,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AppLogger } from '../shared/logger/logger.service';
import { AuthService } from './auth.service';
import {
  EventPattern,
  MessagePattern,
  Payload,
  RpcException,
} from '@nestjs/microservices';
import {
  TOPIC_AUTH_LOGIN,
  TOPIC_AUTH_REGISTER,
  TOPIC_AUTH_REGISTER_REPLY,
  TOPIC_AUTH_VERIFICATION,
  TOPIC_AUTH_VERIFICATION_REPLY,
  TOPIC_AUTH_VERIFY_TOKEN,
  TOPIC_AUTH_VERIFY_TOKEN_REPLY,
} from '../common/constants';
import { IKafkaMessage } from '../common/interfaces/kafka-message.interface';
import { CreateUserDto } from './dto/create-user-dto';
import { ExceptionFilter } from '../exceptions/rpc-exception.filter';
import { IResponseAuth } from './interfaces/response-auth.interface';
import { VerificationUserDto } from './dto/verification-user-dto';
import { LoginUserDto } from './dto/login-user-dto';

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

  @MessagePattern(TOPIC_AUTH_LOGIN)
  async loginUser(
    @Payload() message: IKafkaMessage<LoginUserDto>,
  ): Promise<IResponseAuth> {
    try {
      this.appLogger.log(
        `[AuthController][${TOPIC_AUTH_LOGIN}] -> [loginUser]`,
      );
      return await this.authService.loginUser(message.value);
    } catch (err) {
      this.appLogger.error(
        err,
        err.stack,
        `[AuthController][${TOPIC_AUTH_LOGIN}] -> [loginUser]`,
      );
      throw new RpcException(JSON.stringify(err));
    }
  }

  @MessagePattern(TOPIC_AUTH_VERIFY_TOKEN)
  verifyToken(@Payload() message: IKafkaMessage<string>): boolean {
    try {
      this.appLogger.log(
        `[AuthController][${TOPIC_AUTH_VERIFY_TOKEN}] -> [verifyToken]`,
      );
      return this.authService.verifyToken(message.value);
    } catch (err) {
      this.appLogger.error(
        err,
        err.stack,
        `[AuthController][${TOPIC_AUTH_VERIFY_TOKEN}] -> [verifyToken]`,
      );
      throw new RpcException(JSON.stringify(err));
    }
  }
  @EventPattern(TOPIC_AUTH_VERIFY_TOKEN_REPLY)
  async logVerifyToken(): Promise<void> {
    this.appLogger.log(
      `[AuthController][${TOPIC_AUTH_VERIFY_TOKEN}][SEND] -> [registerUser]`,
    );
  }

  @MessagePattern(TOPIC_AUTH_VERIFICATION)
  async verificationUser(
    @Payload() message: IKafkaMessage<VerificationUserDto>,
  ) {
    try {
      this.appLogger.log(
        `[AuthController][${TOPIC_AUTH_VERIFICATION}] -> [verificationUser]`,
      );
      console.log('MESSAGE', message.value);
      return await this.authService.verificationUser(message.value);
    } catch (err) {
      this.appLogger.error(
        err,
        err.stack,
        `[AuthController][${TOPIC_AUTH_VERIFICATION}] -> [verificationUser]`,
      );
      throw new RpcException(JSON.stringify(err));
    }
  }
  @EventPattern(TOPIC_AUTH_VERIFICATION_REPLY)
  async logVerificationUser(): Promise<void> {
    this.appLogger.log(
      `[AuthController][${TOPIC_AUTH_VERIFICATION}][SEND] -> [verificationUser]`,
    );
  }
}
