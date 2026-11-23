import { prisma } from '../../config/prisma.js';
import { toolRegistry } from '../tools/registry.js';

export interface FraudRiskScore {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  score: number; // 0 - 100
  flags: string[];
  recommendations: string[];
  suggestedAction?: 'FREEZE_CARD' | 'VERIFY_OTP' | 'NONE';
}

export class FraudDetectionAgent {
  static readonly name = 'FraudDetectionAgent';
  static readonly role = 'Fraud Detection Agent';

  static async inspectTransactions(userId: string): Promise<{
    agent: string;
    riskAssessment: FraudRiskScore;
    flaggedTransactions: any[];
    summary: string;
  }> {
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const flags: string[] = [];
    const flaggedTransactions: any[] = [];
    let score = 5; // Base minimal risk

    // 1. Calculate average debit amount
    const debits = transactions.filter((t) => t.type === 'DEBIT');
    const totalDebit = debits.reduce((sum, t) => sum + t.amount, 0);
    const avgDebit = debits.length > 0 ? totalDebit / debits.length : 10000;

    // 2. Rule: Large transaction anomaly (> 3x average)
    debits.forEach((tx) => {
      if (tx.amount > avgDebit * 3.5 && tx.amount > 50000) {
        flags.push(`Unusual spike: ${tx.description} (PKR ${tx.amount.toLocaleString()}) is 3.5x higher than typical debits.`);
        flaggedTransactions.push(tx);
        score += 25;
      }
    });

    // 3. Rule: Velocity check (multiple transactions within 15 minutes)
    for (let i = 0; i < debits.length - 1; i++) {
      const diffMinutes = Math.abs(debits[i].createdAt.getTime() - debits[i + 1].createdAt.getTime()) / (1000 * 60);
      if (diffMinutes < 15 && debits[i].amount > 5000) {
        flags.push(`Velocity warning: Multiple transactions executed within ${Math.round(diffMinutes)} minutes.`);
        score += 15;
        break;
      }
    }

    // Determine risk level
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (score >= 60) riskLevel = 'HIGH';
    else if (score >= 30) riskLevel = 'MEDIUM';

    const recommendations: string[] = [];
    let suggestedAction: 'FREEZE_CARD' | 'VERIFY_OTP' | 'NONE' = 'NONE';

    if (riskLevel === 'HIGH') {
      recommendations.push('Immediate freeze of physical & virtual cards recommended.');
      recommendations.push('Mandatory OTP step-up verification for outgoing transfers.');
      suggestedAction = 'FREEZE_CARD';
    } else if (riskLevel === 'MEDIUM') {
      recommendations.push('Review recent merchant authorizations.');
      recommendations.push('Keep biometric/PIN authorization active.');
      suggestedAction = 'VERIFY_OTP';
    } else {
      recommendations.push('All recent financial activities match your legitimate spending profile.');
    }

    return {
      agent: this.name,
      riskAssessment: {
        riskLevel,
        score: Math.min(100, score),
        flags,
        recommendations,
        suggestedAction,
      },
      flaggedTransactions,
      summary: riskLevel === 'LOW'
        ? 'Account security score is optimal (95/100). No anomalous behavior detected across your accounts.'
        : `Security warning: Detected ${flags.length} potential risk factor(s). Risk Level: ${riskLevel}.`,
    };
  }
}
