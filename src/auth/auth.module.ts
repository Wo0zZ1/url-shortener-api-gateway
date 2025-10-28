import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'

import { AuthController } from './auth.controller'
import { AuthHttpClient, UsersHttpClient } from '../common/clients'

@Module({
	imports: [HttpModule],
	controllers: [AuthController],
	providers: [AuthHttpClient, UsersHttpClient],
})
export class AuthModule {}
