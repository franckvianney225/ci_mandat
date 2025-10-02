import { Repository } from 'typeorm';
import { User, UserRole, UserStatus } from '../../entities/user.entity';
interface CreateUserDto {
    email: string;
    password: string;
    role: UserRole;
    personalData: {
        firstName: string;
        lastName: string;
        phone?: string;
        department?: string;
    };
}
interface UpdateUserDto {
    email?: string;
    role?: UserRole;
    status?: UserStatus;
    personalData?: {
        firstName?: string;
        lastName?: string;
        phone?: string;
        department?: string;
    };
}
interface UserFilters {
    search?: string;
    role?: UserRole;
    status?: UserStatus;
    page?: number;
    limit?: number;
}
export declare class UsersService {
    private usersRepository;
    constructor(usersRepository: Repository<User>);
    createDefaultAdmin(): Promise<void>;
    findAll(filters?: UserFilters): Promise<{
        data: User[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string): Promise<User>;
    findByEmail(email: string): Promise<User | null>;
    create(createUserDto: CreateUserDto): Promise<User>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<User>;
    remove(id: string): Promise<void>;
    activateUser(id: string): Promise<User>;
    suspendUser(id: string): Promise<User>;
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
    resetPassword(id: string, newPassword: string): Promise<void>;
}
export {};
