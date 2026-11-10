import {Router} from 'express'
import { articleController } from './article.controller.js'
import { requireAuth } from '../../middleware/require-auth.js'
import { validate } from '../../middleware/validate.js'
import { createArticleSchema, publishArticleSchema, updateArticleSchema } from './article.schema.js'


const router = Router()

router.get(
    "/",
    articleController.list
)
router.get(
    "/:slug",
    articleController.getBySlug
)
router.post(
    "/",
    requireAuth,
    validate(createArticleSchema),
    articleController.create
)
router.patch(
    "/:id/publish",
    requireAuth,
    validate(publishArticleSchema),
    articleController.setPublishStatus
)
router.patch(
    "/:id",
    requireAuth,
    validate(updateArticleSchema),
    articleController.update
)

router.delete(
    "/:id",
    requireAuth,
    articleController.remove
)

router.post(
    '/:id/like',
    requireAuth,
    articleController.toggleLike
)

router.post(
    "/:id/bookmark",
    requireAuth,
    articleController.toggleBookmark
)

export default router