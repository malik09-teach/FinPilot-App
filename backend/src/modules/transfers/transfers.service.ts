import { prisma } from '../../config/prisma.js';
import { AuditService } from '../audit/audit.service.js';

export interface ExecuteTransferInput {
  userId: string;
  senderAccountId?: string;
  recipientAccount: string;
  recipientName: string;
  recipientBank?: string;
  amount: number;
  note?: string;
  idempotencyKey?: string;
  approvalId?: string;
}

export class TransfersService {
  static readonly DAILY_LIMIT = 200000.0;
  static readonly SINGLE_TX_LIMIT = 100000.0;

  static async validateTransfer(input: ExecuteTransferInput) {
    if (input.amount <= 0) {
      return { valid: false, error: 'Transfer amount must be greater than zero' };
    }

    if (input.amount > this.SINGLE_TX_LIMIT) {
      return {
        valid: false,
        error: `Transfer amount exceeds single-transaction limit of PKR ${this.SINGLE_TX_LIMIT.toLocaleString()}`,
      };
    }

    // Check sender account
    const account = input.senderAccountId
      ? await prisma.account.findUnique({ where: { id: input.senderAccountId } })
      : await prisma.account.findFirst({ where: { userId: input.userId, isDefault: true } });

    if (!account) {
      return { valid: false, error: 'Sender account not found' };
    }

    if (account.userId !== input.userId) {
      return { valid: false, error: 'Unauthorized account access' };
    }

    if (account.status !== 'ACTIVE') {
      return { valid: false, error: 'Sender account is frozen or inactive' };
    }

    const availableBalance = account.balance - account.lockedBalance;
    if (availableBalance < input.amount) {
      return {
        valid: false,
        error: `Insufficient funds. Available: PKR ${availableBalance.toLocaleString()}, Requested: PKR ${input.amount.toLocaleString()}`,
      };
    }

    // Check daily transfer total
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayTransfers = await prisma.transfer.findMany({
      where: {
        senderUserId: input.userId,
        status: 'COMPLETED',
        createdAt: { gte: today },
      },
    });

    const dailySum = todayTransfers.reduce((sum, t) => sum + t.amount, 0);
    if (dailySum + input.amount > this.DAILY_LIMIT) {
      return {
        valid: false,
        error: `Transfer exceeds daily limit of PKR ${this.DAILY_LIMIT.toLocaleString()}. Used today: PKR ${dailySum.toLocaleString()}`,
      };
    }

    return { valid: true, account };
  }

  static async executeTransfer(input: ExecuteTransferInput) {
    // Check idempotency
    if (input.idempotencyKey) {
      const existing = await prisma.transfer.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
      });
      if (existing) {
        return {
          transfer: existing,
          isDuplicate: true,
          message: 'Transfer already processed with this idempotency key',
        };
      }
    }

    const validation = await this.validateTransfer(input);
    if (!validation.valid || !validation.account) {
      throw new Error(validation.error || 'Validation failed');
    }

    const senderAccount = validation.account;
    const recipientBank = input.recipientBank || 'FinPilot';
    const reference = `TXN-TRF-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    // Check if recipient is within FinPilot
    const recipientAccountRecord = await prisma.account.findUnique({
      where: { accountNumber: input.recipientAccount },
    });

    // Execute atomic double-entry transaction
    const txResult = await prisma.$transaction(
      async (tx) => {
        // 1. Debit sender
        const updatedSender = await tx.account.update({
          where: { id: senderAccount.id },
          data: { balance: { decrement: input.amount } },
        });

        // 2. Create outgoing transfer record
        const transferRecord = await tx.transfer.create({
          data: {
            senderAccountId: senderAccount.id,
            senderUserId: input.userId,
            recipientName: input.recipientName,
            recipientAccount: input.recipientAccount,
            recipientBank,
            amount: input.amount,
            note: input.note,
            status: 'COMPLETED',
            idempotencyKey: input.idempotencyKey,
            approvalId: input.approvalId,
          },
        });

        // 3. Create sender debit transaction
        const senderTx = await tx.transaction.create({
          data: {
            accountId: senderAccount.id,
            userId: input.userId,
            amount: input.amount,
            currency: 'PKR',
            type: 'DEBIT',
            category: 'TRANSFER',
            description: input.note || `Transfer to ${input.recipientName}`,
            counterpartyName: input.recipientName,
            counterpartyAccount: input.recipientAccount,
            reference,
            status: 'COMPLETED',
          },
        });

        // 4. Create Ledger Entry for Debit
        await tx.ledgerEntry.create({
          data: {
            transactionId: senderTx.id,
            accountId: senderAccount.id,
            type: 'DEBIT',
            amount: input.amount,
            balanceAfter: updatedSender.balance,
            reference,
          },
        });

        // 5. If recipient is internal FinPilot account, credit recipient
        if (recipientAccountRecord) {
          const updatedRecipient = await tx.account.update({
            where: { id: recipientAccountRecord.id },
            data: { balance: { increment: input.amount } },
          });

          const recipientTx = await tx.transaction.create({
            data: {
              accountId: recipientAccountRecord.id,
              userId: recipientAccountRecord.userId,
              amount: input.amount,
              currency: 'PKR',
              type: 'CREDIT',
              category: 'TRANSFER',
              description: input.note || `Received from ${input.userId}`,
              counterpartyName: input.recipientName,
              counterpartyAccount: senderAccount.accountNumber,
              reference: `${reference}-CR`,
              status: 'COMPLETED',
            },
          });

          await tx.ledgerEntry.create({
            data: {
              transactionId: recipientTx.id,
              accountId: recipientAccountRecord.id,
              type: 'CREDIT',
              amount: input.amount,
              balanceAfter: updatedRecipient.balance,
              reference: `${reference}-CR`,
            },
          });
        } else {
          // Credit FinPilot settlement clearing account
          const systemAccount = await tx.account.findUnique({
            where: { accountNumber: '9999999999' },
          });
          if (systemAccount) {
            await tx.account.update({
              where: { id: systemAccount.id },
              data: { balance: { increment: input.amount } },
            });

            await tx.ledgerEntry.create({
              data: {
                transactionId: senderTx.id,
                accountId: systemAccount.id,
                type: 'CREDIT',
                amount: input.amount,
                balanceAfter: systemAccount.balance + input.amount,
                reference,
              },
            });
          }
        }

        return {
          transfer: transferRecord,
          transaction: senderTx,
          newBalance: updatedSender.balance,
          reference,
        };
      },
      { timeout: 15000, maxWait: 10000 }
    );

    // Non-blocking side effects after atomic commit
    AuditService.log({
      userId: input.userId,
      actorType: input.approvalId ? 'AI_AGENT' : 'USER',
      action: 'TRANSFER_EXECUTED',
      entityType: 'TRANSFER',
      entityId: txResult.transfer.id,
      details: {
        amount: input.amount,
        recipientName: input.recipientName,
        recipientAccount: input.recipientAccount,
        recipientBank,
        reference,
        idempotencyKey: input.idempotencyKey,
      },
    }).catch(console.error);

    prisma.notification.create({
      data: {
        userId: input.userId,
        title: 'Transfer Successful',
        message: `PKR ${input.amount.toLocaleString()} sent to ${input.recipientName}.`,
        type: 'TRANSACTION',
      },
    }).catch(console.error);

    return txResult;
  }

  static async getTransferHistory(userId: string) {
    return prisma.transfer.findMany({
      where: { senderUserId: userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }
}
