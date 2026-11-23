import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { authenticate } from '../../middleware/auth.js';

export const authRouter = Router();

authRouter.post('/login', AuthController.login);
authRouter.post('/verify-pin', authenticate, AuthController.verifyPin);
authRouter.post('/request-otp', AuthController.requestOtp);
authRouter.post('/reset-pin', AuthController.resetPinWithOtp);
authRouter.get('/me', authenticate, AuthController.getMe);
