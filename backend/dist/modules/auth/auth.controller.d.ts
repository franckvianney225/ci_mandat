import { Response } from 'express';
import { AuthService } from './auth.service';
import { UserRole } from '../../entities/user.entity';
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
declare class UpdateProfileDto {
    firstName: string;
    lastName: string;
    phone?: string;
}
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(body: any, res: Response): Promise<{
        user: any;
        access_token: string;
    }>;
    register(registerDto: RegisterDto): Promise<import("../../entities/user.entity").User>;
    getProfile(req: any): any;
    changePassword(req: any, changePasswordDto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    updateProfile(req: any, updateProfileDto: UpdateProfileDto): Promise<import("../../entities/user.entity").User>;
    logout(res: Response): Promise<{
        message: string;
    }>;
}
export {};
