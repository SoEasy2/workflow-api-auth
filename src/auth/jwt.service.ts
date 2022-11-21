import { Injectable } from '@nestjs/common';
import { IToken } from './interfaces/token.interface';
import { PayloadTokenDto } from './dto/payload-token.dto';
import * as jwt from 'jsonwebtoken';
import { sign, verify } from 'jsonwebtoken';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class JwtService {
  generateTokens(payload: any): IToken {
    const payloadToken = new PayloadTokenDto(payload);
    const accessToken = sign(
      { ...payloadToken },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_ACCESS_EXPIRE || '1m' },
    );
    const refreshToken = sign(
      { ...payloadToken },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_REFRESH_EXPIRE || '1d' },
    );
    return {
      accessToken,
      refreshToken,
    };
  }

  validateToken(token: string): boolean {
    try {
      return !!verify(token, process.env.JWT_SECRET || 'secret');
    } catch (e) {
      throw new RpcException(e);
    }
  }

  decodeToken(token: string): PayloadTokenDto {
    try {
      return jwt.decode(token) as PayloadTokenDto;
    } catch (e) {
        throw new RpcException(e);
    }
  }
}
