import { Module } from '@nestjs/common';
import { HomeResolver } from './home.resolver';
import { HomeService } from './home.service';
import { PrismaModule } from 'prisma/prisma.module'; 

@Module({
  imports: [PrismaModule], 
  providers: [HomeResolver, HomeService], 
})
export class HomeModule {}