import bcrypt from "bcryptjs";

export class PasswordService {
  /**
   * Hash a password
   */
  public static async hash(
    password: string
  ): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  /**
   * Compare a plain password with a hashed password
   */
  public static async compare(
    plainPassword: string,
    hashedPassword: string
  ): Promise<boolean> {
    return bcrypt.compare(
      plainPassword,
      hashedPassword
    );
  }
}