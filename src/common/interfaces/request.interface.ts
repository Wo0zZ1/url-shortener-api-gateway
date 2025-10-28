import { type Request } from 'express'
import { type User, type JwtAccessPayload } from 'src/users/interfaces'

export interface RequestWithUserPayload extends Request {
	user: JwtAccessPayload
}

export interface RequestWithUser extends Request {
	user: User
}
