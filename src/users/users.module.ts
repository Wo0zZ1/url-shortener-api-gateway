import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'

import { UsersController } from './users.controller'
import { UsersHttpClient, AuthHttpClient } from '../common/clients'
import { AuthGuard, ResourceOwnerGuard } from '../common/guards'

@Module({
	imports: [HttpModule],
	controllers: [UsersController],
	providers: [UsersHttpClient, AuthHttpClient, AuthGuard, ResourceOwnerGuard],
})
export class UsersModule {}
