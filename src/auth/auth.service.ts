import { Repository } from 'typeorm';
import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';

import * as bcrypt from 'bcrypt'
import { CreateUserDto, LoginDto } from './dto';
import { JwtPayload } from './interfaces/JwtPayload.interface';
import { JwtService } from '@nestjs/jwt';



@Injectable()
export class AuthService {
  checkAuthStatus(user: User) {

    return {
      ...user,
      token: this.getJwt({ id: user.id })
    };
  }


  constructor(@InjectRepository(User) private UserRepository: Repository<User>, private readonly jwtService: JwtService) {

  }

  //Create users
  async create(createUserDto: CreateUserDto) {
    try {
      const { password, ...userData } = createUserDto

      const user = this.UserRepository.create({
        ...userData,
        password: bcrypt.hashSync(password, 10)
      })



      await this.UserRepository.save(user);

      delete user.password;
      return {
        ...user,
        token: this.getJwt({ id: user.id })
      };

    } catch (error) {
      this.handleDbError(error)
    }
  }


  //Login
  async login(loginDto: LoginDto) {
    const { password, email } = loginDto;

    const user = await this.UserRepository.findOne({
      where: { email },
      select: { id: true, password: true, email: true }

    })

    if (!user) {
      throw new UnauthorizedException("Not valid credential")
    }

    if (!bcrypt.compareSync(password, user.password)) {
      throw new UnauthorizedException("Not valid credential")

    }

    delete user.password;

    return {

      ...user,
      token: this.getJwt({ id: user.id })

    };




  }

  private getJwt(payload: JwtPayload) {

    const jwt = this.jwtService.sign(payload);

    return jwt;
  }

  private handleDbError(error: any): never {
    if (error.code === '23505') {
      throw new BadRequestException(`${error.detail}`);
    }
    console.log(error);

    throw new InternalServerErrorException("Please check server logs")

  }

}
