import { Controller, Get, Param, Req, Res, HttpStatus } from '@nestjs/common'
import type { Request, Response } from 'express'

import { LinksHttpClient } from './common/clients'

@Controller('l')
export class RedirectController {
	constructor(private readonly linksHttpClient: LinksHttpClient) {}

	@Get(':shortLink')
	async redirect(
		@Param('shortLink') shortLink: string,
		@Req() request: Request,
		@Res() response: Response,
	): Promise<void> {
		try {
			const userAgent = request.headers['user-agent']
			const ip = request.ip || request.socket.remoteAddress

			const redirectUrl = await this.linksHttpClient.getRedirectUrl(
				shortLink,
				userAgent,
				ip,
			)

			response.redirect(HttpStatus.MOVED_PERMANENTLY, redirectUrl)
		} catch (error: any) {
			const status = error?.status || HttpStatus.NOT_FOUND
			const message = error?.message || 'Short link not found'

			response.status(status).json({
				statusCode: status,
				message,
			})
		}
	}
}
