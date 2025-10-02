import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User, UserRole, UserStatus } from '../../entities/user.entity';
export interface LoginResponse {
    access_token: string;
    user: {
        id: string;
        email: string;
        role: UserRole;
        status: UserStatus;
        personalData: {
            firstName: string;
            lastName: string;
            phone?: string;
            department?: string;
        };
        createdAt: string;
        lastLogin?: string;
        loginAttempts: number;
    };
}
export declare class AuthService {
    private usersRepository;
    private jwtService;
    constructor(usersRepository: Repository<User>, jwtService: JwtService);
    validateUser(email: string, password: string): Promise<User>;
    login(email: string, password: string): Promise<LoginResponse>;
    register(email: string, password: string, personalData: {
        firstName: string;
        lastName: string;
        phone?: string;
        department?: string;
    }, role?: UserRole): Promise<User>;
    validateToken(userId: string): Promise<User>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;
}
