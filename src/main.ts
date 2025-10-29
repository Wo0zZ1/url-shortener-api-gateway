import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'
import cookieParser from 'cookie-parser'
import { ConfigService } from '@nestjs/config'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'

async function bootstrap() {
	const app = await NestFactory.create(AppModule)

	const configService = app.get(ConfigService)

	const PORT = configService.getOrThrow<number>('PORT')

	app.useGlobalPipes(
		new ValidationPipe({
			transform: true,
			whitelist: true,
			forbidNonWhitelisted: true,
		}),
	)

	app.use(cookieParser())
	app.enableCors()

	const swaggerConfig = new DocumentBuilder()
		.setTitle('API Gateway')
		.setDescription('API Gateway for URL Shortener — OpenAPI documentation')
		.setVersion('1.0')
		.addBearerAuth(
			{ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
			'access-token',
		)
		.addSecurity('x-guest-uuid', {
			type: 'apiKey',
			in: 'header',
			name: 'x-guest-uuid',
		})
		.build()

	const document = SwaggerModule.createDocument(app, swaggerConfig)
	SwaggerModule.setup('docs', app, document)

	await app.listen(PORT)

	console.log(`🚀 Gateway API is running on: http://localhost:${PORT}`)
}
void bootstrap()
