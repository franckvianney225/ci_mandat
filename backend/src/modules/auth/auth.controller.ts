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

import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

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
  firstName: string;
  lastName: string;
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
  ): Promise<{ user: any; access_token: string }> { // Retourner user et token
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
    
    // Définir le cookie HttpOnly sécurisé (optionnel pour compatibilité)
    res.cookie('adminToken', loginResponse.access_token, {
      httpOnly: true,
      secure: false, // Désactiver secure pour HTTP
      sameSite: 'lax', // Plus permissif que strict
      maxAge: 24 * 60 * 60 * 1000, // 24 heures
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
  getProfile(@Request() req) {
    return req.user;
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
    return this.authService.updateProfile(
      req.user.id,
      updateProfileDto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) res: Response) {
    // Effacer le cookie
    res.clearCookie('adminToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });
    
    return { message: 'Déconnexion réussie' };
  }
}