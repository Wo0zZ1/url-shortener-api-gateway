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

@Controller('links')
@UseGuards(AuthGuard)
export class LinksController {
	constructor(private readonly linksHttpClient: LinksHttpClient) {}

	@Get('user/:userId')
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
	@HttpCode(HttpStatus.CREATED)
	async createLink(
		@Req() request: RequestWithUser,
		@Body() createLinkDto: CreateLinkDto,
		@Param('userId', ParseIntPipe) userId: number,
	): Promise<CreateLinkResponse> {
		if (request.user.sub !== userId && request.user.type !== 'Admin')
			throw new ForbiddenException(
				'You do not have permission to create links on behalf of another user',
			)
		const userHeaders = getUserHeaders(request)

		return this.linksHttpClient.createLink(userId, createLinkDto, userHeaders)
	}

	@Get(':shortLink/stats')
	async getLinkStats(
		@Req() request: RequestWithUser,
		@Param('shortLink') shortLink: string,
	): Promise<GetLinkStatsResponse> {
		const userHeaders = getUserHeaders(request)

		const link = await this.linksHttpClient.getLinkByShortLink(shortLink, userHeaders)

		if (!link) throw new ForbiddenException('Link not found')

		if (request.user.type !== 'Admin' && request.user.sub !== link.userId)
			throw new ForbiddenException(
				'You do not have permission to view this link statistics',
			)

		if (!link.linkStats) throw new NotFoundException('Link statistics not found')

		return link.linkStats
	}

	@Get(':shortLink/qr')
	async getQRCode(
		@Req() request: Request,
		@Param('shortLink') shortLink: string,
		@Res() response: Response,
	): Promise<void> {
		const userHeaders = getUserHeaders(request)
		const buffer = await this.linksHttpClient.getQRCode(shortLink, userHeaders)

		response.setHeader('Content-Type', 'image/png')
		response.send(buffer)
	}

	@Delete(':shortLink')
	@HttpCode(HttpStatus.OK)
	async deleteLink(
		@Req() request: Request,
		@Param('shortLink') shortLink: string,
	): Promise<DeleteLinkResponse> {
		const userHeaders = getUserHeaders(request)
		return this.linksHttpClient.deleteLink(shortLink, userHeaders)
	}

	@Get('user/:userId/stats')
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
