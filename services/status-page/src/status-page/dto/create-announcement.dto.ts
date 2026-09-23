import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class CreateAnnouncementDto {
  @IsString()
  @IsNotEmpty()
  message!: string;

  @IsIn(['investigating', 'identified', 'monitoring', 'resolved'])
  current_status!: string;
}