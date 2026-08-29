import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsArray, ValidateNested, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class SubmittedAnswerItemDto {
  @ApiProperty({ description: 'Question ID', example: 'q_1' })
  @IsString()
  questionId: string;

  @ApiPropertyOptional({ description: 'Candidate answer or skip note', example: 'I used Redis distributed locking...' })
  @IsOptional()
  @IsString()
  userAnswer?: string;

  @ApiPropertyOptional({ description: 'Score for this question', example: 85 })
  @IsOptional()
  @IsNumber()
  score?: number;

  @ApiPropertyOptional({ description: 'AI feedback for this question' })
  @IsOptional()
  @IsString()
  feedback?: string;
}

export class CompleteSessionDto {
  @ApiPropertyOptional({ description: 'Overall session percentage score', example: 85 })
  @IsOptional()
  @IsNumber()
  totalScore?: number;

  @ApiPropertyOptional({ description: 'List of answered/evaluated questions', type: [SubmittedAnswerItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubmittedAnswerItemDto)
  answers?: SubmittedAnswerItemDto[];
}
