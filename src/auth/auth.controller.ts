import {
	Controller,
	Post,
	Body,
	HttpCode,
	HttpStatus,
	UseGuards,
	Get,
	Delete,
	Param,
	ParseIntPipe,
	Res,
	Req,
	Query,
	UnauthorizedException,
	Headers,
} from '@nestjs/common'
import type { CookieOptions, Request, Response } from 'express'
import {
	LoginDto,
	LoginResponse,
	RefreshTokenResponse,
	LogoutResponse,
	LogoutAllResponse,
	GetActiveSessionsResponse,
	RevokeSessionResponse,
	RegisterGuestResponse,
	RegisterUserDto,
	RegisterUserResponse,
	type UserDataFromAccessTokenPayload,
	type GetCurrentUserResponse,
} from '@wo0zz1/url-shortener-shared'

import { AuthHttpClient } from '../common/clients'
import { AuthGuard, ResourceOwnerGuard, ResourceOwner } from '../common/guards'
import type { RequestWithUser } from '../common/guards'
import { CurrentUser } from '../common/decorators'
import { getUserHeaders } from 'src/common/utils'

const COOKIE_OPTIONS: CookieOptions = {
	httpOnly: true,
	secure: process.env.NODE_ENV === 'production',
	sameSite: 'strict',
	path: '/',
	maxAge: 7 * 24 * 60 * 60 * 1000,
}

@Controller('auth')
export class AuthController {
	constructor(private readonly authHttpClient: AuthHttpClient) {}

	@Post('register-guest')
	@HttpCode(HttpStatus.CREATED)
	async registerGuest(): Promise<RegisterGuestResponse> {
		return await this.authHttpClient.registerGuest()
	}

	@Post('register-user')
	@HttpCode(HttpStatus.CREATED)
	async register(
		@Body() registerDto: RegisterUserDto,
		@Query('guestUUID') guestUUID?: string,
	): Promise<RegisterUserResponse> {
		return await this.authHttpClient.registerUser(registerDto, guestUUID)
	}

	@Post('login')
	@HttpCode(HttpStatus.OK)
	async login(
		@Res({ passthrough: true }) response: Response,
		@Body() loginDto: LoginDto,
		@Headers('x-guest-uuid') guestUuid?: string,
	): Promise<
		Omit<LoginResponse, 'tokens'> & {
			accessToken: LoginResponse['tokens']['accessToken']
		}
	> {
		const { user, tokens } = await this.authHttpClient.login(loginDto, guestUuid)

		response.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS)

		return {
			user: user,
			accessToken: tokens.accessToken,
		}
	}

	@Post('refresh')
	@HttpCode(HttpStatus.OK)
	async refresh(
		@Req() request: Request,
		@Res({ passthrough: true }) response: Response,
	): Promise<Omit<RefreshTokenResponse, 'refreshToken'>> {
		const refreshToken = request.cookies?.refreshToken

		if (!refreshToken) throw new UnauthorizedException('Refresh token not found')

		const tokens = await this.authHttpClient.refreshTokens({ refreshToken })
		response.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS)

		return { accessToken: tokens.accessToken }
	}

	@Post('logout')
	@HttpCode(HttpStatus.OK)
	async logout(
		@Req() request: Request,
		@Res({ passthrough: true }) response: Response,
	): Promise<LogoutResponse> {
		const refreshToken = request.cookies?.refreshToken

		if (refreshToken) await this.authHttpClient.logout({ refreshToken })

		response.clearCookie('refreshToken')
		return { message: 'Logged out successfully' }
	}

	@Post('logout-all')
	@HttpCode(HttpStatus.OK)
	async logoutAll(
		@Req() request: Request,
		@Res({ passthrough: true }) response: Response,
	): Promise<LogoutAllResponse> {
		const refreshToken = request.cookies?.refreshToken

		if (refreshToken) await this.authHttpClient.logoutAll({ refreshToken })

		response.clearCookie('refreshToken')
		return { message: 'Logged out from all devices successfully' }
	}

	@Get('me')
	@UseGuards(AuthGuard)
	@HttpCode(HttpStatus.OK)
	getCurrentUser(
		@CurrentUser() user: UserDataFromAccessTokenPayload,
	): GetCurrentUserResponse {
		return user
	}

	@Get('user/:userId/sessions')
	@ResourceOwner('userId', 'params')
	@UseGuards(AuthGuard, ResourceOwnerGuard)
	@HttpCode(HttpStatus.OK)
	async getActiveSessions(
		@Param('userId', ParseIntPipe) userId: number,
		@Req() request: RequestWithUser,
	): Promise<GetActiveSessionsResponse> {
		const userHeaders = getUserHeaders(request)
		return this.authHttpClient.getActiveSessions(userId, userHeaders)
	}

	@Delete('user/:userId/sessions/:jti')
	@ResourceOwner('userId', 'params')
	@UseGuards(AuthGuard, ResourceOwnerGuard)
	@HttpCode(HttpStatus.OK)
	async revokeSession(
		@Param('userId', ParseIntPipe) userId: number,
		@Param('jti', ParseIntPipe) jti: number,
		@Req() request: RequestWithUser,
	): Promise<RevokeSessionResponse> {
		const userHeaders = getUserHeaders(request)
		return this.authHttpClient.revokeSession(userId, jti, userHeaders)
	}
}
