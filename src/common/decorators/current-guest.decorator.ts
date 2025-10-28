import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import type { Request } from 'express'

export const CurrentGuest = createParamDecorator(
	(data: unknown, context: ExecutionContext) => {
		const request = context.switchToHttp().getRequest<Request>()
		const guestUUID = request.headers.guestUUID as string | undefined

		return guestUUID
	},
)
