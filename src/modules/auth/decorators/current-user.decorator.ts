import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export interface CurrentUserData {
  id: string;
  email: string;
  username: string;
}

interface RequestWithUser {
  user: CurrentUserData;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext): CurrentUserData => {
    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext<{ req: RequestWithUser }>().req;

    if (!request.user) {
      throw new Error(
        'User not found in request. Did you forget @UseGuards(GqlAuthGuard)?',
      );
    }

    return request.user;
  },
);
