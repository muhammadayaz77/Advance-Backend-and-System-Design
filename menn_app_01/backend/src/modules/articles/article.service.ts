import { NotFoundError } from "../../lib/errors.js";
import { articleRepository } from "./article.respository.js";
import { CreateArticleInput } from "./article.schema.js";
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
    }
}