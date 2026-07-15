import nodemailer from "nodemailer";

import { env } from "../../config/env";

import { EmailService } from "./EmailService";

export class NodemailerService
  implements EmailService {

  private transporter =
    nodemailer.createTransport({
      host: env.SMTP_HOST,

      port: env.SMTP_PORT,

      secure: false,

      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });

  async sendMail(options: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {

    await this.transporter.sendMail({
      from: env.MAIL_FROM,

      to: options.to,

      subject: options.subject,

      html: options.html,
    });
  }

  public async verifyConnection(): Promise<void> {
    await this.transporter.verify();
  }
}