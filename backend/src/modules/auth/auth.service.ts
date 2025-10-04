import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

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

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { email } });

    console.log('🔍 Recherche utilisateur avec email:', email);
    console.log('👤 Utilisateur trouvé:', user ? {
      id: user.id,
      email: user.email,
      hasPasswordHash: !!user.passwordHash,
      passwordHashLength: user.passwordHash?.length
    } : 'Aucun utilisateur trouvé');

    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // Vérifier si le compte est suspendu
    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('Compte suspendu');
    }

    // Vérifier que le hash du mot de passe n'est pas vide
    if (!user.passwordHash) {
      console.error('❌ Hash du mot de passe vide pour l\'utilisateur:', user.email);
      throw new UnauthorizedException('Compte mal configuré - contactez l\'administrateur');
    }

    console.log('🔑 Tentative de comparaison du mot de passe...');
    console.log('📧 Email reçu:', email);
    console.log('🔐 Mot de passe reçu:', password ? '***' : 'VIDE');
    console.log('🔑 Hash stocké:', user.passwordHash ? '***' : 'VIDE');
    
    // Vérifier que le mot de passe n'est pas vide
    if (!password) {
      console.error('❌ Mot de passe vide reçu');
      throw new UnauthorizedException('Mot de passe requis');
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      // Incrémenter les tentatives de connexion
      user.loginAttempts += 1;
      
      // Suspendre le compte après 5 tentatives échouées
      if (user.loginAttempts >= 5) {
        user.status = UserStatus.SUSPENDED;
      }
      
      await this.usersRepository.save(user);
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // Réinitialiser les tentatives de connexion
    if (user.loginAttempts > 0) {
      user.loginAttempts = 0;
    }

    // Mettre à jour la dernière connexion
    user.lastLogin = new Date().toISOString();
    await this.usersRepository.save(user);

    return user;
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const user = await this.validateUser(email, password);

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        personalData: user.personalData,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        loginAttempts: user.loginAttempts,
      },
    };
  }

  async register(
    email: string,
    password: string,
    personalData: {
      firstName: string;
      lastName: string;
      phone?: string;
      department?: string;
    },
    role: UserRole = UserRole.ADMIN,
  ): Promise<User> {
    // Vérifier si l'email existe déjà
    const existingUser = await this.usersRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new BadRequestException('Un utilisateur avec cet email existe déjà');
    }

    // Hasher le mot de passe
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Créer l'utilisateur
    const user = this.usersRepository.create({
      email,
      passwordHash,
      role,
      status: UserStatus.PENDING_VERIFICATION,
      personalData,
    });

    return await this.usersRepository.save(user);
  }

  async validateToken(userId: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Compte non actif');
    }

    return user;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    // Vérifier l'ancien mot de passe
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Mot de passe actuel incorrect');
    }

    // Hasher le nouveau mot de passe
    const saltRounds = 12;
    user.passwordHash = await bcrypt.hash(newPassword, saltRounds);

    await this.usersRepository.save(user);
  }

  async updateProfile(
    userId: string,
    profileData: {
      firstName: string;
      lastName: string;
      phone?: string;
    },
  ): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    // Mettre à jour les données personnelles
    user.personalData = {
      ...user.personalData,
      firstName: profileData.firstName,
      lastName: profileData.lastName,
      phone: profileData.phone,
    };

    return await this.usersRepository.save(user);
  }
}