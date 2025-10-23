import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { ObservableService } from '@common/observable.service';
import { randomBytes, createHash } from 'crypto';
import { addHours, isBefore } from 'date-fns';
import type { Friend as PrismaFriend, Prisma } from '@prisma/client';
import {
  RequestFriendByUsernameInput,
  CreateFriendInviteInput,
  AcceptFriendInviteInput,
  UpdateFriendStatusInput,
  FriendStatus,
  ToggleFriendActiveInput,
} from './dto';

type FriendListItem = Prisma.FriendGetPayload<{
  select: {
    id: true;
    status: true;
    active: true;
    requesterId: true;
    receiverId: true;
    createdAt: true;
    updatedAt: true;
    requester: { select: { id: true; nickname: true } };
    receiver: { select: { id: true; nickname: true } };
  };
}>;

@Injectable()
export class FriendsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bus: ObservableService,
  ) { }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  async listForUser(userId: string) {
    const rows = await this.prisma.friend.findMany({
      where: { OR: [{ requesterId: userId }, { receiverId: userId }] },
      select: {
        id: true,
        status: true,
        active: true,
        requesterId: true,
        receiverId: true,
        createdAt: true,
        updatedAt: true,
        requester: {
          select: {
            id: true,
            nickname: true,
            skins: {
              where: { active: true },
              take: 1,
              select: {
                skin: { select: { id: true, name: true, img: true, level: true, value: true } },
              },
            },
          },
        },
        receiver: {
          select: {
            id: true,
            nickname: true,
            skins: {
              where: { active: true },
              take: 1,
              select: {
                skin: { select: { id: true, name: true, img: true, level: true, value: true } },
              },
            },
          },
        },
        chats: {
          select: { id: true }
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(r => ({
      ...r,
      requester: r.requester
        ? {
          id: r.requester.id,
          nickname: r.requester.nickname,
          activeSkin: r.requester.skins?.[0]?.skin ?? null,
        }
        : null,
      receiver: r.receiver
        ? {
          id: r.receiver.id,
          nickname: r.receiver.nickname,
          activeSkin: r.receiver.skins?.[0]?.skin ?? null,
        }
        : null,
    }));
  }

  async listPeersForUser(userId: string) {
    const rows = await this.listForUser(userId);
    return rows.map(r => {
      const isRequester = r.requesterId === userId;
      const peer = isRequester ? r.receiver : r.requester;
      return {
        id: r.id,
        status: r.status,
        active: r.active,
        chatId: r.chats?.[0]?.id,
        peer, // { id, nickname, activeSkin? }
      };
    });
  }

  async getFriendIds(userId: string): Promise<string[]> {
    const rows = await this.prisma.friend.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [{ requesterId: userId }, { receiverId: userId }],
      },
      select: { requesterId: true, receiverId: true },
    });

    const out = new Set<string>();
    for (const r of rows) {
      const peer = r.requesterId === userId ? r.receiverId : r.requesterId;
      out.add(peer);
    }
    return [...out];
  }


  // --- solicitud por username
  async requestByUsername(input: RequestFriendByUsernameInput): Promise<PrismaFriend> {
    const receiver = await this.prisma.user.findUnique({ where: { username: input.username } });
    if (!receiver) throw new NotFoundException('Username no encontrado');
    if (receiver.id === input.requesterId) throw new BadRequestException('No podés agregarte a vos mismo');

    const existing = await this.prisma.friend.findFirst({
      where: {
        OR: [
          { requesterId: input.requesterId, receiverId: receiver.id },
          { requesterId: receiver.id, receiverId: input.requesterId },
        ],
      },
    });
    if (existing) return existing;

    const friend = await this.prisma.friend.create({
      data: { requesterId: input.requesterId, receiverId: receiver.id, status: 'PENDING' },
    });

    this.bus.notify({ type: 'notification', data: { type: 'friend:request', entity: friend.id, userId: receiver.id } });
    return friend;
  }

  // --- crear link one-shot
  async createInvite(input: CreateFriendInviteInput): Promise<string> {
    const inviter = await this.prisma.user.findUnique({ where: { id: input.inviterId } });
    if (!inviter) throw new NotFoundException('Inviter no existe');

    let targetUserId: string | null = null;
    if (input.targetUsername !== undefined && input.targetUsername !== null) {
      const target = await this.prisma.user.findUnique({ where: { username: input.targetUsername }, select: { id: true } });
      if (!target) throw new NotFoundException('Username objetivo no existe');
      if (target.id === inviter.id) throw new BadRequestException('No podés invitarte a vos mismo');
      targetUserId = target.id;
    }

    const token = randomBytes(32).toString('base64url');
    const tokenHash = this.hashToken(token);
    const expiresAt = addHours(new Date(), input.ttlHours ?? 24);

    await this.prisma.friendInvite.create({
      data: {
        inviterId: inviter.id,
        tokenHash,
        targetUserId,
        expiresAt,
      },
    });

    // ajustar dominio/URL según tu front
    return `${process.env.URL_FRONTEND}/invite/friend?token=${token}`;
  }

  // --- aceptar link (consumir)
  async acceptInvite(input: AcceptFriendInviteInput): Promise<PrismaFriend> {
    const receiver = await this.prisma.user.findUnique({ where: { id: input.receiverId } });
    if (!receiver) throw new NotFoundException('Receiver no existe');

    const tokenHash = this.hashToken(input.token);
    const invite = await this.prisma.friendInvite.findUnique({ where: { tokenHash } });
    if (!invite) throw new NotFoundException('Invitación inválida');
    if (invite.usedAt) throw new BadRequestException('Invitación ya usada');
    if (isBefore(invite.expiresAt, new Date())) throw new BadRequestException('Invitación expirada');
    if (invite.targetUserId && invite.targetUserId !== receiver.id) throw new ForbiddenException('Invitación no destinada a este usuario');

    const existing = await this.prisma.friend.findFirst({
      where: {
        OR: [
          { requesterId: invite.inviterId, receiverId: receiver.id },
          { requesterId: receiver.id, receiverId: invite.inviterId },
        ],
      },
    });

    return await this.prisma.$transaction(async (tx) => {
      await tx.friendInvite.update({
        where: { tokenHash },
        data: { usedAt: new Date(), usedById: receiver.id },
      });

      if (existing) {
        // Aseguramos el chat por si la relación ya existía y no tenía chat
        const existingChat = await tx.chat.findFirst({ where: { friendId: existing.id } });
        if (!existingChat) {
          await tx.chat.create({
            data: {
              userId: receiver.id,
              friendId: existing.id,
            },
          });
        }
        return existing;
      }

      const $friend = await tx.friend.create({
        data: {
          requesterId: invite.inviterId,
          receiverId: receiver.id,
          status: 'ACCEPTED', // por link aceptamos directo
          active: true,
        },
      });

      // creamos el chat si no existe
      await tx.chat.create({
        data: {
          userId: invite.inviterId,
          friendId: $friend.id,     // clave: referencia a la relación
        },
      });

      this.bus.notify({ type: 'notification', data: { type: 'friend:accepted', entity: $friend.id, userId: invite.inviterId } });
      this.bus.notify({ type: 'notification', data: { type: 'friend:accepted', entity: $friend.id, userId: receiver.id } });

      return $friend;
    });
  }

  // Actualizar estado (aceptar/rechazar)
  async updateStatus(input: UpdateFriendStatusInput): Promise<PrismaFriend> {
    const next = await this.prisma.friend.update({
      where: { id: input.id },
      data: { status: input.status },
    });
    // Si pasó a ACCEPTED, asegurar chat
    if (input.status === 'ACCEPTED') {
      await this.prisma.$transaction(async (tx) => {
        const exists = await tx.chat.findFirst({ where: { friendId: next.id } });
        if (!exists) {
          await tx.chat.create({
            data: {
              userId: next.requesterId,
              friendId: next.id,
            },
          });
        }
      });
    }
    this.bus.notify({ type: 'notification', data: { type: 'friend:status', entity: next.id, status: next.status, userId: next.receiverId } });
    return next;
  }

  // actualizar estado (aceptar/ rechazar/ bloquear)
  async toggleActive(input: ToggleFriendActiveInput): Promise<PrismaFriend> {
    const next = await this.prisma.friend.update({
      where: { id: input.id },
      data: { active: input.active },
    });
    this.bus.notify({ type: 'notification', data: { type: 'friend:active', entity: next.id, active: next.active, userId: next.receiverId } });
    return next;
  }

  // Eliminar amigo
  async remove(id: string): Promise<boolean> {
    await this.prisma.friend.delete({ where: { id } });
    // Borramos el chat 
    await this.prisma.$transaction(async (tx) => {
      const chat = await tx.chat.findFirst({ where: { friendId: id } });
      if (chat) await tx.chat.delete({ where: { id: chat.id } });
    });
    // Notificamos
    this.bus.notify({ type: 'notification', data: { type: 'friend:removed', entity: id } });
    this.bus.notify({ type: 'notification', data: { type: 'chat:removed', entity: id } });
    return true;
  }
}
