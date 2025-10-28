import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { ConfigModule } from '@nestjs/config'

import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { LinksModule } from './links/links.module'

import { AppController } from './app.controller'
import { RedirectController } from './redirect.controller'
import { AppService } from './app.service'

import { LinksHttpClient } from './common/clients'

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true }),
		HttpModule,
		AuthModule,
		UsersModule,
		LinksModule,
	],
	controllers: [AppController, RedirectController],
	providers: [AppService, LinksHttpClient],
})
export class AppModule {}
