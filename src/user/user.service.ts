import { HttpException, Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { PrismaService } from 'src/common/prisma.service';
import { ValidationService } from 'src/common/validation.service';
import {
  LoginUserRequest,
  RegisterUserRequest,
  UpdateUserRequest,
  UserResponse,
} from 'src/model/user.model';
import { Logger } from 'winston';
import { UserValidation } from './user.validation';
import { v4 as uuid } from 'uuid';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(
    private validateionService: ValidationService,
    @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
    private prismaService: PrismaService,
  ) {}

  async register(request: RegisterUserRequest): Promise<UserResponse> {
    this.logger.info(request);
    const registerRequest: RegisterUserRequest =
      this.validateionService.validate(UserValidation.REGISTER, request);
    const totalUserWithSome = await this.prismaService.user.count({
      where: {
        username: registerRequest.username,
      },
    });
    console.log(totalUserWithSome);
    if (totalUserWithSome !== 0) {
      throw new HttpException('username already exists', 400);
    }

    registerRequest.password = await bcrypt.hash(registerRequest.password, 10);

    const user = await this.prismaService.user.create({
      data: registerRequest,
    });

    return {
      username: user.username,
      name: user.name,
    };
  }

  async login(request: LoginUserRequest): Promise<UserResponse> {
    this.logger.info(`User dapat nih mau coba gak ${JSON.stringify(request)}`);

    const loginRequest: LoginUserRequest = this.validateionService.validate(
      UserValidation.LOGIN,
      request,
    );

    let user = await this.prismaService.user.findUnique({
      where: {
        username: loginRequest.username,
      },
    });

    if (!user) throw new HttpException('Username or Password is worng', 401);

    const validatePassword = await bcrypt.compare(
      loginRequest.password,
      user.password,
    );

    if (!validatePassword)
      throw new HttpException('Username or Password is worng', 401);

    user = await this.prismaService.user.update({
      where: { username: loginRequest.username },
      data: {
        token: uuid(),
      },
    });

    return {
      username: user.username,
      name: user.name,
      token: user.token,
    };
  }

  async get(user: User): Promise<UserResponse> {
    return {
      username: user.username,
      name: user.name,
    };
  }

  async update(user: User, request: UpdateUserRequest): Promise<UserResponse> {
    const updateRequest: UpdateUserRequest = this.validateionService.validate(
      UserValidation.UPDATE,
      request,
    );

    if (updateRequest.name) user.name = updateRequest.name;
    if (updateRequest.password)
      user.password = await bcrypt.hash(updateRequest.password, 10);

    const result = await this.prismaService.user.update({
      where: {
        username: user.username,
      },
      data: user,
    });

    return {
      username: result.username,
      name: result.name,
    };
  }
}
