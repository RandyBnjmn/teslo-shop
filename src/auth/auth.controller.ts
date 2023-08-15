import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, SetMetadata } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto, LoginDto } from './dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from './decorators/get-user.decorator';
import { User } from './entities/user.entity';
import { GetRawHeaders } from './decorators/get-raw-header.decorator';
import { UserRoleGuard } from './guards/user-role.guard';
import { Auth, RoleProtected } from './decorators';
import { ValidRoles } from './enums/valid-roles.enum';



@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  create(@Body() createUserDto: CreateUserDto) {
    return this.authService.create(createUserDto);
  }

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto)

  }



  @Get("check-status")
  @Auth()
  checkStatus(
    @GetUser() user: User
  ) {
    return this.authService.checkAuthStatus(user)
  }



  @Get('private')
  @UseGuards(AuthGuard())
  checkPrivateRoute(
    @GetUser() user: User,
    @GetUser('email') userEmail: string,
    @GetRawHeaders() rawHeader: string[]
  ) {

    console.log(user);
    return {
      ok: true,
      message: "Check succes",
      user,
      userEmail,
      rawHeader
    }
  }


  @Get('private2')
  // @SetMetadata('roles', ["admin", "super-user"])
  @RoleProtected(ValidRoles.superUser)
  @UseGuards(AuthGuard(), UserRoleGuard)
  privateRoute2(
    @GetUser() user: User
  ) {

    return {
      ok: true,
      user
    }
  }


  @Get('private3')
  @Auth(ValidRoles.admin)
  privateRoute3(
    @GetUser() user: User
  ) {

    return {
      ok: true,
      user
    }
  }
}
