import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { User } from "../entities/user.entity";
import { JwtPayload } from "../interfaces/JwtPayload.interface";
import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {


    constructor(@InjectRepository(User) private readonly userRepository: Repository<User>,

        configService: ConfigService
    ) {
        super({
            secretOrKey: configService.get('JWT_SECRET'),
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

        })
    }

    async validate(payload: JwtPayload): Promise<User> {
        console.log("Aqui");

        const { id } = payload;

        const user = await this.userRepository.findOneBy({ id })

        if (!user) {
            throw new UnauthorizedException('Token no valid')
        }
        if (!user.isActive) {
            throw new UnauthorizedException('User is inactive, talk with an admin')
        }




        return user;

    }

}