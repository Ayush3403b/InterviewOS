export class PasswordPolicy {
  /**
   * Minimum password length.
   * Can be changed in one place later.
   */
  private static readonly MIN_LENGTH = 8;

  /**
   * Strong password regex.
   */
  private static readonly PASSWORD_REGEX =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/;

  /**
   * Validates password strength.
   */
  static validate(
    password: string
  ): boolean {
    return (
      password.length >= this.MIN_LENGTH &&
      this.PASSWORD_REGEX.test(password)
    );
  }
}