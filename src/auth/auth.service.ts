import { Inject, Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { ClientKafka, RpcException } from '@nestjs/microservices';
import { CreateUserDto } from './dto/create-user-dto';
import {
  TOPIC_COMPANY_CREATE,
  TOPIC_COMPANY_GET_BY_ID,
  TOPIC_MAILER_SEND,
  TOPIC_USER_CHECK_PASSWORD,
  TOPIC_USER_CREATE,
  TOPIC_USER_FIND_BY_EMAIL,
  TOPIC_USER_UPDATE,
} from '../common/constants';
import { JwtService } from './jwt.service';
import { IResponseAuth } from './interfaces/response-auth.interface';
import { User } from './entities/User';
import { StepRegistration } from '../shared/users/enums/stepRegistration';
import { LoginUserDto } from './dto/login-user-dto';
import { VerificationUserDto } from './dto/verification-user-dto';
import { DetailsUserDto } from './dto/details-user-dto';
import { Company } from './entities/Company';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    @Inject('USERS_SERVICE') private readonly clientUser: ClientKafka,
    @Inject('COMPANY_SERVICE') private readonly clientCompany: ClientKafka,
    @Inject('MAILER_SERVICE') private readonly clientMailer: ClientKafka,
    private readonly jwtService: JwtService,
  ) {}
  async onModuleInit() {
    const topicsUser: Array<string> = [
      TOPIC_USER_CREATE,
      TOPIC_USER_FIND_BY_EMAIL,
      TOPIC_USER_UPDATE,
    ];
    const topicsCompany: Array<string> = [
      TOPIC_COMPANY_CREATE,
      TOPIC_COMPANY_GET_BY_ID,
    ]
    topicsUser.forEach((topic) => {
      this.clientUser.subscribeToResponseOf(topic);
    });
    topicsCompany.forEach((topic) => {
      this.clientCompany.subscribeToResponseOf(topic);
    })
    await Promise.all([
      this.clientUser.connect(),
      this.clientCompany.connect()
    ])
  }

  async registerUser(createUserDto: CreateUserDto): Promise<IResponseAuth> {
    const code = this.generateCode(4);
    const user = await new Promise<User>((resolve, reject) => {
      this.clientUser
        .send(TOPIC_USER_CREATE, {
          ...createUserDto,
          codeEmail: code,
          stepRegistration: StepRegistration.VERIFICATION,
          sendCodeDate: new Date(),
        })
        .subscribe({
          next: (response) => resolve(response),
          error: (error) => reject(error),
        });
    });
    await new Promise<any>((resolve, reject) => {
      this.clientUser.emit(TOPIC_MAILER_SEND, { code }).subscribe({
        next: (response) => resolve(response),
        error: (error) => reject(error),
      });
    });

    const tokens = this.jwtService.generateTokens(user);
    return { user, tokens };
  }

  async loginUser(dto: LoginUserDto): Promise<IResponseAuth> {
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
  }

  verifyToken(token: string): boolean {
    return this.jwtService.validateToken(token);
  }

  async verificationUser(dto: VerificationUserDto): Promise<User> {
      const user = await new Promise<User>((resolve, reject) => {
        this.clientUser.send(TOPIC_USER_FIND_BY_EMAIL, dto.email).subscribe({
          next: (response) => resolve(response),
          error: (error) => reject(error),
        });
      });

      if (!user) {
        throw new RpcException('User not found');
      }
      const { codeEmail } = user;
      if (codeEmail !== dto.emailCode) {
        throw new RpcException('Code is incorrect');
      }
      // const currentDate = new Date();
      // currentDate.setSeconds(currentDate.getSeconds() + 30);
      // if (currentDate < sendCodeDate ) {
      //   throw new RpcException('Code is expired');
      // }
      const updateDto = {
        stepRegistration: StepRegistration.DETAILS,
        id: user.id,
      };
      return await new Promise<User>((resolve, reject) => {
        this.clientUser.send(TOPIC_USER_UPDATE, updateDto).subscribe({
          next: (response) => resolve(response),
          error: (error) => reject(error),
        });
      });
  }

  async refreshUser(refresh_token: string): Promise<IResponseAuth> {
      const isValidToken = this.jwtService.validateToken(refresh_token);
      if (!isValidToken) {
        throw new RpcException(new UnauthorizedException());
      }
      const payload = this.jwtService.decodeToken(refresh_token);
      const user = await new Promise<User>((resolve, reject) => {
        this.clientUser.send(TOPIC_USER_FIND_BY_EMAIL, payload.email).subscribe({
          next: (response) => resolve(response),
          error: (error) => reject(error),
        });
      });
      if (user.currentCompany) {
        const tokens = this.jwtService.generateTokens(user);
        user.currentCompany = await new Promise<Company>((resolve, reject) => {
          this.clientCompany.send(TOPIC_COMPANY_GET_BY_ID, user.currentCompany).subscribe({
            next: (response) => resolve(response),
            error: (error) => reject(error),
          });
        });
        return { user, tokens };
      }
      user.currentCompany = null;
      const tokens = this.jwtService.generateTokens(user);
      return { user, tokens };
  }

  async verificationResendCode(email: string): Promise<User> {
     const code = this.generateCode(4);
     const user = await new Promise<User>((resolve, reject) => {
       this.clientUser.send(TOPIC_USER_FIND_BY_EMAIL, email).subscribe({
         next: (response) => resolve(response),
         error: (error) => reject(error),
       });
     });
     if (!user) throw new RpcException('User not found');
     // await new Promise<any>((resolve, reject) => {
     //   this.clientUser.emit(TOPIC_MAILER_SEND, { code }).subscribe({
     //     next: (response) => resolve(response),
     //     error: (error) => reject(error),
     //   });
     // });
     const updateDto = {
       codeEmail: code,
       id: user.id,
       sendCodeDate: new Date(),
     };
     return new Promise<User>((resolve, reject) => {
       this.clientUser.send(TOPIC_USER_UPDATE, updateDto).subscribe({
         next: (response) => resolve(response),
         error: (error) => reject(error),
       });
     });
  }

  async details(dto: DetailsUserDto): Promise<User>{
      const {user: userDto, company: companyDto} = dto;
      const user = await new Promise<User>((resolve, reject) => {
        this.clientUser.send(TOPIC_USER_FIND_BY_EMAIL, userDto.email).subscribe({
          next: (response) => resolve(response),
          error: (error) => reject(error),
        });
      });
      if (!user) throw new RpcException('User not found');
      const company = await new Promise<Company>((resolve, reject) => {
        this.clientCompany.send(TOPIC_COMPANY_CREATE, {
          ...companyDto,
          user: user.id,
          targetUser: [user.id]
        }).subscribe({
          next: (response) => resolve(response),
          error: (error) => reject(error),
        });
      });
      const updatedUser = await new Promise<User>((resolve, reject) => {
        this.clientUser.send(TOPIC_USER_UPDATE, {
          ...userDto,
          stepRegistration: StepRegistration.COMPLETE,
          currentCompany: company.id
        }).subscribe({
          next: (response) => resolve(response),
          error: (error) => reject(error),
        });
      });
      console.log('updateted user', updatedUser)
      return {...updatedUser, currentCompany: company}
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
