import { NextFunction, Request, Response } from "express"
import { commentService } from "./comment.service.js";
import { listCommentsQuerySchema } from "./comment.schema.js";



export const commentController = {

    async create(req:Request,res:Response,next:NextFunction){
        try {
            const user = req.user as {id:string};
            const {articleId} = req.params;
            const comment = await commentService.createComment(
                user.id,
                articleId as string,
                req.body
            );
            return res.status(201).json(comment)
        } catch (err) {
            next(err);
        }
    },

    // Get all Comments
    async getComments(req:Request,res:Response,next:NextFunction){
        try {
            const {articleId} = req.params;
            const {page,limit} = listCommentsQuerySchema.parse(req.query);
            const result = await commentService.getArticleComments(
                articleId as string,
                page,
                limit
            );
            return res.status(200).json(result)
        } catch (err) {
            next(err)
        }
    }
}