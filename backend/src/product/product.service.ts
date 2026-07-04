import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from 'src/auth/strategies/jwt.strategy';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProductDto } from './dto/product.dto';

@Injectable()
export class ProductService {
    constructor(private readonly prisma : PrismaService){  
    }
    async getAllProducts(data:ProductDto,user:AuthenticatedUser){

        const product = await this.prisma.product.create({
            data : {
                title : data.title,
                userId : user.id
            }
        })
        return {
            product,
            message : 'Product created successfully'
        }
    }
}
