import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthenticatedUser } from '../../auth/strategies/jwt.strategy';

@Injectable()
export class FreelancerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const user = req.user as AuthenticatedUser | undefined;
    if (!user || user.accountType !== 'freelancer') {
      throw new ForbiddenException('Freelancer account required');
    }
    return true;
  }
}
