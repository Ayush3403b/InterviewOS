import { RefreshTokenService } from "./RefreshTokenService";

export class SessionService {

  constructor(
    private readonly refreshTokenService: RefreshTokenService
  ) {}

}