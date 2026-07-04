import { IsEnum } from 'class-validator';
import { AccountType, UserRole } from '@prisma/client';

export class CompleteOnboardingDto {
  @IsEnum(AccountType)
  accountType: AccountType;

  @IsEnum(UserRole)
  role: UserRole;
}
