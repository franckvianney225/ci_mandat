import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import * as bcrypt from 'bcrypt';

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

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {
    this.createDefaultAdmin();
  }

  async createDefaultAdmin() {
    try {
      const defaultAdminEmail = 'admin@mandat.com';
      const defaultAdminPassword = 'admincimandat20_25';
      
      // Vérifier si l'admin par défaut existe déjà
      const existingAdmin = await this.findByEmail(defaultAdminEmail);
      if (existingAdmin) {
        console.log('✅ Compte administrateur par défaut existe déjà');
        return;
      }

      // Créer l'admin par défaut
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(defaultAdminPassword, saltRounds);

      const adminUser = this.usersRepository.create({
        email: defaultAdminEmail,
        passwordHash,
        role: UserRole.SUPER_ADMIN,
        status: UserStatus.ACTIVE,
        personalData: {
          firstName: 'Administrateur',
          lastName: 'Système',
          phone: '+225 00 00 00 00',
          department: 'Administration'
        }
      });

      await this.usersRepository.save(adminUser);
      console.log('✅ Compte administrateur par défaut créé avec succès');
      console.log(`📧 Email: ${defaultAdminEmail}`);
      console.log(`🔑 Mot de passe: ${defaultAdminPassword}`);
      
    } catch (error) {
      console.error('❌ Erreur lors de la création du compte administrateur par défaut:', error);
    }
  }

  async findAll(filters: UserFilters = {}) {
    const {
      search,
      role,
      status,
      page = 1,
      limit = 10,
    } = filters;

    const skip = (page - 1) * limit;
    const where: FindOptionsWhere<User> = {};

    if (role) {
      where.role = role;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.personalData = [
        { firstName: Like(`%${search}%`) },
        { lastName: Like(`%${search}%`) },
      ];
      where.email = Like(`%${search}%`);
    }

    const [users, total] = await this.usersRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Vérifier si l'email existe déjà
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new BadRequestException('Un utilisateur avec cet email existe déjà');
    }

    // Hasher le mot de passe
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(createUserDto.password, saltRounds);

    const user = this.usersRepository.create({
      ...createUserDto,
      passwordHash,
      status: UserStatus.PENDING_VERIFICATION,
    });

    return await this.usersRepository.save(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.findByEmail(updateUserDto.email);
      if (existingUser) {
        throw new BadRequestException('Un utilisateur avec cet email existe déjà');
      }
    }

    Object.assign(user, updateUserDto);

    return await this.usersRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }

  async activateUser(id: string): Promise<User> {
    const user = await this.findOne(id);
    user.status = UserStatus.ACTIVE;
    return await this.usersRepository.save(user);
  }

  async suspendUser(id: string): Promise<User> {
    const user = await this.findOne(id);
    user.status = UserStatus.SUSPENDED;
    return await this.usersRepository.save(user);
  }

  async getStatistics() {
    const totalUsers = await this.usersRepository.count();
    const activeUsers = await this.usersRepository.count({ where: { status: UserStatus.ACTIVE } });
    const pendingUsers = await this.usersRepository.count({ where: { status: UserStatus.PENDING_VERIFICATION } });
    const suspendedUsers = await this.usersRepository.count({ where: { status: UserStatus.SUSPENDED } });

    const adminUsers = await this.usersRepository.count({ where: { role: UserRole.ADMIN } });
    const superAdminUsers = await this.usersRepository.count({ where: { role: UserRole.SUPER_ADMIN } });

    return {
      total: totalUsers,
      byStatus: {
        active: activeUsers,
        pending: pendingUsers,
        suspended: suspendedUsers,
      },
      byRole: {
        admin: adminUsers,
        superAdmin: superAdminUsers,
      },
    };
  }

  async resetPassword(id: string, newPassword: string): Promise<void> {
    const user = await this.findOne(id);
    
    const saltRounds = 12;
    user.passwordHash = await bcrypt.hash(newPassword, saltRounds);
    
    await this.usersRepository.save(user);
  }
}