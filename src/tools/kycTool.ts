import { AuthenticatedClient } from '../services/authenticatedClient';
import { SessionManager } from '../services/sessionManager';
import FormData from 'form-data';

interface KYCDocument {
    id: string;
    createdAt: string;
    updatedAt: string;
    organizationId: string;
    kycDetailId: string;
    documentType: string;
    status: string;
    frontFileName: string;
    backFileName: string;
}

interface KYCVerification {
    id: string;
    createdAt: string;
    updatedAt: string;
    organizationId: string;
    kycDetailId: string;
    kycProviderCode: string;
    externalCustomerId: string;
    externalKycId: string;
    status: string;
    externalStatus: string;
    verifiedAt: string;
}

interface KYCDetail {
    id: string;
    createdAt: string;
    updatedAt: string;
    organizationId: string;
    nationality: string;
    firstName: string;
    lastName: string;
    email: string;
    currentKycVerification: KYCVerification;
    kycDocuments: KYCDocument[];
    uboType: string;
    kycUrl: string;
}

interface KYCResponse {
    id: string;
    createdAt: string;
    updatedAt: string;
    organizationId: string;
    status: string;
    type: string;
    country: string;
    kycProviderCode: string;
    signature?: string;
    kycDetail: KYCDetail;
}

interface KYCPaginatedResponse {
    page: number;
    limit: number;
    count: number;
    hasMore: boolean;
    data: KYCResponse[];
}

interface KYCStatusResponse {
    status: string;
    level: string;
    verificationDate?: string;
    expiryDate?: string;
    documents: string[];
    restrictions: string[];
}

interface KYCUrlResponse {
    url: string;
}

interface KYBDetail {
    taxIdentificationNumber?: string;
    companyName?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    incorporationNumber?: string;
    incorporationDate?: string;
    state?: string;
    natureOfBusinessOther?: string;
    incorporationCountry?: string;
    country?: string;
    companyType?: 'private_limited_company' | 'public_limited_company' | 'other';
    phoneNumber?: string;
    postalCode?: string;
    companyTypeOther?: string;
    website?: string;
    natureOfBusiness?: string;
    companyDescription?: string;
}

interface KYBAdditionalInfo {
    sourceOfFund: 'business_revenue' | 'investment_returns' | 'other';
    sourceOfFundOther?: string;
    purposeOfFund: 'business_transactions' | 'investment' | 'other';
    purposeOfFundOther?: string;
    operatesInProhibitedCountries: boolean;
    sourceOfFundDescription: string;
    expectedMonthlyVolume: number;
}

interface KYCCreateDetail {
    firstName: string;
    lastName: string;
    email: string;
    nationality: string;
    uboType: string;
}

export class KYCTool {
    private client: ReturnType<typeof AuthenticatedClient.getInstance>;
    private sessionManager: ReturnType<typeof SessionManager.getInstance>;

    constructor() {
        this.client = AuthenticatedClient.getInstance();
        this.sessionManager = SessionManager.getInstance();
    }

