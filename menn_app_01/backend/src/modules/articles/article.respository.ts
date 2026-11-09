import { prisma } from "../../lib/prisma.js";
import { CreateArticleInput, UpdateArticleInput } from "./article.schema.js";



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
    },
    async findBySlug(slug:string){
        return prisma.article.findUnique({
            where : {slug},
            include: {
                author: {
                    select: {
                        id: true,
                        fullName:true,
                        profile:{ select : { avatarUrl:true,bio:true}}
                    }
                },
                category : true,
                tags: true,
                _count:{
                    select: {
                        likes: true,
                        comments: true,
                        bookmarks: true
                    }
                }
            },
        })
    },
    async findById(id:string){
        return await prisma.article.findUnique({
            where : {
                id
            }
        })
    }
    ,
    async updateStatus(
        id:string,
        status:"published" | "draft",
        publishedAt : Date | null
    ){
        return prisma.article.update({
            where: {id},
            data: {
                status,
                publishedAt
            }
        })
    },

    async update(id:string,slug:string | undefined,input:UpdateArticleInput){
        const {title,content,excerpt,coverImage,categoryId,tags} = input;

        return prisma.article.update({
            where: {id},
            data: {
                title,
                content,
                excerpt,
                coverImage,
                categoryId: categoryId === undefined ? undefined : categoryId,
                // update slug only if title changed
                slug: slug ? slug : undefined,
                // if tags are provided, reset and re-link the new ones
                tags: tags
                ? {
                    set: [],
                    connectOrCreate:
                    tags.map((tagName)=> {
                        const cleanName = tagName.toLowerCase().trim();
                        return {
                            where:{name:cleanName},
                            create:{
                                name:cleanName,
                                slug:cleanName.replace(/\s+/g, "-"),
                            },
                        }
                    })
                } : undefined
            },
            include: {
                author: {
                    select: {
                        id: true,
                        fullName:true,
                        profile: {
                            select: {
                            avatarUrl: true
                        }
                    }
                    }
                },
                category:true,
                tags:true
            }
        })
    }

}