import { HttpStatus, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientKafka, RpcException } from '@nestjs/microservices';
import { User } from './entities/User';
import { CreateUserDto } from './dto/create-user-dto';
import { TOPIC_USER_CREATE } from '../common/constants';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    @Inject('USERS_SERVICE') private readonly clientUser: ClientKafka,
  ) {}
  async onModuleInit() {
    const topics: Array<string> = [TOPIC_USER_CREATE];
    topics.forEach((topic) => {
      this.clientUser.subscribeToResponseOf(topic);
    });
    await this.clientUser.connect();
  }
  async registerUser(createUserDto: CreateUserDto): Promise<any> {
    console.log('BEFORE CHECK');
    //  return this.clientUser.send(TOPIC_USER_CREATE, { ...createUserDto });
    return new Promise((resolve, reject) => {
      this.clientUser.send(TOPIC_USER_CREATE, { ...createUserDto }).subscribe({
        next: (response) => {
          console.log('RESPONSE', response);
          resolve(response);
        },
        error: (error) => {
          console.log('ERORR');
          reject(error);
        },
      });
    });
  }
}
