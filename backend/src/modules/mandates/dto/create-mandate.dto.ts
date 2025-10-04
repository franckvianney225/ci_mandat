import {
  IsString,
  IsEmail,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreateMandateDto {
  @IsNotEmpty({ message: 'Le nom est requis' })
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @MinLength(2, { message: 'Le nom doit contenir au moins 2 caractères' })
  @MaxLength(50, { message: 'Le nom ne peut pas dépasser 50 caractères' })
  @Matches(/^[a-zA-ZÀ-ÿ\s\-']+$/, {
    message: 'Le nom ne peut contenir que des lettres, espaces, tirets et apostrophes',
  })
  nom: string;

  @IsNotEmpty({ message: 'Le prénom est requis' })
  @IsString({ message: 'Le prénom doit être une chaîne de caractères' })
  @MinLength(2, { message: 'Le prénom doit contenir au moins 2 caractères' })
  @MaxLength(200, { message: 'Le prénom ne peut pas dépasser 200 caractères' })
  @Matches(/^[a-zA-ZÀ-ÿ\s\-']+$/, {
    message: 'Le prénom ne peut contenir que des lettres, espaces, tirets et apostrophes',
  })
  prenom: string;

  @IsNotEmpty({ message: 'La fonction est requise' })
  @IsString({ message: 'La fonction doit être une chaîne de caractères' })
  @MinLength(2, { message: 'La fonction doit contenir au moins 2 caractères' })
  @MaxLength(200, { message: 'La fonction ne peut pas dépasser 100 caractères' })
  fonction: string;

  @IsNotEmpty({ message: 'L\'email est requis' })
  @IsEmail({}, { message: 'L\'email doit être une adresse email valide' })
  @MaxLength(100, { message: 'L\'email ne peut pas dépasser 100 caractères' })
  email: string;

  @IsNotEmpty({ message: 'Le téléphone est requis' })
  @IsString({ message: 'Le téléphone doit être une chaîne de caractères' })
  @Matches(/^(\+225|225)?[0-9]{10}$/, {
    message: 'Le numéro de téléphone doit être un numéro ivoirien valide (10 chiffres)',
  })
  telephone: string;

  @IsNotEmpty({ message: 'La circonscription est requise' })
  @IsString({ message: 'La circonscription doit être une chaîne de caractères' })
  @MinLength(2, { message: 'La circonscription doit contenir au moins 2 caractères' })
  @MaxLength(100, { message: 'La circonscription ne peut pas dépasser 100 caractères' })
  circonscription: string;
}