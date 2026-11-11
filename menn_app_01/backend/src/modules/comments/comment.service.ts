import { BadRequestError, NotFoundError } from "../../lib/errors.js";
import { articleRepository } from "../articles/article.respository.js";
import { commentRepository } from "./comment.repository.js";
import { CreateCommentInput } from "./comment.schema.js";



export const commentService = {
    async createComment(userId:string,articleId:string,input:CreateCommentInput){
        const article = await articleRepository.findById(articleId);
        
        if(!article){
            throw new NotFoundError("Article not found")
        }

        if(article.status !== "published"){
            throw new BadRequestError("You cannot comment on an unpublished draft")
        }

        // If this is reply. verify the parent comment exists
        if(input.parentId){
            const parentComment = await commentRepository.findCommentById(input.parentId);
            if(!parentComment){
                throw new NotFoundError("Parent Cannot found;")
            }
            if(parentComment.articleId !== articleId ){
                throw new BadRequestError("Parent comment belongs to a different article")
            }
        }
        // Ensure reply belongs to the same article as parent
        // Save Comment to database

        return commentRepository.create(userId,articleId,input)
    },

    // Get Comments
    async getArticleComments(articleId:string,page:number=1,limit:number=20){
        const article = await articleRepository.findById(articleId);
        if(!article){
            throw new NotFoundError("Article not found");
        }
        // Fetch Comments with pagination & Replies
        return commentRepository.findManyByArticleId(articleId,page,limit)
    }
}