    async execute(email: string, nationality?: string, country?: string): Promise<string> {
        try {
            const session = this.sessionManager.getSession(email);
            if (!session) {
                throw new Error('No active session found. Please log in first.');
            }

            // First, check if user has existing KYC
            const kycStatusResponse = await this.client.getClient(email).get<KYCStatusResponse>(`/api/kycs/status/${session.user.email}`);
            
            if (kycStatusResponse.data.status === 'approved') {
                return this.formatApprovedKYC(kycStatusResponse.data);
            }

            // If not approved, check for existing KYC application
            const kycsResponse = await this.client.getClient(email).get<KYCPaginatedResponse>('/api/kycs');

            const existingKYC = (kycsResponse.data as KYCPaginatedResponse).data.find((kyc: KYCResponse) => 
                kyc.kycDetail?.email === session.user.email
            );

            if (existingKYC) {

                const kycDetail = existingKYC.kycDetail;
                const currentVerification = kycDetail?.currentKycVerification;
                const documents = kycDetail?.kycDocuments || [];
                
                const formatDate = (date: string) => new Date(date).toLocaleString();
                
                if (existingKYC.status === 'pending') {
                    return `Your KYC application is pending review.
Application ID: ${existingKYC.id}
Submitted On: ${formatDate(existingKYC.createdAt)}
Last Updated: ${formatDate(existingKYC.updatedAt)}
Type: ${existingKYC.type}
Country: ${existingKYC.country}
Provider: ${existingKYC.kycProviderCode}

Verification Status: ${currentVerification?.status || 'Not started'}
External Status: ${currentVerification?.externalStatus || 'N/A'}
${currentVerification?.verifiedAt ? `Verified At: ${formatDate(currentVerification.verifiedAt)}` : ''}

Documents Status:
${documents.map(doc => `- ${doc.documentType}: ${doc.status}`).join('\n')}

Please wait for our team to review your application. This typically takes 1-2 business days.`;
                }

                if (existingKYC.status === 'submitted') {
                    return `Your KYC application has been submitted.
Application ID: ${existingKYC.id}
Submitted On: ${formatDate(existingKYC.createdAt)}
Last Updated: ${formatDate(existingKYC.updatedAt)}
Type: ${existingKYC.type}
Country: ${existingKYC.country}
Provider: ${existingKYC.kycProviderCode}

Verification Status: ${currentVerification?.status || 'Not started'}
External Status: ${currentVerification?.externalStatus || 'N/A'}
${currentVerification?.verifiedAt ? `Verified At: ${formatDate(currentVerification.verifiedAt)}` : ''}

Documents Status:
${documents.map(doc => `- ${doc.documentType}: ${doc.status}`).join('\n')}

Please wait for our team to review your application. This typically takes 1-2 business days.`;
                }

                if (existingKYC.status === 'initiated') {
                    
                    return `Your KYC application is in progress.
Application ID: ${existingKYC.id}
Initiated On: ${formatDate(existingKYC.createdAt)}
Type: ${existingKYC.type}
Country: ${existingKYC.country}
Provider: ${existingKYC.kycProviderCode}

Please complete your KYC verification by clicking the link below:
${existingKYC.kycDetail.kycUrl}

Note: This link will expire in 24 hours.`;
                }

                if (existingKYC.status === 'rejected') {
                    return `Your KYC application was rejected.
Application ID: ${existingKYC.id}
Submitted On: ${formatDate(existingKYC.createdAt)}
Last Updated: ${formatDate(existingKYC.updatedAt)}
Type: ${existingKYC.type}
Country: ${existingKYC.country}
Provider: ${existingKYC.kycProviderCode}

Verification Status: ${currentVerification?.status || 'Not started'}
External Status: ${currentVerification?.externalStatus || 'N/A'}
${currentVerification?.verifiedAt ? `Verified At: ${formatDate(currentVerification.verifiedAt)}` : ''}

Please contact support for more information about why your application was rejected.`;
                }
            } else {
            }

            // Check if nationality and country are provided
            if (!nationality || !country) {
                return `Please provide your nationality and country of residence to proceed with KYC verification.
Format: /kyc <nationality> <country>
Example: /kyc US US`;
            }

            // Create new KYC application
            const kycDetail: KYCCreateDetail = {
                firstName: session.user.firstName,
                lastName: session.user.lastName,
                email: session.user.email,
                nationality: nationality.toUpperCase(),
                uboType: 'owner'
            };

            const createKYCResponse = await this.client.getClient(email).post<KYCResponse>('/api/kycs', {
                type: 'individual',
                country: country.toUpperCase(),
                kycDetail
            });

            const newKYC = createKYCResponse.data;
            
            // Use the KYC URL directly from the response
            return `New KYC application created successfully!
Application ID: ${newKYC.id}

Please complete your KYC verification by clicking the link below:
${newKYC.kycDetail.kycUrl}

Note: This link will expire in 24 hours.`;
        } catch (error: any) {
            
            const errorMessage = error.response?.data?.message || error.message || 'Failed to process KYC';
            const errorDetails = error.response?.data?.details || '';
            const errorCode = error.response?.status || 'Unknown';
            
            throw new Error(`Failed to process KYC (${errorCode}): ${errorMessage}${errorDetails ? `\nDetails: ${errorDetails}` : ''}`);
        }
    }

    async uploadKYBDocument(email: string, kycId: string, file: Buffer, fileName: string): Promise<string> {
        try {

            const formData = new FormData();
            formData.append('file', file, {
                filename: fileName,
                contentType: 'application/octet-stream'
            });

            const response = await this.client.getClient(email).post(`/api/kycs/kyb-detail/${kycId}/document`, formData, {
                headers: {
                    ...formData.getHeaders()
                }
            });

            return `Document uploaded successfully for KYC ID: ${kycId}`;
        } catch (error: any) {
            
            throw new Error(`Failed to upload document: ${error.message}`);
        }
    }

    async submitKYBAdditionalInfo(email: string, kycId: string, info: KYBAdditionalInfo): Promise<string> {
        try {

            const response = await this.client.getClient(email).post(`/api/kycs/kyb-detail/${kycId}/additional-info`, info);

            return `Additional KYB information submitted successfully for KYC ID: ${kycId}`;
        } catch (error: any) {
            
            throw new Error(`Failed to submit additional KYB info: ${error.message}`);
        }
    }

    async submitKYBForReview(email: string, kycId: string): Promise<string> {
        try {
            const response = await this.client.getClient(email).post(`/api/kycs/kyb-detail/${kycId}/submit`);

            return `KYB submitted for review successfully for KYC ID: ${kycId}`;
        } catch (error: any) {
            
            throw new Error(`Failed to submit KYB for review: ${error.message}`);
        }
    }

    async reopenKYB(email: string, kycId: string): Promise<string> {
        try {

            const response = await this.client.getClient(email).post(`/api/kycs/${kycId}/reopen-kyb`);

            return `KYB reopened successfully for KYC ID: ${kycId}`;
        } catch (error: any) {
            
            throw new Error(`Failed to reopen KYB: ${error.message}`);
        }
    }

    private formatApprovedKYC(kycStatus: KYCStatusResponse): string {
        
        const response = `KYC Status Information:
Status: ${kycStatus.status.toUpperCase()}
Verification Level: ${kycStatus.level}
Verified On: ${new Date(kycStatus.verificationDate!).toLocaleDateString()}
Expires On: ${new Date(kycStatus.expiryDate!).toLocaleDateString()}
Documents Verified: ${kycStatus.documents.join(', ')}

Your account is fully verified and has no trading restrictions.`;

        return response;
    }
} 