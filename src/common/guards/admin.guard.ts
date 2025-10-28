import {
	Injectable,
	CanActivate,
	ExecutionContext,
	ForbiddenException,
} from '@nestjs/common'
import type { RequestWithUser } from './auth.guard'

@Injectable()
export class AdminGuard implements CanActivate {
	canActivate(context: ExecutionContext): boolean {
		const request = context.switchToHttp().getRequest<RequestWithUser>()

		if (!request.user) throw new ForbiddenException('User not authenticated')

		if (request.user.type !== 'Admin')
			throw new ForbiddenException('Admin access required')

		return true
	}
}
