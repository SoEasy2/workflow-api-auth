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
  TOPIC_AUTH_DETAILS,
  TOPIC_AUTH_DETAILS_BY_CODE_COMPANY,
  TOPIC_AUTH_DETAILS_BY_CODE_COMPANY_REPLY,
  TOPIC_AUTH_DETAILS_REPLY,
  TOPIC_AUTH_LOGIN,
  TOPIC_AUTH_LOGIN_REPLY,
  TOPIC_AUTH_REFRESH,
  TOPIC_AUTH_REFRESH_REPLY,
  TOPIC_AUTH_REGISTER,
  TOPIC_AUTH_REGISTER_BY_CODE,
  TOPIC_AUTH_REGISTER_BY_CODE_REPLY,
  TOPIC_AUTH_REGISTER_REPLY,
  TOPIC_AUTH_VERIFICATION,
  TOPIC_AUTH_VERIFICATION_REPLY,
  TOPIC_AUTH_VERIFICATION_RESEND,
  TOPIC_AUTH_VERIFICATION_RESEND_REPLY,
  TOPIC_AUTH_VERIFY_TOKEN,
  TOPIC_AUTH_VERIFY_TOKEN_REPLY,
} from '../common/constants';
import { IKafkaMessage } from '../common/interfaces/kafka-message.interface';
import { CreateUserDto } from './dto/create-user-dto';
import { ExceptionFilter } from '../exceptions/rpc-exception.filter';
import { IResponseAuth } from './interfaces/response-auth.interface';
import { VerificationUserDto } from './dto/verification-user-dto';
import { LoginUserDto } from './dto/login-user-dto';
import { DetailsUserDto } from './dto/details-user-dto';
import { User } from './entities/User';
import { DetailsUserByCompanyCodeDto } from './dto/details-user-by-company-code.dto';

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
  @EventPattern(TOPIC_AUTH_LOGIN_REPLY)
  async logLoginUser(): Promise<void> {
    this.appLogger.log(
      `[AuthController][${TOPIC_AUTH_LOGIN}][SEND] -> [loginUser]`,
    );
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

  @MessagePattern(TOPIC_AUTH_VERIFICATION)
  async verificationConnectUser(
    @Payload() message: IKafkaMessage<VerificationUserDto>,
  ) {
    try {
      this.appLogger.log(
        `[AuthController][${TOPIC_AUTH_VERIFICATION}] -> [verificationUser]`,
      );
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
  async logVerificationConnectUser(): Promise<void> {
    this.appLogger.log(
      `[AuthController][${TOPIC_AUTH_VERIFICATION}][SEND] -> [verificationUser]`,
    );
  }

  @MessagePattern(TOPIC_AUTH_REFRESH)
  async refreshUser(@Payload() message: IKafkaMessage<string>) {
    try {
      this.appLogger.log(
        `[AuthController][${TOPIC_AUTH_REFRESH}] -> [refreshUser]`,
      );
      return await this.authService.refreshUser(message.value);
    } catch (err) {
      this.appLogger.error(
        err,
        err.stack,
        `[AuthController][${TOPIC_AUTH_REFRESH}] -> [refreshUser]`,
      );
      throw new RpcException(JSON.stringify(err));
    }
  }
  @EventPattern(TOPIC_AUTH_REFRESH_REPLY)
  async logRefreshUser(): Promise<void> {
    this.appLogger.log(
      `[AuthController][${TOPIC_AUTH_REFRESH}][SEND] -> [refreshUser]`,
    );
  }

  @MessagePattern(TOPIC_AUTH_DETAILS)
  async details(
    @Payload() message: IKafkaMessage<DetailsUserDto>,
  ): Promise<User> {
    try {
      this.appLogger.log(
        `[AuthController][${TOPIC_AUTH_DETAILS}] -> [details]`,
      );
      return await this.authService.details(message.value);
    } catch (err) {
      this.appLogger.error(
        err,
        err.stack,
        `[AuthController][${TOPIC_AUTH_DETAILS}] -> [details]`,
      );
      throw new RpcException(JSON.stringify(err));
    }
  }
  @EventPattern(TOPIC_AUTH_DETAILS_REPLY)
  logDetails() {
    this.appLogger.log(
      `[AuthController][${TOPIC_AUTH_DETAILS}][SEND] -> [details]`,
    );
  }

  @MessagePattern(TOPIC_AUTH_VERIFICATION_RESEND)
  async verificationResendCode(@Payload() message: IKafkaMessage<string>) {
    try {
      this.appLogger.log(
        `[AuthController][${TOPIC_AUTH_VERIFICATION_RESEND}] -> [verificationResendCode]`,
      );
      return await this.authService.verificationResendCode(message.value);
    } catch (err) {
      this.appLogger.error(
        err,
        err.stack,
        `[AuthController][${TOPIC_AUTH_VERIFICATION_RESEND}] -> [verificationResendCode]`,
      );
      throw new RpcException(JSON.stringify(err));
    }
  }
  @EventPattern(TOPIC_AUTH_VERIFICATION_RESEND_REPLY)
  logVerificationResendCode() {
    this.appLogger.log(
      `[AuthController][${TOPIC_AUTH_VERIFICATION_RESEND}][SEND] -> [verificationResendCode]`,
    );
  }

  @MessagePattern(TOPIC_AUTH_REGISTER_BY_CODE)
  async registerByCode(
    @Payload() message: IKafkaMessage<string>,
  ): Promise<string> {
    try {
      this.appLogger.log(
        `[AuthController][${TOPIC_AUTH_REGISTER_BY_CODE}] -> [registerByCode]`,
      );
      return await this.authService.registerByCode(message.value);
    } catch (err) {
      this.appLogger.error(
        err,
        err.stack,
        `[AuthController][${TOPIC_AUTH_REGISTER_BY_CODE}] -> [registerByCode]`,
      );
      throw new RpcException(JSON.stringify(err));
    }
  }
  @EventPattern(TOPIC_AUTH_REGISTER_BY_CODE_REPLY)
  logRegisterByCode(): void {
    this.appLogger.log(
      `[AuthController][${TOPIC_AUTH_REGISTER_BY_CODE}][SEND] -> [registerByCode]`,
    );
  }

  @MessagePattern(TOPIC_AUTH_DETAILS_BY_CODE_COMPANY)
  async detailsByCodeCompany(
    @Payload() message: IKafkaMessage<DetailsUserByCompanyCodeDto>,
  ): Promise<IResponseAuth> {
    try {
      this.appLogger.log(
        `[AuthController][${TOPIC_AUTH_DETAILS_BY_CODE_COMPANY}] -> [detailsByCodeCompany]`,
      );
      return await this.authService.detailsByCodeCompany(message.value);
    } catch (err) {
      this.appLogger.error(
        err,
        err.stack,
        `[AuthController][${TOPIC_AUTH_DETAILS_BY_CODE_COMPANY}] -> [detailsByCodeCompany]`,
      );
      throw new RpcException(JSON.stringify(err));
    }
  }
  @EventPattern(TOPIC_AUTH_DETAILS_BY_CODE_COMPANY_REPLY)
  logDetailsByCodeCompany(): void {
    this.appLogger.log(
      `[AuthController][${TOPIC_AUTH_DETAILS_BY_CODE_COMPANY}][SEND] -> [detailsByCodeCompany]`,
    );
  }
}
