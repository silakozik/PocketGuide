import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { userProfiles, users, userSettings } from "@pocketguide/database";
import type { UserDTO } from "@pocketguide/types";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword } from "./password.util";
import type { JwtPayload } from "./jwt-auth.guard";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z0-9_]{3,24}$/;

@Injectable()
export class AuthService {
  constructor(
    @Inject("DB_CONNECTION") private readonly db: any,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private toUserDTO(row: typeof users.$inferSelect): UserDTO {
    return {
      id: row.id,
      email: row.email,
      userName: row.userName,
      studentStatus: row.studentStatus,
      dailyBudgetLimit: row.dailyBudgetLimit,
      preferredLanguage: row.preferredLanguage ?? "tr",
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private validateRegisterInput(
    email: string,
    password: string,
    userName: string,
  ): void {
    if (!email?.trim() || !EMAIL_RE.test(email.trim())) {
      throw new BadRequestException("Geçerli bir e-posta adresi girin");
    }
    if (!password || password.length < 8) {
      throw new BadRequestException("Şifre en az 8 karakter olmalı");
    }
    if (!userName?.trim() || !USERNAME_RE.test(userName.trim())) {
      throw new BadRequestException(
        "Kullanıcı adı 3–24 karakter; harf, rakam ve alt çizgi kullanılabilir",
      );
    }
  }

  async register(
    email: string,
    password: string,
    userName: string,
  ): Promise<{ user: UserDTO; accessToken: string }> {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUserName = userName.trim();

    this.validateRegisterInput(normalizedEmail, password, normalizedUserName);

    const [existingEmail] = await this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email as any, normalizedEmail))
      .limit(1);

    if (existingEmail) {
      throw new ConflictException("Bu e-posta zaten kayıtlı");
    }

    const [existingUserName] = await this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.userName as any, normalizedUserName))
      .limit(1);

    if (existingUserName) {
      throw new ConflictException("Bu kullanıcı adı alınmış");
    }

    const passwordHash = await hashPassword(password);

    const [created] = await this.db
      .insert(users)
      .values({
        email: normalizedEmail,
        password: passwordHash,
        userName: normalizedUserName,
        preferredLanguage: "tr",
      })
      .returning();

    await this.db.insert(userSettings).values({
      userId: created.id,
      preferredLanguage: "tr",
    });

    await this.db.insert(userProfiles).values({
      userId: created.id,
      displayName: normalizedUserName,
    });

    const accessToken = this.signToken({
      sub: created.id,
      email: created.email,
    });

    return { user: this.toUserDTO(created), accessToken };
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ user: UserDTO; accessToken: string }> {
    if (!email?.trim() || !password) {
      throw new BadRequestException("E-posta ve şifre gerekli");
    }

    const normalizedEmail = email.trim().toLowerCase();

    const [row] = await this.db
      .select()
      .from(users)
      .where(eq(users.email as any, normalizedEmail))
      .limit(1);

    if (!row) {
      throw new UnauthorizedException("E-posta veya şifre hatalı");
    }

    const valid = await verifyPassword(password, row.password);
    if (!valid) {
      throw new UnauthorizedException("E-posta veya şifre hatalı");
    }

    const accessToken = this.signToken({ sub: row.id, email: row.email });
    return { user: this.toUserDTO(row), accessToken };
  }

  async getUserById(userId: string): Promise<UserDTO> {
    const [row] = await this.db
      .select()
      .from(users)
      .where(eq(users.id as any, userId))
      .limit(1);

    if (!row) {
      throw new UnauthorizedException("Kullanıcı bulunamadı");
    }

    return this.toUserDTO(row);
  }

  signToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>("JWT_SECRET", "dev-jwt-secret"),
      expiresIn: "7d",
    });
  }
}
