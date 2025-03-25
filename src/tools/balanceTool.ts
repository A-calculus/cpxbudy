import { AuthenticatedClient } from '../services/authenticatedClient';
import { SessionManager } from '../services/sessionManager';

interface TokenBalance {
    decimals: number;
    balance: string;
    symbol: string;
    address: string;
}

interface WalletBalance {
    walletId: string;
    isDefault: boolean;
    network: string;
    balances: TokenBalance[];
}

interface BalanceResponse {
    data: WalletBalance[];
}

interface AccountDetail {
    id: string;
    createdAt: string;
    updatedAt: string;
    type: string;
    country: string;
    network: string;
    accountId: string;
    walletAddress: string;
    bankName?: string;
    bankAddress?: string;
    bankRoutingNumber?: string;
    bankAccountNumber?: string;
    bankDepositMessage?: string;
    wireMessage?: string;
    payeeEmail?: string;
    payeeOrganizationId?: string;
    payeeId?: string;
    payeeDisplayName?: string;
}

interface Transaction {
    id: string;
    createdAt: string;
    updatedAt: string;
    organizationId: string;
    type: string;
    providerCode: string;
    kycId: string;
    transferId: string;
    status: string;
    externalStatus: string;
    fromAccountId: string;
    toAccountId: string;
    fromAmount: string;
    fromCurrency: string;
    toAmount: string;
    toCurrency: string;
    totalFee: string;
    feeCurrency: string;
    transactionHash?: string;
    depositAccount?: AccountDetail;
    externalTransactionId?: string;
    externalCustomerId?: string;
    depositUrl?: string;
    fromAccount?: AccountDetail;
    toAccount?: AccountDetail;
}

interface TransactionPaginatedResponse {
    page: number;
    limit: number;
    count: number;
    hasMore: boolean;
    data: Transaction[];
}

export class BalanceTool {
    private client: ReturnType<typeof AuthenticatedClient.getInstance>;
    private sessionManager: ReturnType<typeof SessionManager.getInstance>;

    constructor() {
        this.client = AuthenticatedClient.getInstance();
        this.sessionManager = SessionManager.getInstance();
    }

    async execute(email: string, type: string = 'balance'): Promise<string> {
        try {
            const session = this.sessionManager.getSession(email);
            if (!session) {
                throw new Error('No active session found. Please log in first.');
            }

            if (type === 'transactionHistory') {
                const response = await this.client.getClient(email).get<TransactionPaginatedResponse>('/api/transactions');
                return JSON.stringify(response.data);
            }

            const response = await this.client.getClient(email).get<BalanceResponse>('/api/wallets/balances');
            return JSON.stringify(response.data);
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch balance';
            const errorDetails = error.response?.data?.details || '';
            const errorCode = error.response?.status || 'Unknown';
            
            throw new Error(`Failed to fetch ${type === 'transactionHistory' ? 'transaction history' : 'balance'} (${errorCode}): ${errorMessage}${errorDetails ? `\nDetails: ${errorDetails}` : ''}`);
        }
    }

    async getTransactionHistory(email: string): Promise<string> {
        try {
            const session = this.sessionManager.getSession(email);
            if (!session) {
                throw new Error('No active session found. Please log in first.');
            }

            const response = await this.client.getClient(email).get<TransactionPaginatedResponse>('/api/transactions');
            const transactions = response.data.data;
            if (transactions.length === 0) {
                return 'No transactions found in your history.';
            }

            const formatDate = (date: string) => new Date(date).toLocaleString();
            const formatAmount = (amount: string) => parseFloat(amount).toFixed(2);
            const formatAccount = (account?: AccountDetail) => {
                if (!account) return 'N/A';
                if (account.type === 'web3_wallet') {
                    return `${account.walletAddress} (${account.network})`;
                }
                return `${account.bankName || ''} ${account.bankAccountNumber ? '****' + account.bankAccountNumber.slice(-4) : ''}`.trim() || 'N/A';
            };

            const transactionList = transactions.map(tx => 
                `[${formatDate(tx.createdAt)}] ${tx.type.toUpperCase()} - ${tx.status.toUpperCase()}
Amount: ${formatAmount(tx.fromAmount)} ${tx.fromCurrency} → ${formatAmount(tx.toAmount)} ${tx.toCurrency}
${tx.totalFee !== '0' ? `Fee: ${formatAmount(tx.totalFee)} ${tx.feeCurrency}` : ''}
From: ${formatAccount(tx.fromAccount)}
To: ${formatAccount(tx.toAccount)}
${tx.depositUrl ? `Deposit URL: ${tx.depositUrl}` : ''}
${tx.transactionHash ? `Transaction Hash: ${tx.transactionHash}` : ''}
Status: ${tx.status.toUpperCase()}${tx.externalStatus ? ` (${tx.externalStatus})` : ''}
ID: ${tx.id}
`).join('\n');

            return `Your transaction history:

${transactionList}
Page ${response.data.page} of ${Math.ceil(response.data.count / response.data.limit)}
${response.data.hasMore ? 'More transactions available.' : 'End of transaction history.'}

Note: For bank accounts, only the last 4 digits are shown for security.`;
        } catch (error: any) {
            
            const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch transaction history';
            const errorDetails = error.response?.data?.details || '';
            const errorCode = error.response?.status || 'Unknown';
            
            throw new Error(`Failed to fetch transaction history (${errorCode}): ${errorMessage}${errorDetails ? `\nDetails: ${errorDetails}` : ''}`);
        }
    }
} 