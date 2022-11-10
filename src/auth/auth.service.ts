import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { CreateUserDto } from './dto/create-user-dto';
import { TOPIC_MAILER_SEND, TOPIC_USER_CREATE } from '../common/constants';
import { JwtService } from './jwt.service';
import { IResponseAuth } from './interfaces/response-auth.interface';
import { User } from './entities/User';
import { stepRegistration } from '../shared/users/enums/stepRegistration';

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
      this.clientUser.send(TOPIC_USER_CREATE, {
        ...createUserDto,
        code,
        stepRegistration: stepRegistration.VERIFICATION,
        sendCodeDate: new Date(),
      }).subscribe({
        next: (response) => resolve(response),
        error: (error) => reject(error),
      });
    });

    const tokens = this.jwtService.generateTokens(user);
    return { user, tokens };
  }
  generateCode(n: number) {
    const add = 1;
    let max = 12 - add;
    if (n > max) {
      return this.generateCode(max) + this.generateCode(n - max);
    }
    max = Math.pow(10, n + add);
    const min = max / 10;
    const number = Math.floor( Math.random() * (max - min + 1) ) + min;

    return ("" + number).substring(add);
  }
}
