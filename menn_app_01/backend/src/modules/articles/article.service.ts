import { BadRequestError, ForbiddenError, NotFoundError } from "../../lib/errors.js";
import { notFoundHandler } from "../../middleware/error-handler.js";
import { articleRepository } from "./article.respository.js";
import { CreateArticleInput, UpdateArticleInput } from "./article.schema.js";
import crypto from "crypto"

function generateSlug(title: string): string {
  const baseSlug = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const uniqueSuffix = crypto.randomBytes(3).toString("hex");
  return `${baseSlug}-${uniqueSuffix}`;
}

export const articleService = {
    async createArticle(authorId:string,input:CreateArticleInput){
        
        if(input.categoryId) { 
            const category = await
            articleRepository.findCategoryById(input.categoryId)
            if(!category){
                throw new NotFoundError("Selected category does not exist")
            }
        }

        // Generate a unique slug
        const slug = generateSlug(input.title)

        // Database creation to the repository
        return articleRepository.create(authorId,slug,input)
    },


    async getBySlug(slug:string,viewerId?:string){
        const article = await articleRepository.findBySlug(slug)

        if(!article){
            throw new NotFoundError("Article not found");
        }

        // Privacy Rule
        if(article.status !== 'published' && article.authorId !== viewerId){
            throw new NotFoundError("Article not found");
        }
        return article;
    },

    async setPublishStatus(
        articleId:string,
        userId:string,
        userRole : string,
        status : "published" | "draft"
    ){
        const article = await articleRepository.findById(articleId)

        if(!article){
            throw new NotFoundError("Article not found")
        }

        // Authorization: Only author or admin can change status
        if(article.authorId !== userId && userRole !== "admin"){
            throw new ForbiddenError("You are not authorized to publish this article")
        }
        // Prevent Empty Article
        if(status=== "published" && 
            (!article.content || article.content.length < 10)){
                throw new BadRequestError("Cannot publish an article with insufficient content")
            }
        const publishedAt = status === "published" ? new Date() : null;
        
        return articleRepository.updateStatus(articleId,status,publishedAt)
    },

    async updateArticle(
        articleId : string,
        userId: string,
        userRole: string,
        input: UpdateArticleInput
    ){
        const article = await articleRepository.findById(articleId);

        if(!article){
            throw new NotFoundError("Article not found")
        }
        // Ownership check : only the author and admin can update

        if(article.authorId !== userId && userRole !== "admin"){
            throw new ForbiddenError("You are not authorized to upate this article")
        }
        
        if(input.categoryId){
            const category = await 
            articleRepository.findCategoryById(input.categoryId);
            if(!category){
                throw new NotFoundError("Selected category does not exist")
            }
        }
        let newSlug:string | undefined = undefined;

        if ( input.title && input.title !== article.title){
            newSlug = generateSlug(input.title);
        }
        return articleRepository.update(articleId,newSlug,input)
    }
}