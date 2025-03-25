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
        console.log('\n=== Initializing KYC Tool ===');
        this.client = AuthenticatedClient.getInstance();
        this.sessionManager = SessionManager.getInstance();
        console.log('KYC Tool initialized successfully');
    }

    async execute(email: string, nationality?: string, country?: string): Promise<string> {
        try {
            console.log('\n=== KYC Tool Execution Started ===');
            console.log('Parameters:', { email, nationality, country });
            
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

            // First, check if user has existing KYC
            console.log('\n=== Checking KYC Status ===');
            console.log('Requesting KYC status for email:', email);
            const kycStatusResponse = await this.client.getClient(email).get<KYCStatusResponse>(`/api/kycs/status/${session.user.email}`);
            console.log('KYC Status Response:', JSON.stringify(kycStatusResponse.data, null, 2));
            
            if (kycStatusResponse.data.status === 'approved') {
                console.log('User has approved KYC');
                return this.formatApprovedKYC(kycStatusResponse.data);
            }

            // If not approved, check for existing KYC application
            console.log('\n=== Checking Existing KYC Applications ===');
            console.log('Requesting KYC applications');
            const kycsResponse = await this.client.getClient(email).get<KYCPaginatedResponse>('/api/kycs');
            console.log('KYC Applications Response:', JSON.stringify(kycsResponse.data, null, 2));

            const existingKYC = (kycsResponse.data as KYCPaginatedResponse).data.find((kyc: KYCResponse) => 
                kyc.kycDetail?.email === session.user.email
            );

            if (existingKYC) {
                console.log('Found existing KYC application:', {
                    id: existingKYC.id,
                    status: existingKYC.status,
                    type: existingKYC.type
                });

                const kycDetail = existingKYC.kycDetail;
                const currentVerification = kycDetail?.currentKycVerification;
                const documents = kycDetail?.kycDocuments || [];
                
                const formatDate = (date: string) => new Date(date).toLocaleString();
                
                if (existingKYC.status === 'pending') {
                    console.log('Processing pending KYC application');
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
                    console.log('Processing submitted KYC application');
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
                    console.log('Processing initiated KYC application');
                    console.log('Requesting KYC URL for signature:', existingKYC.signature);
                    const kycUrlResponse = await this.client.getClient(email).get<KYCUrlResponse>(`/api/kycs/public/${existingKYC.signature}/kyc-url`);
                    console.log('KYC URL Response:', { url: kycUrlResponse.data.url });
                    
                    return `Your KYC application is in progress.
Application ID: ${existingKYC.id}
Initiated On: ${formatDate(existingKYC.createdAt)}
Type: ${existingKYC.type}
Country: ${existingKYC.country}
Provider: ${existingKYC.kycProviderCode}

Please complete your KYC verification by clicking the link below:
${kycUrlResponse.data.url}

Note: This link will expire in 24 hours.`;
                }

                if (existingKYC.status === 'rejected') {
                    console.log('Processing rejected KYC application');
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
                console.log('No existing KYC application found');
            }

            // Check if nationality and country are provided
            if (!nationality || !country) {
                console.log('Missing required parameters:', { nationality, country });
                return `Please provide your nationality and country of residence to proceed with KYC verification.
Format: /kyc <nationality> <country>
Example: /kyc US US`;
            }

            // Create new KYC application
            console.log('\n=== Creating New KYC Application ===');
            const kycDetail: KYCCreateDetail = {
                firstName: session.user.firstName,
                lastName: session.user.lastName,
                email: session.user.email,
                nationality: nationality.toUpperCase(),
                uboType: 'owner'
            };
            console.log('KYC Detail:', JSON.stringify(kycDetail, null, 2));

            console.log('Creating KYC application with details:', {
                type: 'individual',
                country: country.toUpperCase(),
                kycDetail
            });

            const createKYCResponse = await this.client.getClient(email).post<KYCResponse>('/api/kycs', {
                type: 'individual',
                country: country.toUpperCase(),
                kycDetail
            });
            console.log('Create KYC Response:', JSON.stringify(createKYCResponse.data, null, 2));

            const newKYC = createKYCResponse.data;
            
            // Get KYC URL for completion
            console.log('\n=== Getting KYC URL ===');
            console.log('Requesting KYC URL for signature:', newKYC.signature);
            const kycUrlResponse = await this.client.getClient(email).get<KYCUrlResponse>(`/api/kycs/public/${newKYC.signature}/kyc-url`);
            console.log('KYC URL Response:', { url: kycUrlResponse.data.url });
            
            return `New KYC application created successfully!
Application ID: ${newKYC.id}

Please complete your KYC verification by clicking the link below:
${kycUrlResponse.data.url}

Note: This link will expire in 24 hours.`;
        } catch (error: any) {
            console.error('\n=== KYC Tool Error ===');
            console.error('Error:', error);
            console.error('Error Response:', error.response?.data);
            console.error('Error Status:', error.response?.status);
            console.error('Stack Trace:', error.stack);
            
            const errorMessage = error.response?.data?.message || error.message || 'Failed to process KYC';
            const errorDetails = error.response?.data?.details || '';
            const errorCode = error.response?.status || 'Unknown';
            
            throw new Error(`Failed to process KYC (${errorCode}): ${errorMessage}${errorDetails ? `\nDetails: ${errorDetails}` : ''}`);
        }
    }

    async uploadKYBDocument(email: string, kycId: string, file: Buffer, fileName: string): Promise<string> {
        try {
            console.log('\n=== Uploading KYB Document ===');
            console.log('Parameters:', {
                email,
                kycId,
                fileName,
                fileSize: file.length
            });

            const formData = new FormData();
            formData.append('file', file, {
                filename: fileName,
                contentType: 'application/octet-stream'
            });
            console.log('FormData created with file:', fileName);

            console.log('Uploading document to API');
            const response = await this.client.getClient(email).post(`/api/kycs/kyb-detail/${kycId}/document`, formData, {
                headers: {
                    ...formData.getHeaders()
                }
            });
            console.log('Upload Response:', JSON.stringify(response.data, null, 2));

            return `Document uploaded successfully for KYC ID: ${kycId}`;
        } catch (error: any) {
            console.error('\n=== KYB Document Upload Error ===');
            console.error('Error:', error);
            console.error('Error Response:', error.response?.data);
            console.error('Error Status:', error.response?.status);
            console.error('Stack Trace:', error.stack);
            
            throw new Error(`Failed to upload document: ${error.message}`);
        }
    }

    async submitKYBAdditionalInfo(email: string, kycId: string, info: KYBAdditionalInfo): Promise<string> {
        try {
            console.log('\n=== Submitting KYB Additional Info ===');
            console.log('Parameters:', {
                email,
                kycId,
                info: JSON.stringify(info, null, 2)
            });

            console.log('Submitting additional info to API');
            const response = await this.client.getClient(email).post(`/api/kycs/kyb-detail/${kycId}/additional-info`, info);
            console.log('Submit Response:', JSON.stringify(response.data, null, 2));

            return `Additional KYB information submitted successfully for KYC ID: ${kycId}`;
        } catch (error: any) {
            console.error('\n=== KYB Additional Info Submission Error ===');
            console.error('Error:', error);
            console.error('Error Response:', error.response?.data);
            console.error('Error Status:', error.response?.status);
            console.error('Stack Trace:', error.stack);
            
            throw new Error(`Failed to submit additional KYB info: ${error.message}`);
        }
    }

    async submitKYBForReview(email: string, kycId: string): Promise<string> {
        try {
            console.log('\n=== Submitting KYB for Review ===');
            console.log('Parameters:', { email, kycId });

            console.log('Submitting KYB for review to API');
            const response = await this.client.getClient(email).post(`/api/kycs/kyb-detail/${kycId}/submit`);
            console.log('Submit Response:', JSON.stringify(response.data, null, 2));

            return `KYB submitted for review successfully for KYC ID: ${kycId}`;
        } catch (error: any) {
            console.error('\n=== KYB Review Submission Error ===');
            console.error('Error:', error);
            console.error('Error Response:', error.response?.data);
            console.error('Error Status:', error.response?.status);
            console.error('Stack Trace:', error.stack);
            
            throw new Error(`Failed to submit KYB for review: ${error.message}`);
        }
    }

    async reopenKYB(email: string, kycId: string): Promise<string> {
        try {
            console.log('\n=== Reopening KYB ===');
            console.log('Parameters:', { email, kycId });

            console.log('Reopening KYB via API');
            const response = await this.client.getClient(email).post(`/api/kycs/${kycId}/reopen-kyb`);
            console.log('Reopen Response:', JSON.stringify(response.data, null, 2));

            return `KYB reopened successfully for KYC ID: ${kycId}`;
        } catch (error: any) {
            console.error('\n=== KYB Reopen Error ===');
            console.error('Error:', error);
            console.error('Error Response:', error.response?.data);
            console.error('Error Status:', error.response?.status);
            console.error('Stack Trace:', error.stack);
            
            throw new Error(`Failed to reopen KYB: ${error.message}`);
        }
    }

    private formatApprovedKYC(kycStatus: KYCStatusResponse): string {
        console.log('\n=== Formatting Approved KYC Response ===');
        console.log('KYC Status:', JSON.stringify(kycStatus, null, 2));
        
        const response = `KYC Status Information:
Status: ${kycStatus.status.toUpperCase()}
Verification Level: ${kycStatus.level}
Verified On: ${new Date(kycStatus.verificationDate!).toLocaleDateString()}
Expires On: ${new Date(kycStatus.expiryDate!).toLocaleDateString()}
Documents Verified: ${kycStatus.documents.join(', ')}

Your account is fully verified and has no trading restrictions.`;

        console.log('Formatted Response:', response);
        return response;
    }
} 