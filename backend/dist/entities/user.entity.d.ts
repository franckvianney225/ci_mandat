export declare enum UserRole {
    ADMIN = "admin",
    SUPER_ADMIN = "super_admin"
}
export declare enum UserStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    SUSPENDED = "suspended",
    PENDING_VERIFICATION = "pending_verification"
}
export declare class User {
    id: string;
    email: string;
    passwordHash: string;
    role: UserRole;
    status: UserStatus;
    personalData: {
        firstName: string;
        lastName: string;
        phone?: string;
        department?: string;
    };
    createdAt: string;
    lastLogin: string;
    loginAttempts: number;
    validateEmail(): void;
    getFullName(): string;
    toJSON(): Omit<this, "passwordHash" | "validateEmail" | "getFullName" | "toJSON">;
}
