import { prisma } from "../../lib/prisma.js";
import { CreateArticleInput } from "./article.schema.js";



export const articleRepository = {
    async findCategoryById(categoryId:string){
        return await prisma.category.findUnique({
            where :{
                id:categoryId
            }
        })
    },
    async create(authorId:string,slug:string,input:CreateArticleInput){
        const {title,content,excerpt,coverImage,categoryId,tags} = input;

        return prisma.article.create({
            data : {
                title,
                content,
                slug,
                excerpt : excerpt || content.slice(0,150),
                coverImage,
                categoryId:categoryId || null,
                status:"draft",
                authorId,
                tags : {
                // create tags if new, or connects if it already exists
                connectOrCreate : tags?.map((tagName)=>{
                    const cleanName = tagName.toLowerCase().trim();
                    return {
                        where : {name:cleanName},
                        create:{
                            name:cleanName,
                            slug: cleanName.replace(/\s+/g, "-"),
                        }
                    }
                })
                },  
            },
            include : {
                author:{
                    select : {
                        id:true,
                        fullName:true,
                        profile:{select:{avatarUrl:true}}
                }
                },
                category:true,
                tags:true
            }
        })
    }

}