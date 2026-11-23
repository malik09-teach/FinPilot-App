import { toolRegistry } from '../tools/registry.js';
import { TransfersService } from '../../modules/transfers/transfers.service.js';

export class TransactionAgent {
  static readonly name = 'TransactionAgent';
  static readonly role = 'Transaction Agent';

  static async prepareTransferDraft(
    userId: string,
    params: {
      recipientQuery: string; // name or account number
      amount: number;
      note?: string;
    }
  ) {
    // 1. Retrieve beneficiaries to match recipient
    const beneficiaries = await toolRegistry.get_beneficiaries.execute(userId, {});
    const query = params.recipientQuery.toLowerCase().trim();

    let matchedBeneficiary = beneficiaries.find(
      (b: any) =>
        b.name.toLowerCase().includes(query) ||
        (b.nickname && b.nickname.toLowerCase().includes(query)) ||
        b.accountNumber.includes(query)
    );

    let recipientName = params.recipientQuery;
    let recipientAccount = params.recipientQuery;
    let recipientBank = 'FinPilot';

    if (matchedBeneficiary) {
      recipientName = matchedBeneficiary.name;
      recipientAccount = matchedBeneficiary.accountNumber;
      recipientBank = matchedBeneficiary.bankName;
    } else {
      // Default demo fallback if named "Ali"
      if (query.includes('ali')) {
        recipientName = 'Ali Khan';
        recipientAccount = '1004892110';
      }
    }

    // 2. Validate transfer limits and balance
    const validation = await TransfersService.validateTransfer({
      userId,
      recipientName,
      recipientAccount,
      amount: params.amount,
    });

    if (!validation.valid) {
      return {
        agent: this.name,
        success: false,
        error: validation.error,
      };
    }

    // 3. Create draft proposal
    const draft = await toolRegistry.create_transfer_draft.execute(userId, {
      recipientName,
      recipientAccount,
      amount: params.amount,
      note: params.note || `Transfer to ${recipientName}`,
    });

    return {
      agent: this.name,
      success: true,
      draft,
      requiresApproval: true,
      actionType: 'TRANSFER',
      summary: `Prepared transfer draft of PKR ${params.amount.toLocaleString()} to ${recipientName} (${recipientAccount}). Requires your authorization PIN.`,
    };
  }
}
