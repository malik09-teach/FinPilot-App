import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/prisma.js';
import { AuditService } from '../audit/audit.service.js';

const JWT_SECRET = process.env.JWT_SECRET || 'finpilot-jwt-super-secret-key-hackathon-2026';

// In-memory OTP storage for simulated OTP flow
const otpStore = new Map<string, { code: string; expiresAt: number }>();

export class AuthService {
  static async loginWithPin(phone: string, pin: string) {
    const user = await prisma.user.findFirst({
      where: { phone },
      include: {
        accounts: { where: { isDefault: true } },
      },
    });

    if (!user) {
      throw new Error('User not found with this mobile number');
    }

    if (user.status !== 'ACTIVE') {
      throw new Error('Account is suspended or locked');
    }

    const isMatch = await bcrypt.compare(pin, user.pinHash);
    if (!isMatch) {
      await AuditService.log({
        userId: user.id,
        actorType: 'USER',
        action: 'FAILED_PIN_ATTEMPT',
        entityType: 'USER',
        entityId: user.id,
        details: { phone },
      });
      throw new Error('Incorrect 4-digit PIN');
    }

    const token = jwt.sign(
      {
        userId: user.id,
        phone: user.phone,
        email: user.email,
        name: user.name,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    await AuditService.log({
      userId: user.id,
      actorType: 'USER',
      action: 'LOGIN_SUCCESS',
      entityType: 'USER',
      entityId: user.id,
      details: { method: 'PIN' },
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        defaultAccount: user.accounts[0] || null,
      },
    };
  }

  static async verifyPin(userId: string, pin: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');
    return bcrypt.compare(pin, user.pinHash);
  }

  static async requestOtp(phone: string) {
    const user = await prisma.user.findFirst({ where: { phone } });
    if (!user) throw new Error('No user registered with this phone number');

    const simulatedCode = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(phone, {
      code: simulatedCode,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 mins
    });

    await AuditService.log({
      userId: user.id,
      actorType: 'USER',
      action: 'OTP_REQUESTED',
      entityType: 'USER',
      entityId: user.id,
      details: { phone },
    });

    return {
      message: 'OTP sent successfully (Simulated)',
      simulatedCode, // returned for seamless hackathon testing & automated flow
    };
  }

  static async verifyOtpAndResetPin(phone: string, code: string, newPin: string) {
    const record = otpStore.get(phone);
    if (!record || record.code !== code || Date.now() > record.expiresAt) {
      throw new Error('Invalid or expired OTP code');
    }

    const user = await prisma.user.findFirst({ where: { phone } });
    if (!user) throw new Error('User not found');

    const hashedPin = await bcrypt.hash(newPin, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { pinHash: hashedPin },
    });

    otpStore.delete(phone);

    await AuditService.log({
      userId: user.id,
      actorType: 'USER',
      action: 'PIN_RESET',
      entityType: 'USER',
      entityId: user.id,
      details: { phone },
    });

    return { message: 'PIN reset successfully' };
  }

  static async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
        accounts: true,
        cards: true,
      },
    });
    if (!user) throw new Error('User not found');
    return user;
  }
}
