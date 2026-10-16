import { RefreshTokenResponse } from "./RefreshTokenResponse";

export class RefreshTokenResponseMapper {

  static toResponse(
    accessToken: string,
    refreshToken: string
  ): RefreshTokenResponse {

    return {

      accessToken,

      refreshToken,

    };

  }

}