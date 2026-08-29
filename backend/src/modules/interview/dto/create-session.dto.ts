import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSessionDto {
  @ApiProperty({ example: 'Full Stack Engineer', description: 'Target job title/role' })
  @IsNotEmpty()
  @IsString()
  targetRole: string;

  @ApiPropertyOptional({ example: 'Senior', description: 'Seniority level (Junior, Mid, Senior, Staff, Principal)' })
  @IsOptional()
  @IsString()
  seniorityLevel?: string = 'Senior';

  @ApiPropertyOptional({ example: 'Medium', description: 'Interview difficulty (Easy, Medium, Hard)' })
  @IsOptional()
  @IsString()
  difficulty?: string = 'Medium';

  @ApiPropertyOptional({ example: 'Technical', description: 'Interview type (Technical, Behavioral, System Design)' })
  @IsOptional()
  @IsString()
  interviewType?: string = 'Technical';

  @ApiPropertyOptional({ example: 30, description: 'Target interview duration in minutes' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  targetDurationMin?: number = 30;

  @ApiPropertyOptional({ example: 'Senior Technical Interview', description: 'Custom interview title' })
  @IsOptional()
  @IsString()
  title?: string;
}

export class CreateSampleSessionDto extends CreateSessionDto {
  @ApiPropertyOptional({ example: 'Alex Vance Staff Full Stack Resume', description: 'Sample profile title' })
  @IsOptional()
  @IsString()
  sampleResumeName?: string;

  @ApiPropertyOptional({ example: 'Experienced Staff Full Stack Engineer with expertise in Node.js, React, distributed systems, PostgreSQL, Redis, and cloud architecture.', description: 'Sample profile resume text' })
  @IsOptional()
  @IsString()
  sampleResumeText?: string;
}

export class ReuseResumeDto extends CreateSessionDto {
  @ApiProperty({ example: '41884a68-b0db-4204-85fc-4b50a0286828', description: 'Source session ID of the previously uploaded resume' })
  @IsNotEmpty()
  @IsString()
  sourceSessionId: string;
}
