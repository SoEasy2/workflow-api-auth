import { Catch, RpcExceptionFilter } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';

/**
 * @class RpcExceptionFilter
 * @classdesc - This class is a custom exception filter for NestJS to catch RPC exceptions
 */
@Catch(RpcException)
export class ExceptionFilter implements RpcExceptionFilter {
  catch(exception: RpcException): Observable<any> {
    return throwError(() => exception.getError());
  }
}
