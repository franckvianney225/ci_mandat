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
} from '@nestjs/common';
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

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: any): Promise<LoginResponse> {
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
    
    return this.authService.login(email, password);
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
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout() {
    // Dans une implémentation plus avancée, on pourrait blacklister le token
    // Pour l'instant, le logout est géré côté client
    return { message: 'Déconnexion réussie' };
  }
}