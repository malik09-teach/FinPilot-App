import { prisma } from '../../config/prisma.js';

export class AccountsService {
  static async getUserAccounts(userId: string) {
    return prisma.account.findMany({
      where: { userId },
      include: {
        cards: true,
      },
      orderBy: { isDefault: 'desc' },
    });
  }

  static async getDefaultAccount(userId: string) {
    const account = await prisma.account.findFirst({
      where: { userId, isDefault: true },
      include: {
        cards: true,
      },
    });

    if (!account) {
      // Return first available account
      const first = await prisma.account.findFirst({
        where: { userId },
        include: { cards: true },
      });
      if (!first) throw new Error('No accounts found for this user');
      return first;
    }

    return account;
  }

  static async getBalance(userId: string, accountId?: string) {
    const account = accountId
      ? await prisma.account.findUnique({ where: { id: accountId } })
      : await prisma.account.findFirst({ where: { userId, isDefault: true } });

    if (!account) throw new Error('Account not found');
    if (account.userId !== userId) throw new Error('Unauthorized account access');

    return {
      accountId: account.id,
      accountNumber: account.accountNumber,
      iban: account.iban,
      currency: account.currency,
      balance: account.balance,
      availableBalance: account.balance - account.lockedBalance,
      lockedBalance: account.lockedBalance,
      status: account.status,
    };
  }

  static async loadMoney(userId: string, amount: number, sourceName = 'External Bank Transfer') {
    if (amount <= 0) throw new Error('Amount must be greater than zero');

    const account = await this.getDefaultAccount(userId);

    // Atomic transaction updating balance and recording transaction & double-entry ledger
    return prisma.$transaction(async (tx) => {
      const updatedAccount = await tx.account.update({
        where: { id: account.id },
        data: { balance: { increment: amount } },
      });

      const txRecord = await tx.transaction.create({
        data: {
          accountId: account.id,
          userId,
          amount,
          currency: account.currency,
          type: 'CREDIT',
          category: 'SALARY',
          description: `Loaded funds via ${sourceName}`,
          counterpartyName: sourceName,
          reference: `LOAD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          status: 'COMPLETED',
        },
      });

      await tx.ledgerEntry.create({
        data: {
          transactionId: txRecord.id,
          accountId: account.id,
          type: 'CREDIT',
          amount,
          balanceAfter: updatedAccount.balance,
          reference: txRecord.reference,
        },
      });

      return {
        transaction: txRecord,
        newBalance: updatedAccount.balance,
      };
    });
  }
}
