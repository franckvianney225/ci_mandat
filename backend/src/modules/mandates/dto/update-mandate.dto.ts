import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';
import { MandateStatus } from '../../../entities/mandate.entity';

export class UpdateMandateDto {
  @IsOptional()
  @IsEnum(MandateStatus, { message: 'Le statut doit être une valeur valide' })
  status?: MandateStatus;

  @IsOptional()
  @IsString({ message: 'La raison de rejet doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'La raison de rejet ne peut pas être vide' })
  @MaxLength(500, { message: 'La raison de rejet ne peut pas dépasser 500 caractères' })
  rejectionReason?: string;
}