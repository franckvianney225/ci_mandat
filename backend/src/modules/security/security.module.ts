import { Module } from '@nestjs/common';
import { SecurityService } from './security.service';
import { RecaptchaService } from './recaptcha.service';

@Module({
  providers: [SecurityService, RecaptchaService],
  exports: [SecurityService, RecaptchaService],
})
export class SecurityModule {}