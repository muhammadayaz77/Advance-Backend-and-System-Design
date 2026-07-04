import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { Public } from 'src/common/decorators/public.decorator';
import { ProductService } from './product.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { ProductDto } from './dto/product.dto';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

//   @Public()               // ⚡️ makes the route public; remove if you want auth
  @Post()
  getAllProduct(@CurrentUser() user: AuthenticatedUser,
  @Body() data : ProductDto
) {
    // `user` is already nicely typed – no need to read from `req`
    console.log('Current user:', user);
    return this.productService.getAllProducts(data,user);
  }
  @Get(':id')
  getParams(
    @Param('id',ParseIntPipe) id : string,
    @Query('name') query : string,
    @Query('id') queryId : string
) {
    // `user` is already nicely typed – no need to read from `req`
   
    return {query,queryId}
  }
}
