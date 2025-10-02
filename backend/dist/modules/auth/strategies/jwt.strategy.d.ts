import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { User, UserStatus } from '../../../entities/user.entity';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private configService;
    private usersRepository;
    constructor(configService: ConfigService, usersRepository: Repository<User>);
    validate(payload: any): Promise<{
        id: string;
        email: string;
        role: import("../../../entities/user.entity").UserRole;
        status: UserStatus.ACTIVE;
        personalData: {
            firstName: string;
            lastName: string;
            phone?: string;
            department?: string;
        };
    }>;
}
export {};
