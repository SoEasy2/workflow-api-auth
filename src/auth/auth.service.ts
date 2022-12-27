import {
  Inject,
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ClientKafka, RpcException } from '@nestjs/microservices';
import { CreateUserDto } from './dto/create-user-dto';
import {
  TOPIC_COMPANY_CREATE,
  TOPIC_COMPANY_GET_BY_CODE,
  TOPIC_COMPANY_GET_BY_ID,
  TOPIC_COMPANY_UPDATE,
  TOPIC_MAILER_SEND,
  TOPIC_USER_CREATE,
  TOPIC_USER_FIND_BY_EMAIL,
  TOPIC_USER_FIND_BY_EMAIL_OR_PHONE,
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
import { ICryptPassword } from './interfaces/crypt-password.interface';
import { DetailsUserByCompanyCodeDto } from './dto/details-user-by-company-code.dto';
import { TypeRegistration } from '../shared/users/enums/typeRegistration';
import { StepConnect } from '../common/constants/users/enums/stepConnect';

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
      TOPIC_USER_FIND_BY_EMAIL_OR_PHONE,
    ];
    const topicsCompany: Array<string> = [
      TOPIC_COMPANY_CREATE,
      TOPIC_COMPANY_GET_BY_ID,
      TOPIC_COMPANY_GET_BY_CODE,
      TOPIC_COMPANY_UPDATE,
    ];
    topicsUser.forEach((topic) => {
      this.clientUser.subscribeToResponseOf(topic);
    });
    topicsCompany.forEach((topic) => {
      this.clientCompany.subscribeToResponseOf(topic);
    });
    await Promise.all([
      this.clientUser.connect(),
      this.clientCompany.connect(),
    ]);
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
    const { login } = dto;
    const user = await new Promise<User>((resolve, reject) => {
      this.clientUser.send(TOPIC_USER_FIND_BY_EMAIL_OR_PHONE, login).subscribe({
        next: (response) => resolve(response),
        error: (error) => reject(error),
      });
    });
    if (!user) {
      throw new RpcException('User not found');
    }
    const { password: hashPassword, salt } = user;
    const isPasswordCorrect = await this.comparePassword(
      dto.password,
      salt,
      hashPassword,
    );
    if (!isPasswordCorrect) {
      throw new RpcException('Password is incorrect');
    }
    if (user.currentCompany) {
      const tokens = this.jwtService.generateTokens(user);
      user.currentCompany = await new Promise<Company>((resolve, reject) => {
        this.clientCompany
          .send(TOPIC_COMPANY_GET_BY_ID, user.currentCompany)
          .subscribe({
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

  async verificationConnectUser(dto: VerificationUserDto): Promise<User> {
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
      stepRegistration: StepConnect.CONNECT_COMPLETE,
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
        this.clientCompany
          .send(TOPIC_COMPANY_GET_BY_ID, user.currentCompany)
          .subscribe({
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

  async details(dto: DetailsUserDto): Promise<User> {
    const { user: userDto, company: companyDto } = dto;
    const user = await new Promise<User>((resolve, reject) => {
      this.clientUser.send(TOPIC_USER_FIND_BY_EMAIL, userDto.email).subscribe({
        next: (response) => resolve(response),
        error: (error) => reject(error),
      });
    });
    if (!user) throw new RpcException('User not found');
    const codeCompany = this.generateCodeCompany(4);
    const company = await new Promise<Company>((resolve, reject) => {
      this.clientCompany
        .send(TOPIC_COMPANY_CREATE, {
          ...companyDto,
          user: user.id,
          targetUser: [user.id],
          code: codeCompany,
        })
        .subscribe({
          next: (response) => resolve(response),
          error: (error) => reject(error),
        });
    });
    const cryptPassword = await this.cryptPassword(userDto.password);
    const updatedUser = await new Promise<User>((resolve, reject) => {
      this.clientUser
        .send(TOPIC_USER_UPDATE, {
          ...userDto,
          ...cryptPassword,
          stepRegistration: StepRegistration.COMPLETE,
          currentCompany: company.id,
        })
        .subscribe({
          next: (response) => resolve(response),
          error: (error) => reject(error),
        });
    });
    return { ...updatedUser, currentCompany: company };
  }

  async registerByCode(code: string): Promise<string> {
    const company = await new Promise<Company>((resolve, reject) => {
      this.clientCompany.send(TOPIC_COMPANY_GET_BY_CODE, code).subscribe({
        next: (response) => resolve(response),
        error: (error) => reject(error),
      });
    });
    return company.id;
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

  async detailsByCodeCompany(
    detailsUserByCompanyCodeDto: DetailsUserByCompanyCodeDto,
  ): Promise<IResponseAuth> {
    const code = this.generateCode(4);
    const user = await new Promise<User>((resolve, reject) => {
      this.clientUser
        .send(TOPIC_USER_CREATE, {
          ...detailsUserByCompanyCodeDto,
          codeEmail: code,
          stepRegistration: StepConnect.CONNECT_VERIFICATION,
          sendCodeDate: new Date(),
          typeRegistration: TypeRegistration.REGISTRATION_BY_CODE,
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
    const company = await new Promise<Company>((resolve, reject) => {
      this.clientCompany
        .send(TOPIC_COMPANY_GET_BY_ID, user.currentCompany)
        .subscribe({
          next: (response) => resolve(response),
          error: (error) => reject(error),
        });
    });
    user.currentCompany = await new Promise<Company>((resolve, reject) => {
      this.clientCompany
        .send(TOPIC_COMPANY_UPDATE, {
          ...company,
          targetUser: [...company.targetUser, user.id],
        })
        .subscribe({
          next: (response) => resolve(response),
          error: (error) => reject(error),
        });
    });

    const tokens = this.jwtService.generateTokens(user);
    return { user, tokens };
  }

  async cryptPassword(password: string): Promise<ICryptPassword> {
    const saltOrRounds = 10;
    const salt = await bcrypt.genSalt(saltOrRounds);
    const hash = await bcrypt.hash(password, salt);
    return {
      password: hash,
      salt,
    };
  }

  async comparePassword(
    password: string,
    salt: string,
    hashPassword,
  ): Promise<boolean> {
    const hash = await bcrypt.hash(password.trim(), salt.trim());
    return hash === hashPassword;
  }
  generateCodeCompany(length: number) {
    let text = '';
    const possible =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';

    for (let i = 0; i < length; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
  }
}
