import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { AuthResponseDTO } from "@pocketguide/types";
import { Response } from "express";
import { AuthService } from "./auth.service";
import type { AuthenticatedRequest } from "./jwt-auth.guard";
import { JwtAuthGuard } from "./jwt-auth.guard";

const COOKIE_NAME = "pg_access_token";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setAuthCookie(res: Response, token: string): void {
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });
  }

  @Post("register")
  @HttpCode(201)
  async register(
    @Body("email") email: string,
    @Body("password") password: string,
    @Body("userName") userName: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDTO> {
    const { user, accessToken } = await this.authService.register(
      email,
      password,
      userName,
    );
    this.setAuthCookie(res, accessToken);
    return { user, accessToken };
  }

  @Post("login")
  @HttpCode(200)
  async login(
    @Body("email") email: string,
    @Body("password") password: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDTO> {
    const { user, accessToken } = await this.authService.login(email, password);
    this.setAuthCookie(res, accessToken);
    return { user, accessToken };
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: AuthenticatedRequest): Promise<AuthResponseDTO> {
    const user = await this.authService.getUserById(req.userId);
    return { user };
  }

  @Post("logout")
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response): { success: boolean } {
    res.clearCookie(COOKIE_NAME, { path: "/" });
    return { success: true };
  }
}
