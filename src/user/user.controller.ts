import {
  Controller,
  Post,
  Body,
  Get,
  Delete,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  create(@Body() data: CreateUserDto) {
    return this.userService.create(data);
  }

  @Get('infoUser')
  findAll() {
    return this.userService.findAll();
  }

  @Delete('delete/:id')
  async remove(@Param('id') id: string) {
    return this.userService.delete(id);
  }
}
