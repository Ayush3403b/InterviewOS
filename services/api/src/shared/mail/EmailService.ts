export interface EmailService {
  sendMail(options: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void>;
}