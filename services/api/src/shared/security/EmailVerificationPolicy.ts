export class EmailVerificationPolicy {

  /**
   * Email verification link validity
   */
  public static readonly EXPIRY_HOURS = 24;

  /**
   * Expiry time in milliseconds
   */
  public static getExpiryMilliseconds(): number {
    return (
      this.EXPIRY_HOURS *
      60 *
      60 *
      1000
    );
  }

}