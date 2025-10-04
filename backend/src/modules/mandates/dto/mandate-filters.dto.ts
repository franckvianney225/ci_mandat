import { IsOptional, IsString, IsEnum, IsNumber, Min } from 'class-validator';
import { MandateStatus } from '../../../entities/mandate.entity';

export class MandateFiltersDto {
  @IsOptional()
  @IsString({ message: 'Le terme de recherche doit être une chaîne de caractères' })
  search?: string;

  @IsOptional()
  @IsEnum(MandateStatus, { message: 'Le statut doit être une valeur valide' })
  status?: MandateStatus;

  @IsOptional()
  @IsNumber({}, { message: 'La page doit être un nombre' })
  @Min(1, { message: 'La page doit être au moins 1' })
  page?: number;

  @IsOptional()
  @IsNumber({}, { message: 'La limite doit être un nombre' })
  @Min(1, { message: 'La limite doit être au moins 1' })
  limit?: number;
}