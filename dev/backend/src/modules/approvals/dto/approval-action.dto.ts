import { IsOptional, IsString } from 'class-validator';

export class ApprovalActionDto {
  @IsOptional()
  @IsString()
  comments?: string;
}
