import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthService } from './auth.service.js';
import { AuthRequest } from '../../middleware/auth.js';

const loginSchema = z.object({
  phone: z.string().min(10, 'Valid phone number required'),
  pin: z.string().length(4, 'PIN must be exactly 4 digits'),
});

const verifyPinSchema = z.object({
  pin: z.string().length(4, 'PIN must be exactly 4 digits'),
});

const otpRequestSchema = z.object({
  phone: z.string().min(10, 'Valid phone number required'),
});

const otpResetSchema = z.object({
  phone: z.string().min(10, 'Valid phone number required'),
  code: z.string().length(6, 'OTP must be 6 digits'),
  newPin: z.string().length(4, 'New PIN must be 4 digits'),
});

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const data = loginSchema.parse(req.body);
      const result = await AuthService.loginWithPin(data.phone, data.pin);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async verifyPin(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = verifyPinSchema.parse(req.body);
      const isValid = await AuthService.verifyPin(req.user!.userId, data.pin);
      res.json({ success: true, isValid });
    } catch (err) {
      next(err);
    }
  }

  static async requestOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const data = otpRequestSchema.parse(req.body);
      const result = await AuthService.requestOtp(data.phone);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async resetPinWithOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const data = otpResetSchema.parse(req.body);
      const result = await AuthService.verifyOtpAndResetPin(data.phone, data.code, data.newPin);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async getMe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await AuthService.getProfile(req.user!.userId);
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  }
}
