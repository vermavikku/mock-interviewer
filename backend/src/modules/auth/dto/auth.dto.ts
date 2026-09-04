import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ description: 'Candidate username', example: 'alex_vance' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  username: string;

  @ApiProperty({ description: 'Account password (minimum 6 characters)', example: 'SecurePassword123!' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ description: 'Candidate email address (optional)', example: 'alex.vance@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'First name', example: 'Alex' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ description: 'Last name', example: 'Vance' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ description: 'Target job title', example: 'Senior Staff Full Stack Engineer' })
  @IsOptional()
  @IsString()
  targetRole?: string;

  @ApiPropertyOptional({ description: 'Target seniority level', example: 'Senior' })
  @IsOptional()
  @IsString()
  seniorityLevel?: string;
}

export class LoginDto {
  @ApiProperty({ description: 'Username or Email', example: 'alex_vance' })
  @IsString()
  @IsNotEmpty()
  identifier: string;

  @ApiProperty({ description: 'Account password', example: 'SecurePassword123!' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class UpdateProfileDto {
  @ApiPropertyOptional({ description: 'Full display name', example: 'Alex Vance' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'First name', example: 'Alex' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ description: 'Last name', example: 'Vance' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ description: 'Engineering role alias', example: 'Software Engineer' })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ description: 'Target engineering role', example: 'Staff Infrastructure Architect' })
  @IsOptional()
  @IsString()
  targetRole?: string;

  @ApiPropertyOptional({ description: 'Seniority level', example: 'Staff' })
  @IsOptional()
  @IsString()
  seniorityLevel?: string;

  @ApiPropertyOptional({ description: 'Avatar image URL', example: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({ description: 'Candidate biography / career summary' })
  @IsOptional()
  @IsString()
  bio?: string;
}

export class ChangePasswordDto {
  @ApiProperty({ description: 'Current active password', example: 'OldPassword123!' })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({ description: 'New password (minimum 6 characters)', example: 'NewSecurePassword456!' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  newPassword: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Username or Registered Email address', example: 'alex_vance' })
  @IsString()
  @IsNotEmpty()
  identifier: string;

  @ApiProperty({ description: 'New account password (minimum 6 characters)', example: 'NewSecurePassword456!' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  newPassword: string;
}
