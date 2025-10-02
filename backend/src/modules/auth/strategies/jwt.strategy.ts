import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User, UserStatus } from '../../entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: any) {
    const user = await this.usersRepository.findOne({ 
      where: { id: payload.sub } 
    });

    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Compte non actif');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      personalData: user.personalData,
    };
  }
}