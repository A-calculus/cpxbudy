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

export class WalletTool {
    private client: ReturnType<typeof AuthenticatedClient.getInstance>;
    private sessionManager: ReturnType<typeof SessionManager.getInstance>;

    constructor() {
        console.log('\n=== Initializing Wallet Tool ===');
        this.client = AuthenticatedClient.getInstance();
        this.sessionManager = SessionManager.getInstance();
        console.log('Wallet Tool initialized successfully');
    }

    async execute(email: string, action: string, ...args: any[]): Promise<string> {
        try {
            console.log('\n=== Wallet Tool Execution ===');
            console.log('Parameters:', { email, action, args });
            
            console.log('\n=== Checking Session ===');
            const session = this.sessionManager.getSession(email);
            if (!session) {
                console.log('No session found for email:', email);
                throw new Error('No active session found. Please log in first.');
            }
            console.log('Session found:', {
                email: session.user.email,
                firstName: session.user.firstName,
                lastName: session.user.lastName
            });

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
            console.error('\n=== Wallet Tool Error ===');
            console.error('Error:', error);
            console.error('Error Response:', error.response?.data);
            console.error('Error Status:', error.response?.status);
            console.error('Stack Trace:', error.stack);
            
            const errorMessage = error.response?.data?.message || error.message || 'Failed to execute wallet operation';
            const errorDetails = error.response?.data?.details || '';
            const errorCode = error.response?.status || 'Unknown';
            
            throw new Error(`Failed to execute wallet operation (${errorCode}): ${errorMessage}${errorDetails ? `\nDetails: ${errorDetails}` : ''}`);
        }
    }

    private async listWallets(email: string): Promise<string> {
        console.log('\n=== Listing Wallets ===');
        const response = await this.client.getClient(email).get<WalletResponse>('/api/wallets');
        console.log('Wallets Response:', JSON.stringify(response.data, null, 2));

        const wallets = response.data.data;
        if (wallets.length === 0) {
            return 'No wallets found. Please add a wallet to get started.';
        }

        const walletList = wallets.map(wallet => 
            `${wallet.isDefault ? '⭐ ' : ''}${wallet.walletType.toUpperCase()} (${wallet.network})
Address: ${wallet.walletAddress}
Created: ${new Date(wallet.createdAt).toLocaleString()}
Default: ${wallet.isDefault ? 'Yes' : 'No'}`
        ).join('\n\n');

        return `Your Wallets:\n\n${walletList}`;
    }

    private async getBalances(email: string): Promise<string> {
        console.log('\n=== Fetching Wallet Balances ===');
        const response = await this.client.getClient(email).get<WalletBalanceResponse>('/api/wallets/balances');
        console.log('Balances Response:', JSON.stringify(response.data, null, 2));

        const walletBalances = response.data.data;
        if (walletBalances.length === 0) {
            return 'No wallet balances found.';
        }

        const balanceList = walletBalances.map(wallet => {
            const tokenBalances = wallet.balances.map(balance =>
                `Token: ${balance.symbol}
Balance: ${this.formatBalance(balance.balance, balance.decimals)}
Contract: ${balance.address}`
            ).join('\n\n');

            return `${wallet.network} Wallet${wallet.isDefault ? ' (Default)' : ''}
${tokenBalances}`;
        }).join('\n\n');

        return `Your Wallet Balances:\n\n${balanceList}`;
    }

    private formatBalance(balance: string, decimals: number): string {
        const value = parseFloat(balance);
        const divisor = Math.pow(10, decimals);
        return (value / divisor).toFixed(decimals);
    }

    private async setDefaultWallet(email: string, walletId: string): Promise<string> {
        console.log('\n=== Setting Default Wallet ===');
        console.log('Wallet ID:', walletId);
        
        const response = await this.client.getClient(email).post<Wallet>('/api/wallets/default', { walletId });
        console.log('Default Wallet Response:', JSON.stringify(response.data, null, 2));

        const wallet = response.data;
        return `Successfully set as default wallet:
Type: ${wallet.walletType.toUpperCase()}
Network: ${wallet.network}
Address: ${wallet.walletAddress}
Updated: ${new Date(wallet.updatedAt).toLocaleString()}`;
    }

    private async getDepositInfo(email: string, walletId: string): Promise<string> {
        console.log('\n=== Getting Deposit Information ===');
        console.log('Wallet ID:', walletId);
        
        const response = await this.client.getClient(email).get<DepositInfo>(`/api/wallets/${walletId}/deposit`);
        console.log('Deposit Info Response:', JSON.stringify(response.data, null, 2));

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
        console.log('\n=== Fetching Transaction History ===');
        
        const response = await this.client.getClient(email).get<TransferResponse>('/api/transfers');
        console.log('Transaction History Response:', JSON.stringify(response.data, null, 2));

        const transfers = response.data.data;
        if (transfers.length === 0) {
            return 'No transactions found.';
        }

        const formatDate = (date: string) => new Date(date).toLocaleString();
        const formatAmount = (amount: string) => parseFloat(amount).toFixed(2);
        const maskAccount = (account: Account) => {
            if (account.type === 'web3_wallet') {
                return `${account.walletAddress} (${account.network})`;
            }
            return account.bankAccountNumber ? 
                `${account.bankName || ''} ****${account.bankAccountNumber.slice(-4)}` : 
                account.payeeDisplayName || 'Unknown Account';
        };

        const transactionList = transfers.map(transfer => {
            const mainTransaction = transfer.transactions[0]; // Get the first transaction for main details
            return `[${formatDate(transfer.createdAt)}] ${transfer.type.toUpperCase()} - ${transfer.status.toUpperCase()}
Amount: ${formatAmount(transfer.amount)} ${transfer.currency}
Subtotal: ${formatAmount(transfer.amountSubtotal)} ${transfer.currency}
Fee: ${formatAmount(transfer.totalFee)} ${transfer.feeCurrency} (${transfer.feePercentage}%)
From: ${maskAccount(transfer.sourceAccount)}
To: ${maskAccount(transfer.destinationAccount)}
Mode: ${transfer.mode}
Purpose: ${transfer.purposeCode}
${transfer.note ? `Note: ${transfer.note}` : ''}
${mainTransaction?.transactionHash ? `Hash: ${mainTransaction.transactionHash}` : ''}
Status: ${transfer.status.toUpperCase()}${mainTransaction?.externalStatus ? ` (${mainTransaction.externalStatus})` : ''}
ID: ${transfer.id}`;
        }).join('\n\n');

        return `Transaction History:\n\n${transactionList}\n\nPage ${response.data.page} of ${Math.ceil(response.data.count / response.data.limit)}
${response.data.hasMore ? 'More transactions available.' : 'End of transaction history.'}

Note: For security, bank account numbers are partially masked.`;
    }
} 