import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { User } from '../../../entities/user.entity';
declare const JwtStrategy_base: any;
export declare class JwtStrategy extends JwtStrategy_base {
    private configService;
    private usersRepository;
    constructor(configService: ConfigService, usersRepository: Repository<User>);
    validate(payload: any): Promise<{
        id: any;
        email: any;
        role: any;
        status: any;
        personalData: any;
    }>;
}
export {};
