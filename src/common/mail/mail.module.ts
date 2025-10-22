import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { GMAIL_SERVICE, GMAIL_SUPPORT_NAME, GMAIL_SUPPORT_PASS } from '@env';

@Module({
  imports: [
    MailerModule.forRoot({
      transports: {
        support: {
          service: 'gmail',
          host: GMAIL_SERVICE,
          port: 465,
          secure: false,

          auth: {
            user: GMAIL_SUPPORT_NAME,
            pass: GMAIL_SUPPORT_PASS,
          },
        },
      },

      template: {
        dir: join(__dirname, 'templates'),
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
