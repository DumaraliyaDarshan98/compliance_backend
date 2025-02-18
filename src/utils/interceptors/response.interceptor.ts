import { Injectable, NestInterceptor, ExecutionContext, CallHandler, HttpException, HttpStatus } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
    status?: number;
    message?: string;
    data: T;
}

@Injectable()
export class ResponseFormateInterceptor<T> implements NestInterceptor<T, Response<T>> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
        return next.handle().pipe(
            map((data) => {
                const response = context.switchToHttp().getResponse();
                // Check if the status code is not 200
                if (
                    (response.statusCode === HttpStatus.OK || response.statusCode === HttpStatus.CREATED) &&
                    data?.code !== HttpStatus.OK
                ) {
                    const errorCode = data?.code || response.statusCode;
                    const errorMessage = data?.message || null;
                    throw new HttpException(
                        {
                            statusCode: errorCode,
                            message: errorMessage,
                            data: data?.data || null
                        },
                        errorCode
                    );
                }

                return {
                    statusCode: data?.code || response.statusCode,
                    data: data?.data || null,
                    message: data?.message || null
                };
            })
        );
    }
}
