import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
// import { DatabaseModule } from 'database.module';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { Board } from './board.entity';

@Module({
  imports: [
    // DatabaseModule,
    // TypeOrmModule.forFeature([Board]),
    HttpModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env`,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
