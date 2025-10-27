import { ObjectType, Field, ID } from '@nestjs/graphql';
import { FriendEdgeUser } from './friend.model';

@ObjectType()
export class FriendPeer {
    @Field(() => ID) 
    id!: string;     // id del Friend

    @Field() 
    status!: string;

    @Field() 
    active!: boolean;
    
    @Field(() => FriendEdgeUser) 
    peer!: FriendEdgeUser; // el “otro” usuario

    @Field(() => ID, { nullable: true })
    chatId?: string;
}
