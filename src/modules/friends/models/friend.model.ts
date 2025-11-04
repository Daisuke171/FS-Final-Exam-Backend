import { ObjectType, Field, ID, GraphQLISODateTime, Int, Float } from '@nestjs/graphql';

@ObjectType()
export class SkinLite {
  @Field(() => ID) 
  id!: string;

  @Field() 
  name!: string;

  @Field() 
  img!: string;

  @Field(() => Int) 
  level!: number;

  @Field(() => Float) 
  value?: number;
}

@ObjectType()
export class FriendEdgeUser {
  @Field(() => ID) 
  id!: string;

  @Field(() => String, { nullable: true }) 
  nickname?: string | null;

  @Field(() => SkinLite, { nullable: true })
  activeSkin?: SkinLite | null;
}

@ObjectType()
export class Friend {
  @Field(() => ID) 
  id!: string;
  @Field() 
  status!: string;
  @Field() 
  active!: boolean;

  @Field(() => ID) 
  requesterId!: string;

  @Field(() => ID) 
  receiverId!: string;

  @Field(() => FriendEdgeUser, { nullable: true }) 
  requester?: FriendEdgeUser | null;
  @Field(() => FriendEdgeUser, { nullable: true }) 
  receiver?: FriendEdgeUser | null;

  @Field(() => String, { nullable: true })
  chatId?: string | null;

  @Field(() => GraphQLISODateTime) 
  createdAt!: Date;
  @Field(() => GraphQLISODateTime) 
  updatedAt!: Date;
}
