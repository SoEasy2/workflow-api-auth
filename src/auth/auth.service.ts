import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { CreateUserDto } from './dto/create-user-dto';
import { TOPIC_MAILER_SEND, TOPIC_USER_CREATE } from '../common/constants';
import { JwtService } from './jwt.service';
import { IResponseAuth } from './interfaces/response-auth.interface';
import { User } from './entities/User';
import { IToken } from './interfaces/token.interface';

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
    const user = await new Promise<User>((resolve, reject) => {
      this.clientUser.send(TOPIC_USER_CREATE, { ...createUserDto }).subscribe({
        next: (response) => resolve(response),
        error: (error) => reject(error),
      });
    });
    const test = await new Promise<any>((resolve, reject) => {
      this.clientUser.send(TOPIC_MAILER_SEND, { ...createUserDto }).subscribe({
        next: (response) => resolve(response),
        error: (error) => reject(error),
      });
    });
    console.log("TEST", test)
    const tokens = this.jwtService.generateTokens(user);
    return { user, tokens };
  }
}
