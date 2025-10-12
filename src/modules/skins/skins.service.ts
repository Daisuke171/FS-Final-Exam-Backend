import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSkinInput } from './create-skins.input';
import type { Skin as PrismaSkin } from '@prisma/client';
import { Prisma } from '@prisma/client';

@Injectable()
export class SkinsService {
  constructor(private readonly prisma: PrismaService) {}

  // Create new level
  async create(data: CreateSkinInput): Promise<PrismaSkin> {
    try {
      return await this.prisma.skin.create({ data });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Level with this number or name already exists',
        );
      }
      throw error;
    }
  }

  // Find all levels
  async findAll(): Promise<PrismaSkin[]> {
    return this.prisma.skin.findMany({
      orderBy: { id: 'asc' },
    });
  }

  // Find one level by Id
  async findOne(id: string): Promise<PrismaSkin> {
    const level = await this.prisma.skin.findUnique({ where: { id } });
    if (!level) {
      throw new NotFoundException(`Level with id ${id} not found`);
    }
    return level;
  }

  // Optional: delete level
  async delete(id: string): Promise<PrismaSkin> {
    try {
      return await this.prisma.skin.delete({ where: { id } });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Level with id ${id} not found`);
      }
      throw error;
    }
  }
}
