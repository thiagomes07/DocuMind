import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { LlmModule } from './modules/llm/llm.module';
import { StorageModule } from './modules/storage/storage.module';

@Module({
  imports: [AuthModule, UsersModule, DocumentsModule, LlmModule, StorageModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
