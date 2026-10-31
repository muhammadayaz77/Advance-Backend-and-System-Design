import express from 'express';
import productRoutes from './modules/product/product.routes.js';
import {
    errorHandler,
    notFoundHandler
} from './middleware/error.middleware.js';
import { globalRateLimiter } from './middleware/rate-limit.middleware.js';

const app = express();

app.disable('x-powered-by');
app.use(express.json({limit:'1mb'}));
app.use(globalRateLimiter);

app.get('/health',(_req,res) => {
    res.status(200).json({
        success : true,
        message : "API is running"
    })
})

app.use('/api/v1/products',productRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;