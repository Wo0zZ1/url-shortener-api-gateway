import {
	Controller,
	Get,
	Patch,
	Delete,
	Param,
	ParseIntPipe,
	Body,
	UseGuards,
	Req,
	HttpCode,
	HttpStatus,
} from '@nestjs/common'
import type { Request } from 'express'

import {
	UpdateUserDto,
	GetAllUsersResponse,
	GetUserByIdResponse,
	GetUserByUuidResponse,
	UpdateUserByIdResponse,
	UpdateUserByUuidResponse,
	DeleteUserByIdResponse,
	DeleteUserByUuidResponse,
} from '@wo0zz1/url-shortener-shared'

import {
	AuthGuard,
	AdminGuard,
	ResourceOwnerGuard,
	ResourceOwner,
} from '../common/guards'

import { getUserHeaders } from '../common/utils'
import { UsersHttpClient } from '../common/clients'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiSecurity } from '@nestjs/swagger'

@Controller('users')
@ApiTags('Users')
@ApiBearerAuth('access-token')
@ApiSecurity('x-guest-uuid')
@UseGuards(AuthGuard)
export class UsersController {
	constructor(private readonly usersHttpClient: UsersHttpClient) {}

	@Get()
	@ApiOperation({ 
		summary: 'Get all users', 
		description: 'Get list of all users. Requires admin privileges.' 
	})
	@UseGuards(AdminGuard)
	async findAll(@Req() request: Request): Promise<GetAllUsersResponse> {
		const userHeaders = getUserHeaders(request)
		return this.usersHttpClient.findAll(userHeaders)
	}

	@Get('id/:id')
	@ApiOperation({ 
		summary: 'Get user by ID', 
		description: 'Get user information by numeric ID. Requires authentication and ownership verification.' 
	})
	@ResourceOwner('id', 'params')
	@UseGuards(ResourceOwnerGuard)
	async findById(
		@Req() request: Request,
		@Param('id', ParseIntPipe) id: number,
	): Promise<GetUserByIdResponse | null> {
		const userHeaders = getUserHeaders(request)
		return this.usersHttpClient.findById(id, userHeaders)
	}

	@Get('uuid/:uuid')
	@ApiOperation({ 
		summary: 'Get user by UUID', 
		description: 'Get user information by UUID (for guests). Requires authentication and ownership verification.' 
	})
	@ResourceOwner('uuid', 'params')
	@UseGuards(ResourceOwnerGuard)
	async findByUUID(
		@Req() request: Request,
		@Param('uuid') uuid: string,
	): Promise<GetUserByUuidResponse | null> {
		const userHeaders = getUserHeaders(request)
		return this.usersHttpClient.findByUUID(uuid, userHeaders)
	}

	@Patch('id/:id')
	@ApiOperation({ 
		summary: 'Update user by ID', 
		description: 'Update user information by numeric ID. Requires authentication and ownership verification.' 
	})
	@ResourceOwner('id', 'params')
	@UseGuards(ResourceOwnerGuard)
	@HttpCode(HttpStatus.OK)
	async update(
		@Req() request: Request,
		@Param('id', ParseIntPipe) id: number,
		@Body() updateUserDto: UpdateUserDto,
	): Promise<UpdateUserByIdResponse> {
		const userHeaders = getUserHeaders(request)
		return this.usersHttpClient.updateById(id, updateUserDto, userHeaders)
	}

	@Patch('uuid/:uuid')
	@ApiOperation({ 
		summary: 'Update user by UUID', 
		description: 'Update user information by UUID (for guests). Requires authentication and ownership verification.' 
	})
	@ResourceOwner('uuid', 'params')
	@UseGuards(ResourceOwnerGuard)
	@HttpCode(HttpStatus.OK)
	async updateByUuid(
		@Req() request: Request,
		@Param('uuid') uuid: string,
		@Body() updateUserDto: UpdateUserDto,
	): Promise<UpdateUserByUuidResponse> {
		const userHeaders = getUserHeaders(request)
		return this.usersHttpClient.updateByUuid(uuid, updateUserDto, userHeaders)
	}

	@Delete('id/:id')
	@ApiOperation({ 
		summary: 'Delete user by ID', 
		description: 'Delete user account by numeric ID. Requires authentication and ownership verification.' 
	})
	@ResourceOwner('id', 'params')
	@UseGuards(ResourceOwnerGuard)
	@HttpCode(HttpStatus.OK)
	async delete(
		@Req() request: Request,
		@Param('id', ParseIntPipe) id: number,
	): Promise<DeleteUserByIdResponse> {
		const userHeaders = getUserHeaders(request)
		return this.usersHttpClient.deleteById(id, userHeaders)
	}

	@Delete('uuid/:uuid')
	@ApiOperation({ 
		summary: 'Delete user by UUID', 
		description: 'Delete user account by UUID (for guests). Requires authentication and ownership verification.' 
	})
	@ResourceOwner('uuid', 'params')
	@UseGuards(ResourceOwnerGuard)
	@HttpCode(HttpStatus.OK)
	async deleteByUuid(
		@Req() request: Request,
		@Param('uuid') uuid: string,
	): Promise<DeleteUserByUuidResponse> {
		const userHeaders = getUserHeaders(request)
		return this.usersHttpClient.deleteByUuid(uuid, userHeaders)
	}
}
