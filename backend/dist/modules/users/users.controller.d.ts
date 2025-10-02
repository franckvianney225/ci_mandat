import { UsersService } from './users.service';
import { UserRole, UserStatus } from '../../entities/user.entity';
declare class PersonalDataDto {
    firstName: string;
    lastName: string;
    phone?: string;
    department?: string;
}
declare class CreateUserDto {
    email: string;
    password: string;
    role: UserRole;
    personalData: PersonalDataDto;
}
declare class UpdateUserDto {
    email?: string;
    role?: UserRole;
    status?: UserStatus;
    personalData?: PersonalDataDto;
}
declare class UserFiltersDto {
    search?: string;
    role?: UserRole;
    status?: UserStatus;
    page?: number;
    limit?: number;
}
declare class ResetPasswordDto {
    newPassword: string;
}
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(filters: UserFiltersDto): Promise<{
        data: import("../../entities/user.entity").User[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getStatistics(): Promise<{
        total: number;
        byStatus: {
            active: number;
            pending: number;
            suspended: number;
        };
        byRole: {
            admin: number;
            superAdmin: number;
        };
    }>;
    findOne(id: string): Promise<import("../../entities/user.entity").User>;
    create(createUserDto: CreateUserDto): Promise<import("../../entities/user.entity").User>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<import("../../entities/user.entity").User>;
    remove(id: string): Promise<void>;
    activateUser(id: string): Promise<import("../../entities/user.entity").User>;
    suspendUser(id: string): Promise<import("../../entities/user.entity").User>;
    resetPassword(id: string, resetPasswordDto: ResetPasswordDto): Promise<{
        message: string;
    }>;
}
export {};
