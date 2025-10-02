import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, UserStatus } from '../../entities/user.entity';

class CreateUserDto {
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

class UpdateUserDto {
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

class UserFiltersDto {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  page?: number;
  limit?: number;
}

class ResetPasswordDto {
  newPassword: string;
}

@Controller('users')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(@Query() filters: UserFiltersDto) {
    return this.usersService.findAll(filters);
  }

  @Get('statistics')
  async getStatistics() {
    return this.usersService.getStatistics();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.usersService.remove(id);
  }

  @Patch(':id/activate')
  async activateUser(@Param('id') id: string) {
    return this.usersService.activateUser(id);
  }

  @Patch(':id/suspend')
  async suspendUser(@Param('id') id: string) {
    return this.usersService.suspendUser(id);
  }

  @Post(':id/reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Param('id') id: string,
    @Body() resetPasswordDto: ResetPasswordDto,
  ) {
    await this.usersService.resetPassword(id, resetPasswordDto.newPassword);
    return { message: 'Mot de passe réinitialisé avec succès' };
  }
}