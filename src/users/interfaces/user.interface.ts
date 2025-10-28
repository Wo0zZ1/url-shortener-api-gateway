export type UserType = 'Admin' | 'User' | 'Guest'

export interface UserAuth {
	id?: number
	login: string
	hashPassword: string
	passwordUpdatedAt?: Date
}

export interface UserProfile {
	id?: number
	email?: string
	firstName?: string
	lastName?: string
}

export interface UserStats {
	id?: number
	created_links?: number
}

export interface User {
	id: number
	type: UserType
	createdAt: Date
	userAuth?: UserAuth
	userProfile?: UserProfile
	userStats?: UserStats
}

export interface JwtAccessPayload {
	sub: number
	type: UserType
	exp: number
}
