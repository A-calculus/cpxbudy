import { AuthenticatedClient } from '../services/authenticatedClient';
import { SessionManager } from '../services/sessionManager';

interface Wallet {
    id: string;
    createdAt: string;
    updatedAt: string;
    organizationId: string;
    walletType: string;
    network: string;
    walletAddress: string;
    isDefault: boolean;
}

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

interface Customer {
    id: string;
    createdAt: string;
    updatedAt: string;
    name: string;
    businessName: string;
    email: string;
    country: string;
}

interface Account {
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
    depositAccount?: Account;
    externalTransactionId?: string;
    externalCustomerId?: string;
    depositUrl?: string;
}

interface Transfer {
    id: string;
    createdAt: string;
    updatedAt: string;
    organizationId: string;
    status: string;
    customerId: string;
    customer: Customer;
    type: string;
    sourceCountry: string;
    destinationCountry: string;
    destinationCurrency: string;
    amount: string;
    currency: string;
    amountSubtotal: string;
    totalFee: string;
    feePercentage: string;
    feeCurrency: string;
    invoiceNumber?: string;
    invoiceUrl?: string;
    sourceOfFundsFile?: string;
    note?: string;
    purposeCode: string;
    sourceOfFunds: string;
    recipientRelationship: string;
    sourceAccountId: string;
    destinationAccountId: string;
    paymentUrl?: string;
    mode: string;
    isThirdPartyPayment: boolean;
    transactions: Transaction[];
    destinationAccount: Account;
    sourceAccount: Account;
    senderDisplayName: string;
}

interface WalletResponse {
    data: Wallet[];
}

interface WalletBalanceResponse {
    data: WalletBalance[];
}

interface TransferResponse {
    page: number;
    limit: number;
    count: number;
    hasMore: boolean;
    data: Transfer[];
}

interface DepositInfo {
    network: string;
    address: string;
    qrCode: string;
    minAmount: string;
    maxAmount: string;
    currency: string;
    note?: string;
}

interface WalletListResponse {
    wallets: Array<{
        id: string;
        type: string;
        network: string;
        address: string;
        createdAt: string;
        isDefault: boolean;
    }>;
}

interface BalanceListResponse {
    balances: Array<{
        network: string;
        isDefault: boolean;
        tokens: Array<{
            symbol: string;
            balance: string;
            address: string;
            decimals: number;
        }>;
    }>;
}

interface TransactionListResponse {
    transactions: Array<{
        id: string;
        createdAt: string;
        type: string;
        status: string;
        amount: string;
        currency: string;
        subtotal: string;
        fee: string;
        feeCurrency: string;
        feePercentage: string;
        fromAccount: {
            type: string;
            network?: string;
            address?: string;
            bankName?: string;
            maskedAccountNumber?: string;
            displayName?: string;
        };
        toAccount: {
            type: string;
            network?: string;
            address?: string;
            bankName?: string;
            maskedAccountNumber?: string;
            displayName?: string;
        };
        mode: string;
        purposeCode: string;
        note?: string;
        transactionHash?: string;
        externalStatus?: string;
    }>;
    pagination: {
        page: number;
        totalPages: number;
        hasMore: boolean;
    };
}

export class WalletTool {
    private client: ReturnType<typeof AuthenticatedClient.getInstance>;
    private sessionManager: ReturnType<typeof SessionManager.getInstance>;

    constructor() {
        this.client = AuthenticatedClient.getInstance();
        this.sessionManager = SessionManager.getInstance();
    }

    async execute(email: string, action: string, ...args: any[]): Promise<string> {
        try {
            const session = this.sessionManager.getSession(email);
            if (!session) {
                throw new Error('No active session found. Please log in first.');
            }

            switch (action) {
                case 'list':
                    return await this.listWallets(email);
                case 'balances':
                    return await this.getBalances(email);
                case 'setDefault':
                    return await this.setDefaultWallet(email, args[0]);
                case 'deposit':
                    return await this.getDepositInfo(email, args[0]);
                case 'transactions':
                    return await this.getTransactionHistory(email);
                default:
                    throw new Error(`Unsupported wallet action: ${action}`);
            }
        } catch (error: any) {
            
            const errorMessage = error.response?.data?.message || error.message || 'Failed to execute wallet operation';
            const errorDetails = error.response?.data?.details || '';
            const errorCode = error.response?.status || 'Unknown';
            
            throw new Error(`Failed to execute wallet operation (${errorCode}): ${errorMessage}${errorDetails ? `\nDetails: ${errorDetails}` : ''}`);
        }
    }

    private async listWallets(email: string): Promise<string> {
        const response = await this.client.getClient(email).get<WalletResponse>('/api/wallets');
        return JSON.stringify(response.data);
    }

    private async getBalances(email: string): Promise<string> {
        const response = await this.client.getClient(email).get<WalletBalanceResponse>('/api/wallets/balances');
        return JSON.stringify(response.data);
    }

    private formatBalance(balance: string, decimals: number): string {
        const value = parseFloat(balance);
        const divisor = Math.pow(10, decimals);
        return (value / divisor).toFixed(decimals);
    }

    private async setDefaultWallet(email: string, walletId: string): Promise<string> {
        
        const response = await this.client.getClient(email).post<Wallet>('/api/wallets/default', { walletId });
        const wallet = response.data;
        return `Successfully set as default wallet:
Type: ${wallet.walletType.toUpperCase()}
Network: ${wallet.network}
Address: ${wallet.walletAddress}
Updated: ${new Date(wallet.updatedAt).toLocaleString()}`;
    }

    private async getDepositInfo(email: string, walletId: string): Promise<string> {
        
        const response = await this.client.getClient(email).get<DepositInfo>(`/api/wallets/${walletId}/deposit`);

        const depositInfo = response.data;
        return `Deposit Information for Wallet ${walletId}:
Network: ${depositInfo.network}
Address: ${depositInfo.address}
QR Code: ${depositInfo.qrCode}
Minimum Amount: ${depositInfo.minAmount} ${depositInfo.currency}
Maximum Amount: ${depositInfo.maxAmount} ${depositInfo.currency}
Note: ${depositInfo.note || 'No special instructions'}`;
    }

    private async getTransactionHistory(email: string): Promise<string> {
        const response = await this.client.getClient(email).get<TransferResponse>('/api/transfers');
        return JSON.stringify(response.data);
    }
} 