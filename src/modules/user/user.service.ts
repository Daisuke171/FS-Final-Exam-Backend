import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import type { User, Skin } from '@prisma/client';
import { Prisma } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  // Delete user by id (returns user without password)
  async delete(userId: string): Promise<Omit<User, 'password'>> {
    try {
      const user = await this.prisma.user.delete({
        where: { id: userId },
      });
      const { password: _password, ...userData } = user;
      void _password;
      return userData;
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Usuario con id ${userId} no encontrado`);
      }

      const message =
        error instanceof Error ? error.message : 'Internal server error';
      throw new InternalServerErrorException(message);
    }
  }

  // Find all users with selected fields
  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        lastname: true,
        nickname: true,
        username: true,
        levelId: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Find one user by ID
  async findOne(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        lastname: true,
        nickname: true,
        username: true,
        experience: true,
        coins: true,
        level: true,
        createdAt: true,

        skins: {
          include: {
            skin: true, // brings full Skin info
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con id ${userId} no encontrado`);
    }

    return user;
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        level: true,
        skins: {
          include: {
            skin: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con id ${userId} no encontrado`);
    }

    return user;
  }

  async findByEmailOrUsername(identifier: string): Promise<User> {
    if (!identifier) {
      throw new BadRequestException('Falta el email o username');
    }

    const normalized = identifier.trim().toLowerCase();

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: normalized, mode: 'insensitive' } },
          { username: { equals: normalized, mode: 'insensitive' } },
        ],
      },
      include: {
        level: true,
      },
    });

    console.log('Buscando usuario con:', normalized);
    console.log('Resultado de búsqueda:', user);

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  async getUserSkinsWithStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        level: true,
        skins: {
          include: {
            skin: true,
          },
        },
      },
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');

    // Obtener todos los skins
    const allSkins = await this.prisma.skin.findMany({
      orderBy: { level: 'asc' },
    });

    const ownedSkinsMap = new Map(user.skins.map((us) => [us.skin.id, us]));

    // Mapear con estado
    return allSkins.map((skin) => {
      const userSkin = ownedSkinsMap.get(skin.id);
      const isUnlocked = skin.level <= user.level.atomicNumber;
      const isOwned = !!userSkin;
      const isActive = userSkin?.active || false;

      return {
        ...skin,
        isUnlocked,
        isOwned,
        isActive,
        userSkinId: userSkin?.id,
      };
    });
  }

  async activateSkin(userId: string, skinId: string) {
    // Verificar que el skin esté desbloqueado
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { level: true },
    });

    const skin = await this.prisma.skin.findUnique({
      where: { id: skinId },
    });

    if (!user || !skin) {
      throw new Error('Usuario o skin no encontrado');
    }

    if (skin.level > user.level.atomicNumber) {
      throw new Error(`Necesitas nivel ${skin.level} para usar este skin`);
    }

    // Verificar si el usuario ya tiene este skin
    let userSkin = await this.prisma.userSkin.findFirst({
      where: { userId, skinId },
    });

    // Si no lo tiene, crearlo (desbloquearlo)
    if (!userSkin) {
      userSkin = await this.prisma.userSkin.create({
        data: {
          userId,
          skinId,
          active: false,
        },
      });
    }

    // Transacción: desactivar todos y activar el seleccionado
    return this.prisma.$transaction([
      this.prisma.userSkin.updateMany({
        where: { userId },
        data: { active: false },
      }),
      this.prisma.userSkin.update({
        where: { id: userSkin.id },
        data: { active: true },
        include: {
          skin: true,
        },
      }),
    ]);
  }

  async unlockSkinsByLevel(userId: string, specificLevel?: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        level: true,
        skins: {
          select: { skinId: true },
        },
      },
    });

    if (!user) throw new Error('Usuario no encontrado');

    const ownedSkinIds = user.skins.map((us) => us.skinId);

    // Buscar skins que puede desbloquear
    const skinsToUnlock = await this.prisma.skin.findMany({
      where: {
        level: specificLevel ? specificLevel : { lte: user.level.atomicNumber },
        id: {
          notIn: ownedSkinIds,
        },
      },
      orderBy: {
        level: 'asc',
      },
    });

    if (skinsToUnlock.length === 0) {
      return [];
    }

    // Desbloquear los skins
    await this.prisma.userSkin.createMany({
      data: skinsToUnlock.map((skin) => ({
        userId,
        skinId: skin.id,
        active: false,
      })),
    });

    return skinsToUnlock;
  }

  async addExperience(userId: string, experience: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { level: true },
    });

    if (!user) throw new Error('Usuario no encontrado');

    const newExperience = user.experience + experience;
    const currentLevel = user.level.atomicNumber;

    // Buscar el siguiente nivel
    const nextLevel = await this.prisma.level.findFirst({
      where: {
        experienceRequired: {
          lte: newExperience,
        },
        atomicNumber: {
          gt: currentLevel,
        },
      },
      orderBy: {
        atomicNumber: 'desc',
      },
    });

    // Actualizar experiencia y nivel si corresponde
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        experience: newExperience,
        ...(nextLevel && { levelId: nextLevel.id }),
      },
      include: {
        level: true,
      },
    });

    // Si subió de nivel, desbloquear skins
    let unlockedSkins: Skin[] = [];
    if (nextLevel) {
      unlockedSkins = await this.unlockSkinsByLevel(
        userId,
        nextLevel.atomicNumber,
      );
    }

    return {
      user: updatedUser,
      leveledUp: !!nextLevel,
      previousLevel: currentLevel,
      newLevel: updatedUser.level.atomicNumber,
      unlockedSkins,
    };
  }

  async getUserWithLevel(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        level: true,
      },
    });
  }
}
