import {
    Request,
    Response,
    NextFunction,
} from 'express'

import {z} from 'zod';
import {productService} from './product.service.js'
import { createProductSchema } from './product.validation.js';

function parsePagination(value:unknown,fallback : number){
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0
    ? Math.min(parsed,100)
    : fallback;
}

export const productController = {
    async create(req:Request,res:Response,next:NextFunction){

        try{
            const data = createProductSchema.parse(req.body);
            const product = await productService.create(data);

            res.status(201).json({
                succes:true,
                message : "Product created Successfully",
                data : product
            })
        }
        catch(error){
            next(error)
        }
    },
    async findAll(req:Request,res:Response,next:NextFunction){
        try {
            const page = parsePagination(req.query.page,1);
            const limit = parsePagination(req.query.limit,10);

            const [products,total] = await Promise.all([
                productService.findAll(page,limit),
                import("../../lib/prisma.js").then(({prisma}) => 
                prisma.product.count()
                )
            ]);
            res.status(200).json({
                success : true,
                data : products,
                pagination : {
                    page,
                    limit,
                    total,
                    totalPages : Math.ceil(total/limit)
                }
            })
        } catch (error) {
            next(error);
        }
    }
}