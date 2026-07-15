import { UserDocument } from "../models/UserModel";

export class ProfileCompletion {

  static isComplete(
    user: UserDocument
  ): boolean {

    return Boolean(
      user.firstName &&
      user.lastName
    );

  }
}