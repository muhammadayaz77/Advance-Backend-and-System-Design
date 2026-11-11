import {Router} from 'express'
import { requireAuth } from '../../middleware/require-auth.js';
import { createCommentSchema } from './comment.schema.js';
import { validate } from '../../middleware/validate.js';
import { commentController } from './comment.controller.js';

const router = Router();



router.post(
    "/:articleId/articles",
    requireAuth,
    validate(createCommentSchema),
    commentController.create
)

router.get(
    "/:articleId/articles",
    requireAuth,
    commentController.getComments
)

export default router;