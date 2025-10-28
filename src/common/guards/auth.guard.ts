import {
	Injectable,
	CanActivate,
	ExecutionContext,
	UnauthorizedException,
} from '@nestjs/common'
import { Request } from 'express'
import { UserDataFromAccessTokenPayload } from '@wo0zz1/url-shortener-shared'
import { AuthHttpClient } from '../clients'
import { UsersHttpClient } from '../clients'

export interface RequestWithUser extends Request {
	user: UserDataFromAccessTokenPayload
}

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(
		private readonly authHttpClient: AuthHttpClient,
		private readonly usersHttpClient: UsersHttpClient,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest<RequestWithUser>()

		const guestUUID = request.headers['x-guest-uuid'] as string | undefined

		if (guestUUID) {
			try {
				const guestUser = await this.usersHttpClient.findByUUIDPublic(guestUUID)

				if (!guestUser || guestUser.type !== 'Guest')
					throw new UnauthorizedException('Invalid guest UUID')

				request.user = {
					sub: guestUser.id,
					type: 'Guest',
					uuid: guestUser.uuid!,
				}

				request.headers['x-user-id'] = String(guestUser.id)
				request.headers['x-user-type'] = 'Guest'
				request.headers['x-user-uuid'] = guestUser.uuid!

				return true
			} catch {
				throw new UnauthorizedException('Invalid guest UUID')
			}
		}

		const accessToken = this.extractTokenFromHeader(request)
		if (!accessToken)
			throw new UnauthorizedException('Access token or guest UUID is required')

		try {
			const userPayload = await this.authHttpClient.getCurrentUser(accessToken)

			request.user = userPayload

			request.headers['x-user-id'] = String(userPayload.sub)
			request.headers['x-user-type'] = userPayload.type
			if (userPayload.uuid) request.headers['x-user-uuid'] = userPayload.uuid

			return true
		} catch {
			throw new UnauthorizedException('Invalid or expired access token')
		}
	}

	private extractTokenFromHeader(request: Request): string | undefined {
		const [type, token] = request.headers.authorization?.split(' ') ?? []
		return type === 'Bearer' ? token : undefined
	}
}
