import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'

import { LinksController } from './links.controller'
import { LinksHttpClient, AuthHttpClient, UsersHttpClient } from '../common/clients'

@Module({
	imports: [HttpModule],
	controllers: [LinksController],
	providers: [LinksHttpClient, AuthHttpClient, UsersHttpClient],
})
export class LinksModule {}
