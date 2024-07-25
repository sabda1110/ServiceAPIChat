import {
  ExecutionContext,
  HttpException,
  createParamDecorator,
} from '@nestjs/common';

export const Auth = createParamDecorator(
  (data: unknown, content: ExecutionContext) => {
    const request = content.switchToHttp().getRequest();
    const user = request.user;

    if (user) return user;
    if (!user) throw new HttpException('Unauthorized', 401);
  },
);
