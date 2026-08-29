import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SubmitAnswerDto {
  @ApiProperty({ example: 'q_1', description: 'Question ID being answered' })
  @IsNotEmpty()
  @IsString()
  questionId: string;

  @ApiProperty({
    example: 'We designed the architecture using an event-driven pattern with Kafka partition keys to ensure ordering and idempotent database writes.',
    description: 'Candidate transcript or written answer',
  })
  @IsNotEmpty()
  @IsString()
  answer: string;
}
