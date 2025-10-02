import { AuthService, LoginResponse } from './auth.service';
import { UserRole } from '../../entities/user.entity';
declare class LoginDto {
    email: string;
    password: string;
}
declare class RegisterDto {
    email: string;
    password: string;
    personalData: {
        firstName: string;
        lastName: string;
        phone?: string;
        department?: string;
    };
    role?: UserRole;
}
declare class ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
}
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto): Promise<LoginResponse>;
    register(registerDto: RegisterDto): Promise<import("../../entities/user.entity").User>;
    getProfile(req: any): any;
    changePassword(req: any, changePasswordDto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    logout(): Promise<{
        message: string;
    }>;
}
export {};
