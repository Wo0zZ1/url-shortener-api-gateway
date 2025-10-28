import { Injectable, HttpException, HttpStatus } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { firstValueFrom } from 'rxjs'
import {
	CreateLinkDto,
	RedirectResponse,
	GetUserLinksResponse,
	CreateLinkResponse,
	GetLinkByShortLinkResponse,
	DeleteLinkResponse,
	GetLinkStatsResponse,
	GetQRCodeResponse,
	GetUserLinksStatsResponse,
	UserHeaders,
} from '@wo0zz1/url-shortener-shared'

@Injectable()
export class LinksHttpClient {
	private readonly baseUrl: string
	private readonly gatewaySecret: string

	constructor(private readonly httpService: HttpService) {
		if (!process.env.LINK_SERVICE_URL)
			throw new Error('Env not configured: missed LINK_SERVICE_URL')
		if (!process.env.API_GATEWAY_SECRET)
			throw new Error('Env not configured: missed API_GATEWAY_SECRET')

		this.baseUrl = process.env.LINK_SERVICE_URL
		this.gatewaySecret = process.env.API_GATEWAY_SECRET
	}

	private getGatewayHeaders(userHeaders?: UserHeaders) {
		return {
			'x-api-gateway-secret': this.gatewaySecret,
			...userHeaders,
		}
	}

	async getRedirectUrl(
		shortLink: string,
		userAgent?: string,
		ip?: string,
	): Promise<string> {
		try {
			const response = await firstValueFrom(
				this.httpService.get<RedirectResponse>(
					`${this.baseUrl}/links/redirect/${shortLink}`,
					{
						headers: {
							'user-agent': userAgent,
							'x-forwarded-for': ip,
						},
					},
				),
			)

			return response.data.url
		} catch (error) {
			this.handleError(error, 'Failed to get redirect URL')
			throw error
		}
	}

	async getUserLinks(
		userId: number,
		page: number,
		limit: number,
		userHeaders: UserHeaders,
	): Promise<GetUserLinksResponse> {
		try {
			const response = await firstValueFrom(
				this.httpService.get<GetUserLinksResponse>(
					`${this.baseUrl}/links/user/${userId}`,
					{
						params: { page, limit },
						headers: this.getGatewayHeaders(userHeaders),
					},
				),
			)
			return response.data
		} catch (error) {
			this.handleError(error, 'Failed to get user links')
			throw error
		}
	}

	async createLink(
		userId: number,
		createLinkDto: CreateLinkDto,
		userHeaders: UserHeaders,
	): Promise<CreateLinkResponse> {
		try {
			const response = await firstValueFrom(
				this.httpService.post<CreateLinkResponse>(
					`${this.baseUrl}/links/user/${userId}`,
					createLinkDto,
					{ headers: this.getGatewayHeaders(userHeaders) },
				),
			)
			return response.data
		} catch (error) {
			this.handleError(error, 'Failed to create link')
			throw error
		}
	}

	async getLinkByShortLink(
		shortLink: string,
		userHeaders: UserHeaders,
	): Promise<GetLinkByShortLinkResponse | null> {
		try {
			const response = await firstValueFrom(
				this.httpService.get<GetLinkByShortLinkResponse>(
					`${this.baseUrl}/links/id/${shortLink}`,
					{ headers: this.getGatewayHeaders(userHeaders) },
				),
			)
			return response.data
		} catch (error) {
			if (error.response?.status === 404) return null
			throw error
			this.handleError(error, 'Failed to get link info')
		}
	}

	async deleteLink(
		shortLink: string,
		userHeaders: UserHeaders,
	): Promise<DeleteLinkResponse> {
		try {
			const response = await firstValueFrom(
				this.httpService.delete<DeleteLinkResponse>(
					`${this.baseUrl}/links/${shortLink}`,
					{ headers: this.getGatewayHeaders(userHeaders) },
				),
			)
			return response.data
		} catch (error) {
			this.handleError(error, 'Failed to delete link')
			throw error
		}
	}

	async getLinkStats(
		shortLink: string,
		userHeaders: UserHeaders,
	): Promise<GetLinkStatsResponse> {
		try {
			const response = await firstValueFrom(
				this.httpService.get<GetLinkStatsResponse>(
					`${this.baseUrl}/links/${shortLink}/stats`,
					{ headers: this.getGatewayHeaders(userHeaders) },
				),
			)
			return response.data
		} catch (error) {
			this.handleError(error, 'Failed to get link stats')
			throw error
		}
	}

	async getQRCode(
		shortLink: string,
		userHeaders: UserHeaders,
	): Promise<GetQRCodeResponse> {
		try {
			const response = await firstValueFrom(
				this.httpService.get(`${this.baseUrl}/links/${shortLink}/qr`, {
					headers: this.getGatewayHeaders(userHeaders),
					responseType: 'arraybuffer',
				}),
			)
			return Buffer.from(response.data)
		} catch (error) {
			this.handleError(error, 'Failed to generate QR code')
			throw error
		}
	}

	async getUserLinksStats(
		userId: number,
		userHeaders: UserHeaders,
	): Promise<GetUserLinksStatsResponse> {
		try {
			const response = await firstValueFrom(
				this.httpService.get<GetUserLinksStatsResponse>(
					`${this.baseUrl}/links/user/${userId}/stats`,
					{ headers: this.getGatewayHeaders(userHeaders) },
				),
			)
			return response.data
		} catch (error) {
			this.handleError(error, 'Failed to get user links stats')
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
