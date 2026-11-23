import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding FinPilot simulated banking data...');

  // Clean old records
  await prisma.auditLog.deleteMany();
  await prisma.agentApproval.deleteMany();
  await prisma.agentAction.deleteMany();
  await prisma.agentMessage.deleteMany();
  await prisma.agentSession.deleteMany();
  await prisma.ledgerEntry.deleteMany();
  await prisma.transfer.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.budgetCategory.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.savingGoal.deleteMany();
  await prisma.recurringTransaction.deleteMany();
  await prisma.card.deleteMany();
  await prisma.beneficiary.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  const hashedPin = await bcrypt.hash('1234', 10);

  // 1. Create Primary User (Syed Temoor Shah)
  const user = await prisma.user.create({
    data: {
      id: 'usr_temoor_01',
      name: 'Syed Temoor Shah',
      email: 'temoor.shah@finpilot.io',
      phone: '03001234567',
      pinHash: hashedPin,
      status: 'ACTIVE',
    },
  });

  // Secondary demo user for transfers
  const userAli = await prisma.user.create({
    data: {
      id: 'usr_ali_02',
      name: 'Ali Khan',
      email: 'ali.khan@finpilot.io',
      phone: '03009876543',
      pinHash: hashedPin,
      status: 'ACTIVE',
    },
  });

  // 2. Create Accounts
  const userAccount = await prisma.account.create({
    data: {
      id: 'acc_temoor_primary',
      userId: user.id,
      accountNumber: '1002345678',
      iban: 'PK36FINP0000001002345678',
      accountType: 'CURRENT',
      currency: 'PKR',
      balance: 145000.0,
      lockedBalance: 0.0,
      isDefault: true,
      status: 'ACTIVE',
    },
  });

  const aliAccount = await prisma.account.create({
    data: {
      id: 'acc_ali_primary',
      userId: userAli.id,
      accountNumber: '1004892110',
      iban: 'PK36FINP0000001004892110',
      accountType: 'CURRENT',
      currency: 'PKR',
      balance: 45000.0,
      lockedBalance: 0.0,
      isDefault: true,
      status: 'ACTIVE',
    },
  });

  // System bank reserve account for double entry simulations
  const systemAccount = await prisma.account.create({
    data: {
      id: 'acc_finpilot_reserve',
      userId: user.id,
      accountNumber: '9999999999',
      iban: 'PK36FINP9999999999999999',
      accountType: 'SAVINGS',
      currency: 'PKR',
      balance: 100000000.0,
      lockedBalance: 0.0,
      isDefault: false,
      status: 'ACTIVE',
    },
  });

  // 3. Create Card
  await prisma.card.create({
    data: {
      userId: user.id,
      accountId: userAccount.id,
      cardNumberMasked: '5412 •••• •••• 8824',
      cardHolderName: 'SYED TEMOOR SHAH',
      cardType: 'PHYSICAL',
      network: 'MASTERCARD',
      isFrozen: false,
      dailyLimit: 200000.0,
      expiryMonth: 10,
      expiryYear: 2029,
    },
  });

  // 4. Create Beneficiaries
  await prisma.beneficiary.createMany({
    data: [
      {
        userId: user.id,
        name: 'Ali Khan',
        accountNumber: '1004892110',
        bankName: 'FinPilot',
        nickname: 'Ali Colleague',
        isFavorite: true,
      },
      {
        userId: user.id,
        name: 'Fatima Zahra',
        accountNumber: '0129384756',
        bankName: 'Habib Bank Limited (HBL)',
        nickname: 'Fatima Sister',
        isFavorite: true,
      },
      {
        userId: user.id,
        name: 'Hamza Ahmed',
        accountNumber: '0987654321',
        bankName: 'Meezan Bank',
        nickname: 'Hamza Friend',
        isFavorite: false,
      },
    ],
  });

  // 5. Create Transactions & Ledger Entries
  // Transaction 1: Exact match to UI reference image: "SYED TEMOOR SHAH", "Rs. 10,000", 6:23 PM
  const txDateRef = new Date();
  txDateRef.setHours(18, 23, 0, 0); // 6:23 PM

  const tx1 = await prisma.transaction.create({
    data: {
      accountId: userAccount.id,
      userId: user.id,
      amount: 10000.0,
      currency: 'PKR',
      type: 'DEBIT',
      category: 'TRANSFER',
      description: 'Transfer to Syed Temoor Shah',
      counterpartyName: 'SYED TEMOOR SHAH',
      counterpartyAccount: '0988776655',
      reference: 'TXN-REF-77291',
      status: 'COMPLETED',
      createdAt: txDateRef,
    },
  });

  await prisma.ledgerEntry.createMany({
    data: [
      {
        transactionId: tx1.id,
        accountId: userAccount.id,
        type: 'DEBIT',
        amount: 10000.0,
        balanceAfter: 145000.0,
        reference: tx1.reference,
        createdAt: txDateRef,
      },
      {
        transactionId: tx1.id,
        accountId: systemAccount.id,
        type: 'CREDIT',
        amount: 10000.0,
        balanceAfter: 100010000.0,
        reference: tx1.reference,
        createdAt: txDateRef,
      },
    ],
  });

  // Additional realistic transactions
  const salaryDate = new Date();
  salaryDate.setDate(salaryDate.getDate() - 5);
  const txSalary = await prisma.transaction.create({
    data: {
      accountId: userAccount.id,
      userId: user.id,
      amount: 250000.0,
      currency: 'PKR',
      type: 'CREDIT',
      category: 'SALARY',
      description: 'Monthly Salary - Tech Innovations Corp',
      counterpartyName: 'Tech Innovations Corp',
      counterpartyAccount: '9900112233',
      reference: 'TXN-SAL-99120',
      status: 'COMPLETED',
      createdAt: salaryDate,
    },
  });

  await prisma.ledgerEntry.createMany({
    data: [
      {
        transactionId: txSalary.id,
        accountId: userAccount.id,
        type: 'CREDIT',
        amount: 250000.0,
        balanceAfter: 155000.0,
        reference: txSalary.reference,
        createdAt: salaryDate,
      },
      {
        transactionId: txSalary.id,
        accountId: systemAccount.id,
        type: 'DEBIT',
        amount: 250000.0,
        balanceAfter: 99760000.0,
        reference: txSalary.reference,
        createdAt: salaryDate,
      },
    ],
  });

  // Grocery
  const txGrocery = await prisma.transaction.create({
    data: {
      accountId: userAccount.id,
      userId: user.id,
      amount: 16500.0,
      currency: 'PKR',
      type: 'DEBIT',
      category: 'FOOD',
      description: 'Imtiaz Super Market Groceries',
      counterpartyName: 'Imtiaz Mega Store',
      reference: 'TXN-POS-44012',
      status: 'COMPLETED',
      createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
    },
  });

  // Fuel
  await prisma.transaction.create({
    data: {
      accountId: userAccount.id,
      userId: user.id,
      amount: 8500.0,
      currency: 'PKR',
      type: 'DEBIT',
      category: 'UTILITIES',
      description: 'Shell Petroleum Station',
      counterpartyName: 'Shell F-7',
      reference: 'TXN-POS-33819',
      status: 'COMPLETED',
      createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000),
    },
  });

  // Electricity Bill
  await prisma.transaction.create({
    data: {
      accountId: userAccount.id,
      userId: user.id,
      amount: 18200.0,
      currency: 'PKR',
      type: 'DEBIT',
      category: 'BILLS',
      description: 'K-Electric Utility Bill Payment',
      counterpartyName: 'K-Electric Limited',
      reference: 'TXN-BIL-10928',
      status: 'COMPLETED',
      createdAt: new Date(Date.now() - 4 * 24 * 3600 * 1000),
    },
  });

  // Netflix Subscription
  await prisma.transaction.create({
    data: {
      accountId: userAccount.id,
      userId: user.id,
      amount: 1500.0,
      currency: 'PKR',
      type: 'DEBIT',
      category: 'ENTERTAINMENT',
      description: 'Netflix Monthly Premium',
      counterpartyName: 'Netflix Inc',
      reference: 'TXN-SUB-00912',
      status: 'COMPLETED',
      createdAt: new Date(Date.now() - 6 * 24 * 3600 * 1000),
    },
  });

  // 6. Recurring Transactions
  await prisma.recurringTransaction.createMany({
    data: [
      {
        userId: user.id,
        accountId: userAccount.id,
        merchantName: 'Netflix',
        expectedAmount: 1500.0,
        frequency: 'MONTHLY',
        nextDate: new Date(Date.now() + 24 * 24 * 3600 * 1000),
        category: 'ENTERTAINMENT',
        status: 'ACTIVE',
      },
      {
        userId: user.id,
        accountId: userAccount.id,
        merchantName: 'Spotify Premium',
        expectedAmount: 650.0,
        frequency: 'MONTHLY',
        nextDate: new Date(Date.now() + 18 * 24 * 3600 * 1000),
        category: 'ENTERTAINMENT',
        status: 'ACTIVE',
      },
      {
        userId: user.id,
        accountId: userAccount.id,
        merchantName: 'Fiber Internet (Nayatel)',
        expectedAmount: 4800.0,
        frequency: 'MONTHLY',
        nextDate: new Date(Date.now() + 12 * 24 * 3600 * 1000),
        category: 'UTILITIES',
        status: 'ACTIVE',
      },
      {
        userId: user.id,
        accountId: userAccount.id,
        merchantName: 'FitPro Gym Membership',
        expectedAmount: 6000.0,
        frequency: 'MONTHLY',
        nextDate: new Date(Date.now() + 15 * 24 * 3600 * 1000),
        category: 'OTHER',
        status: 'ACTIVE',
      },
    ],
  });

  // 7. Budgets
  const currentMonth = new Date().toISOString().slice(0, 7); // e.g. "2026-11"
  const budget = await prisma.budget.create({
    data: {
      userId: user.id,
      month: currentMonth,
      totalLimit: 120000.0,
      totalSpent: 44700.0,
      alertThreshold: 0.8,
    },
  });

  await prisma.budgetCategory.createMany({
    data: [
      {
        budgetId: budget.id,
        category: 'FOOD',
        allocatedAmount: 40000.0,
        spentAmount: 16500.0,
      },
      {
        budgetId: budget.id,
        category: 'UTILITIES',
        allocatedAmount: 25000.0,
        spentAmount: 8500.0,
      },
      {
        budgetId: budget.id,
        category: 'BILLS',
        allocatedAmount: 30000.0,
        spentAmount: 18200.0,
      },
      {
        budgetId: budget.id,
        category: 'ENTERTAINMENT',
        allocatedAmount: 15000.0,
        spentAmount: 1500.0,
      },
      {
        budgetId: budget.id,
        category: 'SHOPPING',
        allocatedAmount: 10000.0,
        spentAmount: 0.0,
      },
    ],
  });

  // 8. Saving Goals
  const futureDate = new Date();
  futureDate.setMonth(futureDate.getMonth() + 4);

  await prisma.savingGoal.createMany({
    data: [
      {
        userId: user.id,
        name: 'Emergency Fund',
        targetAmount: 300000.0,
        currentAmount: 120000.0,
        deadline: futureDate,
        category: 'EMERGENCY',
        status: 'ACTIVE',
      },
      {
        userId: user.id,
        name: 'M2 MacBook Pro Upgrade',
        targetAmount: 180000.0,
        currentAmount: 65000.0,
        deadline: new Date(Date.now() + 90 * 24 * 3600 * 1000),
        category: 'GADGETS',
        status: 'ACTIVE',
      },
    ],
  });

  // 9. Initial Agent Session with welcome message
  const agentSession = await prisma.agentSession.create({
    data: {
      userId: user.id,
      title: 'Financial Health & Wealth Copilot',
      status: 'ACTIVE',
    },
  });

  await prisma.agentMessage.create({
    data: {
      sessionId: agentSession.id,
      role: 'ASSISTANT',
      content: 'Hello Syed! I am FinPilot, your AI financial agent. I have analyzed your spending for this month. You have saved 63% of your budget so far! Would you like me to prepare an optimized savings plan or review your upcoming subscriptions?',
      metadata: JSON.stringify({
        agent: 'FinancialAnalystAgent',
        step: 'COMPLETED',
        suggestions: [
          'Analyze my monthly spending and subscriptions',
          'Create a savings plan for PKR 100,000 in 4 months',
          'Send PKR 5,000 to Ali',
          'Review fraud risk & recent transactions',
        ],
      }),
    },
  });

  // 10. Audit Log
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      actorType: 'SYSTEM',
      action: 'SYSTEM_SEEDED',
      entityType: 'USER',
      entityId: user.id,
      details: JSON.stringify({ note: 'Simulated environment initialized' }),
    },
  });

  // 11. Initial Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: user.id,
        title: 'Transfer Completed',
        message: 'Rs. 10,000 sent to SYED TEMOOR SHAH successfully.',
        type: 'TRANSACTION',
        isRead: false,
      },
      {
        userId: user.id,
        title: 'AI Insight Available',
        message: 'FinPilot identified PKR 4,800 potential monthly savings in utilities.',
        type: 'AI_AGENT',
        isRead: false,
      },
    ],
  });

  console.log('Seeding finished successfully! User PIN is 1234, Phone is 03001234567');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
