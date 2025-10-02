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
} from '@nestjs/common';
import { MandatesService } from './mandates.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';
import { MandateStatus } from '../../entities/mandate.entity';

class CreateMandateDto {
  nom: string;
  prenom: string;
  fonction: string;
  email: string;
  telephone: string;
  circonscription: string;
}

class UpdateMandateDto {
  status?: MandateStatus;
  rejectionReason?: string;
}

class MandateFiltersDto {
  search?: string;
  status?: MandateStatus;
  page?: number;
  limit?: number;
}

class RejectMandateDto {
  reason: string;
}

@Controller('mandates')
export class MandatesController {
  constructor(private readonly mandatesService: MandatesService) {}

  // Endpoint public pour créer un mandat (sans authentification)
  @Post()
  async create(@Body() body: any) {
    try {
      // Créer manuellement le DTO à partir du body
      const createMandateDto: CreateMandateDto = {
        nom: body.nom || '',
        prenom: body.prenom || '',
        fonction: body.fonction || '',
        email: body.email || '',
        telephone: body.telephone || '',
        circonscription: body.circonscription || ''
      };
      
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
  async findAll(@Query() filters: MandateFiltersDto) {
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
  async update(@Param('id') id: string, @Body() updateMandateDto: UpdateMandateDto) {
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
    @Body() rejectMandateDto: RejectMandateDto,
    @Req() req: any,
  ) {
    const adminId = req.user.id;
    return this.mandatesService.reject(id, rejectMandateDto.reason, adminId);
  }
}