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
    },
    async getBySlug(req:Request,res:Response,next:NextFunction){
        try {
            const viewerId = (req.user as {id:string})?.id

            const article = await articleService.getBySlug(req.params.slug as string,viewerId);
            return res.status(200).json(article)
        } catch (err) {
            next(err)
        }
    },
    async setPublishStatus(req:Request,res:Response,next:NextFunction) {
        try {
            const user = req.user as {id:string;role:string};
            const {id} = req.params;
            const {status} = req.body;
            const article = await articleService.setPublishStatus(
                id as string,
                user.id,
                user.role,
                status
            )
            res.status(200).json(article)
        } catch (err) {
            next(err);
        }
    }, 
    async update(req:Request,res:Response,next:NextFunction){
        try {
            const user = req.user as { id : string; role: string};
            const { id } = req.params;

            const article = await articleService.updateArticle(
                id as string,
                user.id,
                user.role,
                req.body
            )

            return res.status(200).json(article);
        } catch (err) {
            next(err)
        }
    }
}
