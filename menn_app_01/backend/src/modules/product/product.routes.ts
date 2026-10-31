import {Router} from 'express'
import { productController } from './product.controller.js'


const router = Router()


router.post('/',productController.create)
router.get('/',productController.findAll)


export default router