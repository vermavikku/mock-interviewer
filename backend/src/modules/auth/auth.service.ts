import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service';
import { RegisterDto, LoginDto, UpdateProfileDto, ChangePasswordDto } from './dto/auth.dto';

const COOKIE_ACCESS_NAME = 'access_token';
const COOKIE_REFRESH_NAME = 'refresh_token';

// Expiration intervals
const ACCESS_TOKEN_EXPIRY = '1h';
const REFRESH_TOKEN_EXPIRY = '7d';
const ACCESS_COOKIE_MAX_AGE = 1 * 60 * 60 * 1000; // 1 hour in ms
const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly isProduction: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.accessSecret =
      this.configService.get<string>('JWT_ACCESS_SECRET') ||
      'mock_interview_ai_access_token_super_secret_key_2026_x';
    this.refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      'mock_interview_ai_refresh_token_super_secret_key_2026_r';
    this.isProduction = this.configService.get<string>('nodeEnv') === 'production';
  }

  /**
   * Registers a new candidate user with bcrypt password encryption
   */
  async register(dto: RegisterDto, res?: Response) {
    const cleanUsername = dto.username.toLowerCase().trim();

    // Check if username already exists
    const existing = await this.prisma.user.findUnique({
      where: { username: cleanUsername },
    });

    if (existing) {
      throw new BadRequestException('This username is already taken. Please choose another.');
    }

    // Hash password with bcrypt (10 rounds)
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(dto.password, saltRounds);

    const user = await this.prisma.user.create({
      data: {
        username: cleanUsername,
        email: dto.email ? dto.email.toLowerCase().trim() : null,
        password: hashedPassword,
        firstName: dto.firstName || dto.username,
        lastName: dto.lastName || '',
        targetRole: dto.targetRole || 'Full Stack Engineer',
        seniorityLevel: dto.seniorityLevel || 'Senior',
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUsername}`,
        bio: `Passionate ${dto.seniorityLevel || 'Senior'} ${dto.targetRole || 'Full Stack Engineer'} practicing technical interviews.`,
        tokenVersion: 0,
      },
    });

    const tokens = this.generateTokens(user);

    if (res) {
      this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    }

    const { password, ...safeUser } = user;
    this.logger.log(`Registered new candidate user: ${safeUser.username} (${safeUser.email})`);

    return {
      success: true,
      message: 'Account created successfully',
      user: safeUser,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  /**
   * Authenticates user, verifies password with bcrypt, and sets HttpOnly cookies
   */
  async login(dto: LoginDto, res?: Response) {
    const identifier = dto.identifier.toLowerCase().trim();

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid username/email or password');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid username/email or password');
    }

    const tokens = this.generateTokens(user);

    if (res) {
      this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    }

    const { password, ...safeUser } = user;
    this.logger.log(`Candidate logged in: ${safeUser.username} (v=${safeUser.tokenVersion})`);

    return {
      success: true,
      message: 'Logged in successfully',
      user: safeUser,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  /**
   * Automatically refreshes expired 1-hour access token using 7-day refresh token
   */
  async refreshToken(tokenStr?: string, res?: Response) {
    if (!tokenStr) {
      throw new UnauthorizedException('Refresh token is required');
    }

    let payload: any;
    try {
      payload = this.jwtService.verify(tokenStr, { secret: this.refreshSecret });
    } catch (err) {
      throw new UnauthorizedException('Refresh token is expired or invalid');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('User account not found');
    }

    // Token Version Revocation Check
    if (payload.tokenVersion !== undefined && user.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedException('Session revoked. Please log in again.');
    }

    // Generate fresh tokens
    const tokens = this.generateTokens(user);

    if (res) {
      this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    }

    const { password, ...safeUser } = user;

    return {
      success: true,
      message: 'Token refreshed successfully',
      user: safeUser,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  /**
   * Logs out user, increments tokenVersion in PostgreSQL, and clears HttpOnly cookies
   */
  async logout(userId: string, res?: Response) {
    // Increment token version in PostgreSQL to instantly revoke all active tokens
    await this.prisma.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
    });

    if (res) {
      this.clearAuthCookies(res);
    }

    this.logger.log(`Candidate ${userId} logged out. Token version incremented.`);

    return {
      success: true,
      message: 'Logged out successfully. All sessions revoked.',
    };
  }

  /**
   * Retrieves full profile details including interview stats
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        sessions: {
          select: {
            id: true,
            title: true,
            targetRole: true,
            status: true,
            totalScore: true,
            targetDurationMin: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    const completedSessions = user.sessions.filter((s) => s.status === 'COMPLETED');
    const avgScore =
      completedSessions.length > 0
        ? Math.round(
            completedSessions.reduce((acc, s) => acc + (s.totalScore || 0), 0) /
              completedSessions.length,
          )
        : 0;

    const totalPracticeMin = user.sessions.reduce(
      (acc, s) => acc + (s.targetDurationMin || 30),
      0,
    );

    const { password, ...safeUser } = user;

    return {
      ...safeUser,
      stats: {
        totalSessions: user.sessions.length,
        completedSessions: completedSessions.length,
        averageScore: avgScore,
        totalPracticeMinutes: totalPracticeMin,
      },
    };
  }

  /**
   * Updates candidate profile information
   */
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        targetRole: dto.targetRole,
        seniorityLevel: dto.seniorityLevel,
        avatarUrl: dto.avatarUrl,
        bio: dto.bio,
      },
    });

    const { password, ...safeUser } = updated;
    return {
      success: true,
      message: 'Profile updated successfully',
      user: safeUser,
    };
  }

  /**
   * Changes account password with bcrypt validation and revokes other sessions
   */
  async changePassword(userId: string, dto: ChangePasswordDto, res?: Response) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashedNewPassword = await bcrypt.hash(dto.newPassword, 10);

    // Update password and increment tokenVersion to revoke old devices
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedNewPassword,
        tokenVersion: { increment: 1 },
      },
    });

    // Re-issue fresh cookies for current device
    const tokens = this.generateTokens(updated);
    if (res) {
      this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    }

    const { password, ...safeUser } = updated;

    return {
      success: true,
      message: 'Password changed successfully. All other devices logged out.',
      user: safeUser,
    };
  }

  /**
   * Helper to sign access (1h) and refresh (7d) tokens
   */
  private generateTokens(user: { id: string; email?: string | null; username: string; tokenVersion: number }) {
    const accessToken = this.jwtService.sign(
      {
        sub: user.id,
        username: user.username,
        email: user.email || '',
        tokenVersion: user.tokenVersion,
      },
      {
        secret: this.accessSecret,
        expiresIn: ACCESS_TOKEN_EXPIRY,
      },
    );

    const refreshToken = this.jwtService.sign(
      {
        sub: user.id,
        tokenVersion: user.tokenVersion,
      },
      {
        secret: this.refreshSecret,
        expiresIn: REFRESH_TOKEN_EXPIRY,
      },
    );

    return { accessToken, refreshToken };
  }

  /**
   * Sets HttpOnly secure cookies on the Express response
   */
  setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    // 1-Hour Access Token Cookie
    res.cookie(COOKIE_ACCESS_NAME, accessToken, {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: this.isProduction ? 'strict' : 'lax',
      maxAge: ACCESS_COOKIE_MAX_AGE,
      path: '/',
    });

    // 7-Day Refresh Token Cookie
    res.cookie(COOKIE_REFRESH_NAME, refreshToken, {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: this.isProduction ? 'strict' : 'lax',
      maxAge: REFRESH_COOKIE_MAX_AGE,
      path: '/',
    });
  }

  /**
   * Clears authentication cookies
   */
  clearAuthCookies(res: Response) {
    res.clearCookie(COOKIE_ACCESS_NAME, { path: '/' });
    res.clearCookie(COOKIE_REFRESH_NAME, { path: '/' });
  }
}
