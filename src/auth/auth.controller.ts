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
	UnauthorizedException,
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
	DeleteUserResponse,
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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiSecurity } from '@nestjs/swagger'

const COOKIE_OPTIONS: CookieOptions = {
	httpOnly: true,
	secure: process.env.NODE_ENV === 'production',
	sameSite: 'strict',
	path: '/',
	maxAge: 7 * 24 * 60 * 60 * 1000,
}

@Controller('auth')
@ApiTags('Authentication')
export class AuthController {
	constructor(private readonly authHttpClient: AuthHttpClient) {}

	@Post('register-guest')
	@ApiOperation({
		summary: 'Register as guest',
		description:
			'Create a new guest user account. Returns user data with UUID for future authentication.',
	})
	@HttpCode(HttpStatus.CREATED)
	async registerGuest(): Promise<RegisterGuestResponse> {
		return await this.authHttpClient.registerGuest()
	}

	@Post('register-user')
	@ApiOperation({
		summary: 'Register new user',
		description:
			'Create a new user account. Optionally provide x-guest-uuid to migrate guest data to the new user.',
	})
	@ApiSecurity('x-guest-uuid')
	@HttpCode(HttpStatus.CREATED)
	async register(
		@Body() registerDto: RegisterUserDto,
		@Req() request: Request,
	): Promise<RegisterUserResponse> {
		const guestUuid = request.headers['x-guest-uuid'] as string | undefined
		return await this.authHttpClient.registerUser(registerDto, guestUuid)
	}

	@Post('login')
	@ApiOperation({
		summary: 'Login',
		description:
			'Authenticate with login and password. Optionally provide x-guest-uuid to migrate guest data. Returns access token and sets refresh token cookie.',
	})
	@ApiSecurity('x-guest-uuid')
	@HttpCode(HttpStatus.OK)
	async login(
		@Res({ passthrough: true }) response: Response,
		@Body() loginDto: LoginDto,
		@Req() request: Request,
	): Promise<
		Omit<LoginResponse, 'tokens'> & {
			accessToken: LoginResponse['tokens']['accessToken']
		}
	> {
		const guestUuid = request.headers['x-guest-uuid'] as string | undefined
		const { user, tokens } = await this.authHttpClient.login(loginDto, guestUuid)

		response.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS)

		return {
			user: user,
			accessToken: tokens.accessToken,
		}
	}

	@Post('refresh')
	@ApiOperation({
		summary: 'Refresh tokens',
		description:
			'Refresh access token using refresh token from cookies. Returns new access token and updates refresh token cookie.',
	})
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
	@ApiOperation({
		summary: 'Logout',
		description:
			'Logout from current session. Invalidates refresh token and clears cookie.',
	})
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
	@ApiOperation({
		summary: 'Logout from all devices',
		description: 'Logout from all sessions. Invalidates all refresh tokens for the user.',
	})
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
	@ApiOperation({
		summary: 'Get current user',
		description:
			'Get current authenticated user information. Requires JWT or Guest UUID authentication.',
	})
	@ApiBearerAuth('access-token')
	@ApiSecurity('x-guest-uuid')
	@UseGuards(AuthGuard)
	@HttpCode(HttpStatus.OK)
	getCurrentUser(
		@CurrentUser() user: UserDataFromAccessTokenPayload,
	): GetCurrentUserResponse {
		return user
	}

	@Get('user/:userId/sessions')
	@ApiOperation({
		summary: 'Get active sessions',
		description:
			'Get all active sessions for a user. Requires authentication and ownership verification.',
	})
	@ApiBearerAuth('access-token')
	@ApiSecurity('x-guest-uuid')
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
	@ApiOperation({
		summary: 'Revoke session',
		description:
			'Revoke a specific session by JTI. Requires authentication and ownership verification.',
	})
	@ApiBearerAuth('access-token')
	@ApiSecurity('x-guest-uuid')
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

	@Delete('user/:userId')
	@ApiOperation({
		summary: 'Delete user',
		description:
			'Delete user account and all associated authentication data. Requires authentication and ownership verification. This action cannot be undone.',
	})
	@ApiBearerAuth('access-token')
	@ApiSecurity('x-guest-uuid')
	@ResourceOwner('userId', 'params')
	@UseGuards(AuthGuard, ResourceOwnerGuard)
	@HttpCode(HttpStatus.OK)
	async deleteUser(
		@Param('userId', ParseIntPipe) userId: number,
		@Req() request: RequestWithUser,
		@Res({ passthrough: true }) response: Response,
	): Promise<DeleteUserResponse> {
		const userHeaders = getUserHeaders(request)
		const result = await this.authHttpClient.deleteUser(userId, userHeaders)

		response.clearCookie('refreshToken')

		return result
	}
}
