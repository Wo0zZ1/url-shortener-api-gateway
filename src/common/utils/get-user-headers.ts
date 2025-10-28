import { UserHeaders } from '@wo0zz1/url-shortener-shared'
import type { Request } from 'express'

export function getUserHeaders(request: Request): UserHeaders {
	return {
		'x-user-id': request.headers['x-user-id'] as string,
		'x-user-uuid': request.headers['x-user-uuid'] as string | undefined,
		'x-user-type': request.headers['x-user-type'] as string,
	}
}
