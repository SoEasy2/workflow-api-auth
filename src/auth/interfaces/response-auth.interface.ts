import { User } from '../entities/User';
import { IToken } from './token.interface';

export interface IResponseAuth {
    user: User;
    tokens: IToken;
}