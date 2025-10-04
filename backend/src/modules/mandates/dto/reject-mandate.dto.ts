import { IsOptional, IsString, MinLength, MaxLength } from 'class-validator';

export class RejectMandateDto {
  @IsOptional()
  @IsString({ message: 'La raison du rejet doit être une chaîne de caractères' })
  @MinLength(10, { message: 'La raison du rejet doit contenir au moins 10 caractères' })
  @MaxLength(500, { message: 'La raison du rejet ne peut pas dépasser 500 caractères' })
  reason?: string;
}