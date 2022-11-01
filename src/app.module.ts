import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { LoggerModule } from './shared/logger/logger.module';

@Module({
  imports: [AuthModule, LoggerModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
