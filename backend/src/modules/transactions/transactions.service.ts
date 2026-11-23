import { prisma } from '../../config/prisma.js';

export class TransactionsService {
  static async getTransactions(
    userId: string,
    filters?: {
      category?: string;
      type?: string;
      search?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
    }
  ) {
    const where: Record<string, unknown> = { userId };

    if (filters?.category && filters.category !== 'ALL') {
      where.category = filters.category;
    }

    if (filters?.type && filters.type !== 'ALL') {
      where.type = filters.type;
    }

    if (filters?.search) {
      where.OR = [
        { description: { contains: filters.search } },
        { counterpartyName: { contains: filters.search } },
        { reference: { contains: filters.search } },
      ];
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        (where.createdAt as Record<string, Date>).gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        (where.createdAt as Record<string, Date>).lte = new Date(filters.endDate);
      }
    }

    const take = filters?.limit || 20;
    const skip = filters?.offset || 0;

    const [items, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
        include: {
          ledgerEntries: true,
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    return { items, total };
  }

  static async getRecent(userId: string, limit = 5) {
    return prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  static async getTransactionById(userId: string, transactionId: string) {
    const tx = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        ledgerEntries: {
          include: { account: true },
        },
      },
    });

    if (!tx || tx.userId !== userId) {
      throw new Error('Transaction not found');
    }

    return tx;
  }

  static async getAnalytics(userId: string) {
    const transactions = await prisma.transaction.findMany({
      where: { userId },
    });

    let totalIncome = 0;
    let totalExpense = 0;
    const categoryBreakdown: Record<string, number> = {};

    transactions.forEach((tx) => {
      if (tx.type === 'CREDIT') {
        totalIncome += tx.amount;
      } else {
        totalExpense += tx.amount;
        categoryBreakdown[tx.category] = (categoryBreakdown[tx.category] || 0) + tx.amount;
      }
    });

    const categories = Object.entries(categoryBreakdown).map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
    }));

    return {
      totalIncome,
      totalExpense,
      netSavings: totalIncome - totalExpense,
      savingsRate: totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0,
      categories,
    };
  }
}
