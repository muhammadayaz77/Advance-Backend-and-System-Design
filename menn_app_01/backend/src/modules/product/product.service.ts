import {prisma} from '../../lib/prisma.js';
import type {
    CreateProductInput,
} from './product.validation.js'


export const productService = {
    create(data:CreateProductInput){
        return prisma.product.create({data});
    },
    findAll(page = 1,limit = 10){
        return prisma.product.findMany({
            skip : (page - 1) * limit,
            take: limit,
            orderBy : {createdAt : 'desc'}
        })
    }
}