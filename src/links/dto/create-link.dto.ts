import { IsInt, IsOptional, IsString, IsUrl } from 'class-validator'

export class CreateLinkDto {
	@IsInt()
	userId: number

	@IsUrl({
		require_valid_protocol: true,
		allow_underscores: true,
		host_whitelist: ['localhost'],
	})
	baseLink: string

	@IsString()
	@IsOptional()
	customShortLink?: string
}
