import { Inject, Module, UseFilters } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './stategies/jwt.strategy';

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  imports: [TypeOrmModule.forFeature([User]), ConfigModule,


  PassportModule.register({
    defaultStrategy: 'jwt'
  }),

  //Modulo asyncrono
  JwtModule.registerAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => {
      console.log(configService.get('JWT_SECRET'));
      return {
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: '2h',
        }
      }
    }
  })


  ],
  exports: [TypeOrmModule, JwtStrategy, PassportModule, JwtModule]
})
export class AuthModule { }
