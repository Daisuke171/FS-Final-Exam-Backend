import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { Level } from 'src/modules/level/models/level.model';

@ObjectType()
export class User {
  @Field(() => String)
  id: string;

  @Field()
  email: string;

  @Field()
  username: string;

  @Field()
  name: string;

  @Field()
  lastname: string;

  @Field()
  birthday: Date;

  @Field(() => Int)
  levelId: number;

  @Field(() => Level)
  level: Level;

  @Field(() => String, { nullable: true })
  nickname: string | null;

  // ¡¡Se esta usando string porque todavía no están los modelos!!
  @Field(() => [String])
  skins: string[];

  @Field(() => [String])
  friends: string[];

  @Field(() => [String])
  gameHistory: string[];

  @Field(() => [String])
  gameFavorites: string[];

  @Field(() => [String])
  notifications: string[];

  @Field(() => [String])
  chats: string[];

  @Field(() => Int, { nullable: true })
  nextLevelExperience?: number;

  @Field(() => Float)
  levelProgress?: number;

  @Field(() => Int)
  experienceToNextLevel?: number;

  @Field(() => Int)
  totalScore?: number;

  @Field()
  experience: number;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
