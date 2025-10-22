import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { GMAIL_SUPPORT_NAME } from '@env';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendOtpToVerifyEmail(email: string, otp_code: string) {
    const res = await this.mailerService.sendMail({
      to: email,
      from: `"Aichatbot" <${GMAIL_SUPPORT_NAME}>`,
      subject: 'Verify Email',
      template: './otp-code',
      transporterName: 'support',
      context: {
        otp_code,
      },
    });

    if (!res?.response?.includes('2.0.0 OK')) {
      throw new InternalServerErrorException('Email sending error!');
    }
  }

  async sendOtpToVerifyPasswordReset(email: string, otp_code: string) {
    const res = await this.mailerService.sendMail({
      to: email,
      from: `"Aichatbot" <${GMAIL_SUPPORT_NAME}>`,
      subject: 'Verify Email',
      template: './password-reset',
      transporterName: 'support',
      context: {
        otp_code,
      },
    });

    if (!res?.response?.includes('2.0.0 OK')) {
      throw new InternalServerErrorException('Email sending error!');
    }
  }
}
