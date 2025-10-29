import {
	Injectable,
	CanActivate,
	ExecutionContext,
	ForbiddenException,
	SetMetadata,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { RequestWithUser } from './auth.guard'

export const RESOURCE_OWNER_KEY = 'resourceOwner'

/**
 * Decorator для указания параметра, содержащего userId/uuid ресурса
 * Автоматически определяет тип пользователя (User или Guest) и проверяет права
 * @param paramName - имя параметра из request (params, query, body)
 * @param paramSource - источник параметра ('params' | 'query' | 'body')
 *
 * @example
 * @ResourceOwner('userId', 'query')  // работает для User (числовой id) и Guest (uuid строка)
 * @ResourceOwner('id', 'params')     // универсально для обоих типов
 */
export const ResourceOwner = (
	paramName: string,
	paramSource: 'params' | 'query' | 'body' = 'params',
) => SetMetadata(RESOURCE_OWNER_KEY, { paramName, paramSource })

@Injectable()
export class ResourceOwnerGuard implements CanActivate {
	constructor(private reflector: Reflector) {}

	canActivate(context: ExecutionContext): boolean {
		const request = context.switchToHttp().getRequest<RequestWithUser>()

		if (!request.user) throw new ForbiddenException('User not authenticated')

		if (request.user.type === 'Admin') return true

		const resourceOwnerMeta = this.reflector.get<{
			paramName: string
			paramSource: string
		}>(RESOURCE_OWNER_KEY, context.getHandler())

		if (!resourceOwnerMeta) return true

		const { paramName, paramSource } = resourceOwnerMeta
		const resourceIdentifier = request[paramSource]?.[paramName]

		if (!resourceIdentifier) throw new ForbiddenException('Resource identifier not found')

		let isOwner = false

		if (request.user.type === 'User') {
			const resourceUserId = Number(resourceIdentifier)
			if (!isNaN(resourceUserId)) isOwner = request.user.sub === resourceUserId
		} else if (request.user.type === 'Guest') {
			const resourceUserId = Number(resourceIdentifier)
			if (!isNaN(resourceUserId)) isOwner = request.user.sub === resourceUserId
			else isOwner = request.user.uuid === String(resourceIdentifier)
		}

		if (!isOwner)
			throw new ForbiddenException('You do not have permission to access this resource')

		return true
	}
}
