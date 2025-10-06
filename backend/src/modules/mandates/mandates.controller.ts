import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
  ValidationPipe,
  HttpException,
  Catch,
  ExceptionFilter,
  ArgumentsHost,
  Res,
  Headers,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { MandatesService } from './mandates.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';
import { MandateStatus } from '../../entities/mandate.entity';
import { Response } from 'express';
import { CreateMandateDto } from './dto/create-mandate.dto';
import { UpdateMandateDto } from './dto/update-mandate.dto';
import { MandateFiltersDto } from './dto/mandate-filters.dto';
import { RejectMandateDto } from './dto/reject-mandate.dto';
import { RecaptchaService } from '../security/recaptcha.service';
import { Delete } from '@nestjs/common';

@Controller('mandates')
export class MandatesController {
  constructor(
    private readonly mandatesService: MandatesService,
    private readonly recaptchaService: RecaptchaService,
  ) {}

  // Endpoint public pour créer un mandat (sans authentification)
  @Post()
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async create(
    @Body(ValidationPipe) createMandateDto: CreateMandateDto,
    @Headers('x-recaptcha-token') recaptchaToken?: string,
  ) {
    try {
      // Vérifier le token reCAPTCHA
      await this.recaptchaService.verifyTokenOrThrow(recaptchaToken, 'mandate_submission');
      
      const mandate = await this.mandatesService.create(createMandateDto);
      
      // Retourner le format attendu par le frontend
      return {
        success: true,
        data: mandate,
        message: 'Mandat créé avec succès'
      };
    } catch (error) {
      // Retourner le format d'erreur attendu par le frontend
      return {
        success: false,
        error: error.message || 'Erreur lors de la création du mandat'
      };
    }
  }

  // Endpoints protégés pour l'administration
  @Get()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async findAll(@Query(ValidationPipe) filters: MandateFiltersDto) {
    return this.mandatesService.findAll(filters);
  }

  @Get('statistics')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getStatistics() {
    return this.mandatesService.getStatistics();
  }

  @Get('recent')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getRecentMandates() {
    return this.mandatesService.getRecentMandates();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async findOne(@Param('id') id: string) {
    return this.mandatesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async update(@Param('id') id: string, @Body(ValidationPipe) updateMandateDto: UpdateMandateDto) {
    return this.mandatesService.update(id, updateMandateDto);
  }

  @Patch(':id/validate-admin')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async validateByAdmin(@Param('id') id: string, @Req() req: any) {
    const adminId = req.user.id;
    return this.mandatesService.validateByAdmin(id, adminId);
  }

  @Patch(':id/validate-super-admin')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async validateBySuperAdmin(@Param('id') id: string, @Req() req: any) {
    const superAdminId = req.user.id;
    return this.mandatesService.validateBySuperAdmin(id, superAdminId);
  }

  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async reject(
    @Param('id') id: string,
    @Body(ValidationPipe) rejectMandateDto: RejectMandateDto,
    @Req() req: any,
  ) {
    const adminId = req.user.id;
    return this.mandatesService.reject(id, rejectMandateDto.reason, adminId);
  }

  @Get(':id/pdf')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async generatePDF(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    try {
      const { pdfBuffer, fileName } = await this.mandatesService.generatePDF(id);
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': pdfBuffer.length,
      });
      
      res.send(pdfBuffer);
    } catch (error) {
      throw new HttpException(
        error.message || 'Erreur lors de la génération du PDF',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async remove(@Param('id') id: string) {
    try {
      await this.mandatesService.remove(id);
      
      return {
        success: true,
        message: 'Mandat supprimé avec succès'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Erreur lors de la suppression du mandat'
      };
    }
  }
}