import { prisma } from "../../lib/prisma.js";
import { CreateArticleInput, ListArticlesQuery, UpdateArticleInput } from "./article.schema.js";



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
    }, 

    async delete(id:string){
        await prisma.article.delete({
            where : {
                id
            }
        })
    },

    async findMany(query: ListArticlesQuery){
        const { page, limit, search, tag, category, authorId, sortBy} = query;

        const skip = (page - 1) * limit;

        // 1. Build Dynamic WHERE filter (only show published posts)
        const where: any = {
            status: "published"
        };

        if(authorId){
            where.authorId = authorId;
        }
        if(category){
            where.category = {slug:category};
        }
        if(tag){
            where.tags = {some: { slug: tag.toLowerCase()}
        }
        }

        if(search){
            where.OR = [
                { title: { contains: search, mode: "insensitive"}},
                { content: { contains: search, mode: "insensitive"}}
            ];
        }
        // 2. Build Sorting Criteria 
        const orderBy: any = {};
        if(sortBy === "popular"){
            orderBy.likes = { _count: "desc"}
        }else{
            orderBy.publishedAt = "desc";
        }
        // 3. Execute data uery and total count in parallel

        const [articles,totalCount] = await Promise.all([
            prisma.article.findMany({
                where,
                skip,
                take:limit,
                orderBy,
                include:{
                    author: {
                        select: {
                            id:true,
                            fullName: true,
                            profile:{
                                select: { avatarUrl:true}
                            }
                        },
                    },
                category:true,
                tags: true,
                _count: {
                    select: {
                        likes:true,
                        comments:true
                    }
                }
                }
            }),
            prisma.article.count({where})
        ])
        return {articles,totalCount}

    },

    async findLike(userId:string,articleId:string){
        return prisma.articleLike.findUnique({
            where: {
                userId_articleId: {userId, articleId},
            }
        })
    },

    async addLike(userId:string,articleId:string){
        return prisma.articleLike.create({
            data:{ userId, articleId }
        })
    },

    async removeLike(userId:string,articleId:string){
        return prisma.articleLike.delete({
            where : {
               userId_articleId:{userId,articleId}
            }
        })    
    },

    async countLike(articleId:string){
        return prisma.articleLike.count({
            where: { articleId }
        })
    },


    // Bookmarks

    async findBookmark(userId:string,articleId:string){
        return prisma.bookmark.findUnique({
            where: {
                userId_articleId: { userId, articleId },
            }
        })
    },

    async addBookmark(userId:string,articleId:string){
        return prisma.bookmark.create({
            data: {
                userId,articleId
            }
        })
    },

    async removeBookmark(userId:string,articleId:string){
        return prisma.bookmark.delete({
            where : {
                userId_articleId:{userId,articleId}
            }
        })
    }



}

