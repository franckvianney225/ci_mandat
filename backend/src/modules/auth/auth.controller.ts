import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  Patch,
  Res, // Ajouter Res pour la réponse
} from '@nestjs/common';
import { Response } from 'express'; // Importer Response
import { AuthService, LoginResponse } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UserRole } from '../../entities/user.entity';

import { IsEmail, IsNotEmpty, IsString, IsOptional } from 'class-validator';

class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

class RegisterDto {
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

class ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

class UpdateProfileDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: any,
    @Res({ passthrough: true }) res: Response // Injecter la réponse
  ): Promise<{ user: any; access_token: string }> { // Retourner user et token (refresh_token est dans le cookie)
    console.log('📨 Corps de la requête brute:', body);
    console.log('🔍 Type de body:', typeof body);
    console.log('🔍 Clés de body:', Object.keys(body));
    
    // Essayer différents formats de données
    const email = body.email || body.username || body.Email || body.Username;
    const password = body.password || body.Password;
    
    console.log('📧 Email extrait:', email);
    console.log('🔐 Mot de passe extrait:', password ? '***' : 'VIDE');
    console.log('🔍 Type de email:', typeof email);
    console.log('🔍 Type de password:', typeof password);
    console.log('🔍 Longueur du password:', password?.length);
    
    if (!email || !password) {
      console.error('❌ Données manquantes dans la requête');
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }
    
    const loginResponse = await this.authService.login(email, password);
    
    // Définir le cookie HttpOnly sécurisé
    res.cookie('adminToken', loginResponse.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/',
    });
    
    // Définir le cookie refresh token HttpOnly sécurisé
    res.cookie('refreshToken', loginResponse.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
      path: '/',
    });

    // Retourner les infos utilisateur ET le token pour le frontend
    return {
      user: loginResponse.user,
      access_token: loginResponse.access_token
    };
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(
      registerDto.email,
      registerDto.password,
      registerDto.personalData,
      registerDto.role,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    // Récupérer les données fraîches depuis la base de données
    const freshUser = await this.authService.validateToken(req.user.id);
    console.log('🔍 Endpoint /auth/profile - Données retournées:', freshUser.personalData);
    return {
      user: {
        id: freshUser.id,
        email: freshUser.email,
        role: freshUser.role,
        status: freshUser.status,
        personalData: freshUser.personalData,
        createdAt: freshUser.createdAt,
        lastLogin: freshUser.lastLogin,
        loginAttempts: freshUser.loginAttempts,
      }
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Request() req,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    await this.authService.changePassword(
      req.user.id,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );
    
    return { message: 'Mot de passe modifié avec succès' };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @Request() req,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    console.log('🔍 Endpoint PATCH /auth/profile appelé avec:', updateProfileDto);
    console.log('👤 User ID:', req.user.id);
    
    const result = await this.authService.updateProfile(
      req.user.id,
      updateProfileDto,
    );
    
    console.log('✅ Résultat de updateProfile:', result.personalData);
    return result;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshTokens(
    @Request() req,
    @Res({ passthrough: true }) res: Response
  ) {
    const refreshToken = req.cookies?.refreshToken;
    
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token manquant');
    }

    const tokens = await this.authService.refreshTokens(refreshToken);

    // Définir les nouveaux cookies
    res.cookie('adminToken', tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/',
    });

    res.cookie('refreshToken', tokens.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
      path: '/',
    });

    return { access_token: tokens.access_token };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) res: Response) {
    // Effacer les cookies
    res.clearCookie('adminToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });
    
    return { message: 'Déconnexion réussie' };
  }
}