import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { AccessTokenPayload } from '@wo0zz1/url-shortener-shared'

export const CurrentUser = createParamDecorator(
	(data: unknown, ctx: ExecutionContext): AccessTokenPayload => {
		const request = ctx.switchToHttp().getRequest()
		return request.user
	},
)
