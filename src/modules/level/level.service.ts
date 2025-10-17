import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateLevelInput } from './create-level.input';
import type { Level as PrismaLevel } from '@prisma/client';
import { Prisma } from '@prisma/client';

@Injectable()
export class LevelService {
  constructor(private readonly prisma: PrismaService) {}

  // Create new level
  async create(data: CreateLevelInput): Promise<PrismaLevel> {
    try {
      return await this.prisma.level.create({ data });
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

  // Create many levels
  async createMany(data: CreateLevelInput[]): Promise<number> {
    try {
      const result = await this.prisma.level.createMany({
        data,
        skipDuplicates: true, // opcional
      });
      return result.count;
    } catch (error) {
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
  async findAll(): Promise<PrismaLevel[]> {
    return this.prisma.level.findMany({
      orderBy: { atomicNumber: 'asc' },
    });
  }

  // Find one level by id
  async findOne(id: number): Promise<PrismaLevel> {
    const level = await this.prisma.level.findUnique({ where: { id } });
    if (!level) {
      throw new NotFoundException(`Level with id ${id} not found`);
    }
    return level;
  }

  // Optional: delete level
  async delete(id: number): Promise<PrismaLevel> {
    try {
      return await this.prisma.level.delete({ where: { id } });
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
