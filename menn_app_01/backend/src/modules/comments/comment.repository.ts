import { prisma } from "../../lib/prisma.js"
import { CreateCommentInput } from "./comment.schema.js"



export const commentRepository = {
    // Check if parent comment exists (for nested replies)
    async findCommentById(commentId:string){
        return prisma.comment.findUnique({
            where : {
                id: commentId
            }
        })
    },
    // Create comment in database
    async create(userId:string,articleId:string,input:CreateCommentInput){
        const {content,parentId} = input;

        return prisma.comment.create({
            data: {
                content,
                userId,
                articleId,
                parentId:parentId || null,
            },
            include : {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        profile:{select:{
                            avatarUrl: true
                        }}
                    }
                }
            }
        })
    },

    // Find Comment By Article ID

    async findManyByArticleId(articleId:string,page:number=1,limit:number=20){
        const skip = (page -1) * limit;

        const [comments,total] = await Promise.all([
            prisma.comment.findMany({
                where : {
                    articleId,
                    parentId:null,
                },
                orderBy: {
                    createdAt: "desc",
                },
                skip,
                take:limit,
                include: {
                    user: {
                        select: {
                            id: true,
                            fullName:true,
                            profile: {
                                select: {
                                    avatarUrl: true,
                                }
                            }
                        }
                    },
                    replies: {
                        orderBy: {
                            createdAt: "asc",
                        },
                        include:{
                            user: {
                                select: {
                                    id: true,
                                    fullName: true,
                                    profile: {
                                        select: {
                                            avatarUrl:true,
                                        }
                                    }
                                }
                            }
                        }
                    },
                }
            }),
            prisma.comment.count({
                where: {
                    articleId,
                    parent:null
                }
            })
        ]);

        return {
            comments,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        }
    }
}