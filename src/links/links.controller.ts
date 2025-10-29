import {
	Controller,
	Get,
	Post,
	Delete,
	Param,
	Body,
	UseGuards,
	Req,
	Query,
	Res,
	HttpCode,
	HttpStatus,
	ParseIntPipe,
	ForbiddenException,
	NotFoundException,
} from '@nestjs/common'
import type { Request, Response } from 'express'
import {
	CreateLinkDto,
	GetUserLinksResponse,
	CreateLinkResponse,
	GetLinkStatsResponse,
	DeleteLinkResponse,
	GetUserLinksStatsResponse,
} from '@wo0zz1/url-shortener-shared'

import { LinksHttpClient } from '../common/clients'
import { AuthGuard, ResourceOwnerGuard, ResourceOwner } from '../common/guards'
import type { RequestWithUser } from '../common/guards'
import { getUserHeaders } from '../common/utils'
import { ApiSecurity, ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'

@Controller('links')
@ApiTags('Links')
@UseGuards(AuthGuard)
@ApiBearerAuth('access-token')
@ApiSecurity('x-guest-uuid')
export class LinksController {
	constructor(private readonly linksHttpClient: LinksHttpClient) {}

	@Get('user/:userId')
	@ApiOperation({
		summary: 'Get user links',
		description:
			'Get all links for a specific user with pagination. Requires authentication (JWT or Guest UUID) and ownership verification.',
	})
	@HttpCode(HttpStatus.OK)
	@ResourceOwner('userId', 'params')
	@UseGuards(ResourceOwnerGuard)
	async getUserLinks(
		@Req() request: RequestWithUser,
		@Param('userId', ParseIntPipe) userId: number,
		@Query('page') page: string = '1',
		@Query('limit') limit: string = '20',
	): Promise<GetUserLinksResponse> {
		const userHeaders = getUserHeaders(request)
		return this.linksHttpClient.getUserLinks(userId, +page, +limit, userHeaders)
	}

	@Post('user/:userId')
	@ApiOperation({
		summary: 'Create a new link',
		description:
			'Create a short link for a user. Requires authentication and ownership verification.',
	})
	@HttpCode(HttpStatus.CREATED)
	@ResourceOwner('userId', 'params')
	@UseGuards(ResourceOwnerGuard)
	async createLink(
		@Req() request: RequestWithUser,
		@Body() createLinkDto: CreateLinkDto,
		@Param('userId', ParseIntPipe) userId: number,
	): Promise<CreateLinkResponse> {
		const userHeaders = getUserHeaders(request)
		return this.linksHttpClient.createLink(userId, createLinkDto, userHeaders)
	}

	@Get(':shortLink/stats')
	@ApiOperation({
		summary: 'Get link statistics',
		description:
			'Get detailed statistics for a link. Requires authentication and ownership verification.',
	})
	@HttpCode(HttpStatus.OK)
	async getLinkStats(
		@Req() request: RequestWithUser,
		@Param('shortLink') shortLink: string,
	): Promise<GetLinkStatsResponse> {
		const userHeaders = getUserHeaders(request)

		const link = await this.linksHttpClient.getLinkByShortLink(shortLink, userHeaders)

		if (!link) throw new NotFoundException('Link not found')

		if (request.user.type !== 'Admin' && request.user.sub !== link.userId)
			throw new ForbiddenException(
				'You do not have permission to view this link statistics',
			)

		if (!link.linkStats) throw new NotFoundException('Link statistics not found')

		return link.linkStats
	}

	@Get(':shortLink/qr')
	@ApiOperation({
		summary: 'Generate QR code',
		description:
			'Generate a QR code for a short link. Requires authentication and ownership verification.',
	})
	@HttpCode(HttpStatus.OK)
	async getQRCode(
		@Req() request: RequestWithUser,
		@Param('shortLink') shortLink: string,
		@Res() response: Response,
	): Promise<void> {
		const userHeaders = getUserHeaders(request)

		const link = await this.linksHttpClient.getLinkByShortLink(shortLink, userHeaders)

		if (!link) throw new NotFoundException('Link not found')

		if (request.user.type !== 'Admin' && request.user.sub !== link.userId)
			throw new ForbiddenException('You do not have permission to access this QR code')

		const buffer = await this.linksHttpClient.getQRCode(shortLink, userHeaders)

		response.setHeader('Content-Type', 'image/png')
		response.send(buffer)
	}

	@Delete(':shortLink')
	@ApiOperation({
		summary: 'Delete a link',
		description:
			'Delete a short link. Requires authentication and ownership verification.',
	})
	@HttpCode(HttpStatus.OK)
	async deleteLink(
		@Req() request: RequestWithUser,
		@Param('shortLink') shortLink: string,
	): Promise<DeleteLinkResponse> {
		const userHeaders = getUserHeaders(request)

		const link = await this.linksHttpClient.getLinkByShortLink(shortLink, userHeaders)

		if (!link) throw new NotFoundException('Link not found')

		if (request.user.type !== 'Admin' && request.user.sub !== link.userId)
			throw new ForbiddenException('You do not have permission to delete this link')

		return this.linksHttpClient.deleteLink(shortLink, userHeaders)
	}

	@Get('user/:userId/stats')
	@ApiOperation({
		summary: 'Get user links statistics',
		description:
			'Get aggregated statistics for all links of a user. Requires authentication and ownership verification.',
	})
	@ResourceOwner('userId', 'params')
	@UseGuards(ResourceOwnerGuard)
	@HttpCode(HttpStatus.OK)
	async getUserLinksStats(
		@Req() request: RequestWithUser,
		@Param('userId', ParseIntPipe) userId: number,
	): Promise<GetUserLinksStatsResponse> {
		const userHeaders = getUserHeaders(request)
		return this.linksHttpClient.getUserLinksStats(userId, userHeaders)
	}
}
