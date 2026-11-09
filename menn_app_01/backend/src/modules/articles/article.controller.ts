import type {Request,Response,NextFunction} from "express";
import { articleService } from "./article.service.js";

export const articleController = {
    async create(req:Request,res:Response,next:NextFunction){
        try{
            const user = req.user as {id:string};

            const article = await articleService.createArticle(user.id,req.body)
            
            // Status 201 Created
            return res.status(201).json(article)
        } catch (err){
            next(err)
        }
    }
}
