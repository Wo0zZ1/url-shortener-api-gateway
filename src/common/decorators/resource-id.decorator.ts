import { SetMetadata } from '@nestjs/common'

export const RESOURCE_ID_KEY = 'resourceIdParam'
export const ResourceId = (paramName: string) => SetMetadata(RESOURCE_ID_KEY, paramName)
