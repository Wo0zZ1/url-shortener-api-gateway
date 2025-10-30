import { Injectable, HttpException, HttpStatus } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { firstValueFrom } from 'rxjs'
import {
	CreateUserDto,
	UpdateUserDto,
	CreateUserResponse,
	GetAllUsersResponse,
	GetUserByIdResponse,
	GetUserByUuidResponse,
	UpdateUserByIdResponse,
	UpdateUserByUuidResponse,
	UserHeaders,
} from '@wo0zz1/url-shortener-shared'

@Injectable()
export class UsersHttpClient {
	private readonly baseUrl: string
	private readonly gatewaySecret: string

	constructor(private readonly httpService: HttpService) {
		if (!process.env.USER_SERVICE_URL)
			throw new Error('Env not configured: missed USER_SERVICE_URL')
		if (!process.env.API_GATEWAY_SECRET)
			throw new Error('Env not configured: missed API_GATEWAY_SECRET')

		this.baseUrl = process.env.USER_SERVICE_URL
		this.gatewaySecret = process.env.API_GATEWAY_SECRET
	}

	private getGatewayHeaders(userHeaders?: UserHeaders) {
		return {
			'x-api-gateway-secret': this.gatewaySecret,
			...userHeaders,
		}
	}

	async create(
		createUserDto: CreateUserDto,
		userHeaders: UserHeaders,
	): Promise<CreateUserResponse> {
		try {
			const response = await firstValueFrom(
				this.httpService.post<CreateUserResponse>(
					`${this.baseUrl}/users`,
					createUserDto,
					{ headers: this.getGatewayHeaders(userHeaders) },
				),
			)
			return response.data
		} catch (error) {
			this.handleError(error, 'Failed to create user')
			throw error
		}
	}

	async findAll(userHeaders: UserHeaders): Promise<GetAllUsersResponse> {
		try {
			const response = await firstValueFrom(
				this.httpService.get<GetAllUsersResponse>(`${this.baseUrl}/users`, {
					headers: this.getGatewayHeaders(userHeaders),
				}),
			)
			return response.data
		} catch (error) {
			this.handleError(error, 'Failed to get users')
			throw error
		}
	}

	async findById(
		id: number,
		userHeaders: UserHeaders,
	): Promise<GetUserByIdResponse | null> {
		try {
			const response = await firstValueFrom(
				this.httpService.get<GetUserByIdResponse>(`${this.baseUrl}/users/id/${id}`, {
					headers: this.getGatewayHeaders(userHeaders),
				}),
			)
			return response.data
		} catch (error) {
			if (error.response?.status === 404) return null
			this.handleError(error, 'Failed to get user by id')
			throw error
		}
	}

	async findByUUID(
		uuid: string,
		userHeaders: UserHeaders,
	): Promise<GetUserByUuidResponse | null> {
		try {
			const response = await firstValueFrom(
				this.httpService.get<GetUserByUuidResponse>(
					`${this.baseUrl}/users/uuid/${uuid}`,
					{ headers: this.getGatewayHeaders(userHeaders) },
				),
			)
			return response.data
		} catch (error) {
			if (error.response?.status === 404) return null
			this.handleError(error, 'Failed to get user by UUID')
			throw error
		}
	}

	async findByUUIDPublic(uuid: string): Promise<GetUserByUuidResponse | null> {
		try {
			const response = await firstValueFrom(
				this.httpService.get<GetUserByUuidResponse>(
					`${this.baseUrl}/users/uuid/${uuid}`,
					{ headers: this.getGatewayHeaders() },
				),
			)
			return response.data
		} catch (error: any) {
			if (error?.response?.status === 404) return null
			this.handleError(error, `Failed to get guest user by UUID ${uuid}`)
			throw error
		}
	}

	async updateById(
		id: number,
		updateUserDto: UpdateUserDto,
		userHeaders: UserHeaders,
	): Promise<UpdateUserByIdResponse> {
		try {
			const response = await firstValueFrom(
				this.httpService.patch<UpdateUserByIdResponse>(
					`${this.baseUrl}/users/id/${id}`,
					updateUserDto,
					{ headers: this.getGatewayHeaders(userHeaders) },
				),
			)
			return response.data
		} catch (error) {
			this.handleError(error, 'Failed to update user')
			throw error
		}
	}

	async updateByUuid(
		uuid: string,
		updateUserDto: UpdateUserDto,
		userHeaders: UserHeaders,
	): Promise<UpdateUserByUuidResponse> {
		try {
			const response = await firstValueFrom(
				this.httpService.patch<UpdateUserByUuidResponse>(
					`${this.baseUrl}/users/uuid/${uuid}`,
					updateUserDto,
					{ headers: this.getGatewayHeaders(userHeaders) },
				),
			)
			return response.data
		} catch (error) {
			this.handleError(error, 'Failed to update user by UUID')
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
