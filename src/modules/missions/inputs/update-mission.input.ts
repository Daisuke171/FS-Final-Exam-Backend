import { InputType, PartialType } from '@nestjs/graphql';
import { CreateMissionInput } from './create-mission.input';

@InputType()
export class UpdateMissionInput extends PartialType(CreateMissionInput) {}
