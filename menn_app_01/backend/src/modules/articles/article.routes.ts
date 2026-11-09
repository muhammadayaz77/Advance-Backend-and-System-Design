import {Router} from 'express'
import { articleController } from './article.controller.js'
import { requireAuth } from '../../middleware/require-auth.js'
import { validate } from '../../middleware/validate.js'
import { createArticleSchema } from './article.schema.js'


const router = Router()

router.post(
    "/",
    requireAuth,
    validate(createArticleSchema),
    articleController.create
)

export default router