import { prisma } from '../../lib/prisma.js';
export const productService = {
    create(data) {
        return prisma.product.create({ data });
    },
    findAll(page = 1, limit = 10) {
        return prisma.product.findMany({
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' }
        });
    }
};
//# sourceMappingURL=product.service.js.map