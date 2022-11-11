import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientKafka, RpcException } from '@nestjs/microservices';
import { CreateUserDto } from './dto/create-user-dto';
import {
  TOPIC_MAILER_SEND,
  TOPIC_USER_CHECK_PASSWORD,
  TOPIC_USER_CREATE,
  TOPIC_USER_FIND_BY_EMAIL,
} from '../common/constants';
import { JwtService } from './jwt.service';
import { IResponseAuth } from './interfaces/response-auth.interface';
import { User } from './entities/User';
import { stepRegistration } from '../shared/users/enums/stepRegistration';
import { LoginUserDto } from './dto/login-user-dto';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    @Inject('USERS_SERVICE') private readonly clientUser: ClientKafka,
    @Inject('MAILER_SERVICE') private readonly clientMailer: ClientKafka,
    private readonly jwtService: JwtService,
  ) {}
  async onModuleInit() {
    const topics: Array<string> = [TOPIC_USER_CREATE, TOPIC_MAILER_SEND];
    topics.forEach((topic) => {
      this.clientUser.subscribeToResponseOf(topic);
    });
    await this.clientUser.connect();
  }

  async registerUser(createUserDto: CreateUserDto): Promise<IResponseAuth> {
    const code = this.generateCode(4);
    await new Promise<any>((resolve, reject) => {
      this.clientUser.emit(TOPIC_MAILER_SEND, { code }).subscribe({
        next: (response) => resolve(response),
        error: (error) => reject(error),
      });
    });
    const user = await new Promise<User>((resolve, reject) => {
      this.clientUser
        .send(TOPIC_USER_CREATE, {
          ...createUserDto,
          code,
          stepRegistration: stepRegistration.VERIFICATION,
          sendCodeDate: new Date(),
        })
        .subscribe({
          next: (response) => resolve(response),
          error: (error) => reject(error),
        });
    });

    const tokens = this.jwtService.generateTokens(user);
    return { user, tokens };
  }

  async loginUser(dto: LoginUserDto): Promise<IResponseAuth> {
    try {
      const { email } = dto;
      const user = await new Promise<User>((resolve, reject) => {
        this.clientUser.send(TOPIC_USER_FIND_BY_EMAIL, email).subscribe({
          next: (response) => resolve(response),
          error: (error) => reject(error),
        });
      });
      if (!user) {
        throw new RpcException('User not found');
      }
      const isPasswordCorrect = await new Promise<boolean>(
        (resolve, reject) => {
          this.clientUser.send(TOPIC_USER_CHECK_PASSWORD, dto).subscribe({
            next: (response) => resolve(response),
            error: (error) => reject(error),
          });
        },
      );
      if (!isPasswordCorrect) {
        throw new RpcException('Password is incorrect');
      }

      const tokens = this.jwtService.generateTokens(user);
      return { user, tokens };
    } catch (e) {
      throw new RpcException(JSON.stringify(e));
    }
  }

  verifyToken(token: string): boolean {
    console.log('TOKEN', token);
    return this.jwtService.validateToken(token);
  }

  generateCode(n: number) {
    const add = 1;
    let max = 12 - add;
    if (n > max) {
      return this.generateCode(max) + this.generateCode(n - max);
    }
    max = Math.pow(10, n + add);
    const min = max / 10;
    const number = Math.floor(Math.random() * (max - min + 1)) + min;

    return ('' + number).substring(add);
  }
}
