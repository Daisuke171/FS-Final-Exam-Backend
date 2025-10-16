import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { ObservableService } from '@common/observable.service';
import { StartCallInput } from './dto/start-call.input';
import { AnswerCallInput } from './dto/answer-call.input';
import { RejectCallInput } from './dto/reject-call.input';
import { EndCallInput } from './dto/end-call.input';
import { IceCandidateInput } from './dto/ice-candidate.input';
import { CallStatus } from './models/call.model';

@Injectable()
export class CallsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bus: ObservableService,
  ) {}

  async startCall(input: StartCallInput) {
    const { callerId, calleeId, sdpOffer } = input;
    if (callerId === calleeId) throw new BadRequestException('No podés llamarte a vos mismo');

    const [caller, callee] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: callerId }, select: { id: true } }),
      this.prisma.user.findUnique({ where: { id: calleeId }, select: { id: true } }),
    ]);
    if (!caller || !callee) throw new NotFoundException('Usuario no encontrado');

    const call = await this.prisma.call.create({
      data: { callerId, calleeId, sdpOffer, status: 'RINGING' },
    });

    // Notificación interna/broadcast
    this.bus.notify({
      type: 'call',
      data: { event: 'ringing', callId: call.id, callerId, calleeId },
    });

    return call;
  }

  async answerCall(input: AnswerCallInput) {
    const { callId, calleeId, sdpAnswer } = input;
    const call = await this.prisma.call.findUnique({ where: { id: callId } });
    if (!call) throw new NotFoundException('Call no existe');
    if (call.calleeId !== calleeId) throw new ForbiddenException('Solo el callee puede responder');
    if (call.status !== 'RINGING') throw new BadRequestException('La llamada no está sonando');

    const updated = await this.prisma.call.update({
      where: { id: callId },
      data: { sdpAnswer, status: 'ACCEPTED' },
    });

    this.bus.notify({
      type: 'call',
      data: { event: 'accepted', callId, callerId: call.callerId, calleeId },
    });

    return updated;
  }

  async rejectCall(input: RejectCallInput) {
    const { callId, calleeId } = input;
    const call = await this.prisma.call.findUnique({ where: { id: callId } });
    if (!call) throw new NotFoundException('Call no existe');
    if (call.calleeId !== calleeId) throw new ForbiddenException('Solo el callee puede rechazar');
    if (call.status !== 'RINGING') throw new BadRequestException('La llamada no está sonando');

    const updated = await this.prisma.call.update({
      where: { id: callId },
      data: { status: 'REJECTED' },
    });

    this.bus.notify({
      type: 'call',
      data: { event: 'rejected', callId, callerId: call.callerId, calleeId },
    });

    return updated;
  }

  async endCall(input: EndCallInput) {
    const { callId, userId } = input;
    const call = await this.prisma.call.findUnique({ where: { id: callId } });
    if (!call) throw new NotFoundException('Call no existe');

    const isParticipant = [call.callerId, call.calleeId].includes(userId);
    if (!isParticipant) throw new ForbiddenException('Solo participantes pueden cortar');

    if (call.status === 'ENDED' || call.status === 'REJECTED') return call;

    const updated = await this.prisma.call.update({
      where: { id: callId },
      data: { status: 'ENDED' },
    });

    this.bus.notify({
      type: 'call',
      data: { event: 'ended', callId, by: userId, callerId: call.callerId, calleeId: call.calleeId },
    });

    return updated;
  }

  // ICE candidates no se persisten: se reenvían por pub/sub (signaling)
  async sendIceCandidate(input: IceCandidateInput) {
    this.bus.notify({
      type: 'call',
      data: { event: 'ice', ...input },
    });
    return true;
  }

  // Helpers
  getById(callId: string) {
    return this.prisma.call.findUnique({ where: { id: callId } });
  }

  getActiveCallsByUser(userId: string) {
    return this.prisma.call.findMany({
      where: {
        OR: [{ callerId: userId }, { calleeId: userId }],
        status: { in: [CallStatus.RINGING, CallStatus.ACCEPTED] as any },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
