import { Injectable, HttpException, HttpStatus } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { firstValueFrom } from 'rxjs'
import {
	LoginDto,
	RegisterUserDto,
	RefreshTokenDto,
	LogoutDto,
	LoginResponse,
	RegisterGuestResponse,
	RegisterUserResponse,
	RefreshTokenResponse,
	GetActiveSessionsResponse,
	RevokeSessionResponse,
	DeleteUserResponse,
	LogoutResponse,
	LogoutAllResponse,
	GetCurrentUserResponse,
	UserHeaders,
} from '@wo0zz1/url-shortener-shared'

@Injectable()
export class AuthHttpClient {
	private readonly baseUrl: string
	private readonly gatewaySecret: string

	constructor(private readonly httpService: HttpService) {
		if (!process.env.AUTH_SERVICE_URL)
			throw new Error('Env not configured: missed AUTH_SERVICE_URL')
		if (!process.env.API_GATEWAY_SECRET)
			throw new Error('Env not configured: missed API_GATEWAY_SECRET')

		this.baseUrl = process.env.AUTH_SERVICE_URL
		this.gatewaySecret = process.env.API_GATEWAY_SECRET
	}

	private getGatewayHeaders(userHeaders?: UserHeaders) {
		return {
			'x-api-gateway-secret': this.gatewaySecret,
			...userHeaders,
		}
	}

	async registerGuest(): Promise<RegisterGuestResponse> {
		try {
			const response = await firstValueFrom(
				this.httpService.post<RegisterGuestResponse>(
					`${this.baseUrl}/auth/register-guest`,
					{},
					{ headers: this.getGatewayHeaders() },
				),
			)
			return response.data
		} catch (error) {
			this.handleError(error, 'Failed to register guest')
			throw error
		}
	}

	async registerUser(
		registerDto: RegisterUserDto,
		guestUuid?: string,
	): Promise<RegisterUserResponse> {
		try {
			const response = await firstValueFrom(
				this.httpService.post<RegisterUserResponse>(
					`${this.baseUrl}/auth/register-user`,
					registerDto,
					{ headers: { ...this.getGatewayHeaders(), 'x-guest-uuid': guestUuid } },
				),
			)
			return response.data
		} catch (error) {
			this.handleError(error, 'Failed to register user')
			throw error
		}
	}

	async login(loginDto: LoginDto, guestUuid?: string): Promise<LoginResponse> {
		try {
			const response = await firstValueFrom(
				this.httpService.post<LoginResponse>(`${this.baseUrl}/auth/login`, loginDto, {
					headers: { ...this.getGatewayHeaders(), 'x-guest-uuid': guestUuid },
				}),
			)
			return response.data
		} catch (error) {
			this.handleError(error, 'Failed to login')
			throw error
		}
	}

	async refreshTokens(refreshTokenDto: RefreshTokenDto): Promise<RefreshTokenResponse> {
		try {
			const response = await firstValueFrom(
				this.httpService.post<RefreshTokenResponse>(
					`${this.baseUrl}/auth/refresh`,
					refreshTokenDto,
					{ headers: this.getGatewayHeaders() },
				),
			)
			return response.data
		} catch (error) {
			this.handleError(error, 'Failed to refresh tokens')
			throw error
		}
	}

	async logout(logoutDto: LogoutDto): Promise<LogoutResponse> {
		try {
			const response = await firstValueFrom(
				this.httpService.post<LogoutResponse>(`${this.baseUrl}/auth/logout`, logoutDto, {
					headers: this.getGatewayHeaders(),
				}),
			)
			return response.data
		} catch (error) {
			this.handleError(error, 'Failed to logout')
			throw error
		}
	}

	async logoutAll(logoutDto: LogoutDto): Promise<LogoutAllResponse> {
		try {
			const response = await firstValueFrom(
				this.httpService.post<LogoutAllResponse>(
					`${this.baseUrl}/auth/logout-all`,
					logoutDto,
					{ headers: this.getGatewayHeaders() },
				),
			)
			return response.data
		} catch (error) {
			this.handleError(error, 'Failed to logout from all devices')
			throw error
		}
	}

	async getCurrentUser(accessToken: string): Promise<GetCurrentUserResponse> {
		try {
			const response = await firstValueFrom(
				this.httpService.get<GetCurrentUserResponse>(`${this.baseUrl}/auth/me`, {
					headers: {
						...this.getGatewayHeaders(),
						Authorization: `Bearer ${accessToken}`,
					},
				}),
			)
			return response.data
		} catch (error) {
			this.handleError(error, 'Failed to get current user')
			throw error
		}
	}

	async getActiveSessions(
		userId: number,
		userHeaders: UserHeaders,
	): Promise<GetActiveSessionsResponse> {
		try {
			const response = await firstValueFrom(
				this.httpService.get<GetActiveSessionsResponse>(
					`${this.baseUrl}/auth/user/${userId}/sessions`,
					{ headers: this.getGatewayHeaders(userHeaders) },
				),
			)
			return response.data
		} catch (error) {
			this.handleError(error, 'Failed to get active sessions')
			throw error
		}
	}

	async revokeSession(
		userId: number,
		jti: number,
		userHeaders: UserHeaders,
	): Promise<RevokeSessionResponse> {
		try {
			const response = await firstValueFrom(
				this.httpService.delete<RevokeSessionResponse>(
					`${this.baseUrl}/auth/user/${userId}/sessions/${jti}`,
					{ headers: this.getGatewayHeaders(userHeaders) },
				),
			)
			return response.data
		} catch (error) {
			this.handleError(error, 'Failed to revoke session')
			throw error
		}
	}

	async deleteUser(
		userId: number,
		userHeaders: UserHeaders,
	): Promise<DeleteUserResponse> {
		try {
			const response = await firstValueFrom(
				this.httpService.delete<DeleteUserResponse>(
					`${this.baseUrl}/auth/user/${userId}`,
					{ headers: this.getGatewayHeaders(userHeaders) },
				),
			)
			return response.data
		} catch (error) {
			this.handleError(error, 'Failed to delete user')
			throw error
		}
	}

	private handleError(error: any, defaultMessage: string): void {
		if (error.response) {
			const status = error.response.status
			const message = error.response.data?.message || defaultMessage

			throw new HttpException(message, status)
		}

		throw new HttpException(defaultMessage, HttpStatus.INTERNAL_SERVER_ERROR)
	}
}
