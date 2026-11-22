import { Router } from 'express';
import { verifyToken, isAdmin, isUser } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { wrap } from '../utils/response';
import * as auth from '../controllers/auth';
import * as cat from '../controllers/categories';
import * as prod from '../controllers/products';
import * as ord from '../controllers/orders';

const r = Router();

r.post('/auth/register', wrap(auth.register));
r.post('/auth/login', wrap(auth.login));

r.get('/categories', wrap(cat.listCategories));
r.post('/categories', verifyToken, isAdmin, wrap(cat.createCategory));
r.put('/categories/:id', verifyToken, isAdmin, wrap(cat.updateCategory));
r.delete('/categories/:id', verifyToken, isAdmin, wrap(cat.deleteCategory));

r.get('/products', wrap(prod.listProducts));
r.get('/products/:id', wrap(prod.getProduct));
r.post('/products', verifyToken, isAdmin, upload.single('image'), wrap(prod.createProduct));
r.put('/products/:id', verifyToken, isAdmin, upload.single('image'), wrap(prod.updateProduct));
r.delete('/products/:id', verifyToken, isAdmin, wrap(prod.deleteProduct));

r.post('/orders', verifyToken, isUser, upload.single('payment_proof'), wrap(ord.createOrder as any));
r.get('/orders/my', verifyToken, isUser, wrap(ord.myOrders as any));
r.get('/orders', verifyToken, isAdmin, wrap(ord.listAllOrders as any));
r.put('/orders/:id/status', verifyToken, isAdmin, wrap(ord.updateStatus as any));

export default r;