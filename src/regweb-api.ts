import { HttpClient } from './http-client';
import { AuthManager } from './auth-manager';
import {
    RegwebApiConfig,
    User,
    Member,
    MemberType,
    OptionalSelectValues,
    UpdateResult,
    LostPasswordRequest,
    LostPasswordResponse,
    AuthResponse,
} from './types';

/**
 * Main Regweb API client
 */
export class RegwebApi {
    private httpClient: HttpClient;
    private authManager: AuthManager;

    constructor(config: RegwebApiConfig) {
        const baseUrl = config.baseUrl.replace(/\/$/, '') + '/api/v1/';
        this.httpClient = new HttpClient(baseUrl, config.timeout);
        this.authManager = new AuthManager(this.httpClient, config.clientId, config.clientSecret);
    }

    /**
   * Authenticate with username and password
   */
    async login(username: string, password: string): Promise<AuthResponse> {
        return this.authManager.login(username, password);
    }

    /**
   * Refresh the access token
   */
    async refreshToken(): Promise<AuthResponse> {
        return this.authManager.refreshAccessToken();
    }

    /**
   * Check if the user is currently logged in
   */
    isLoggedIn(): boolean {
        return this.authManager.isLoggedIn();
    }

    /**
   * Logout and clear all tokens
   */
    logout(): void {
        this.authManager.logout();
    }

    /**
   * Get current user data
   */
    async getUser(expandMember: boolean = true): Promise<User> {
        const accessToken = await this.authManager.getAccessToken();
        const params: Record<string, any> = { access_token: accessToken };
    
        if (expandMember) {
            params.expand = 'member';
        }

        const response = await this.httpClient.get<User>('user', params);
        return response.data;
    }

    /**
   * Get member data by ID
   */
    async getMember(id: number): Promise<Member> {
        const accessToken = await this.authManager.getAccessToken();
        const params = { access_token: accessToken };

        const response = await this.httpClient.get<Member>(`members/${id}`, params);
        return response.data;
    }

    /**
   * Update member data
   */
    async updateMember(id: number, memberData: Partial<Member>): Promise<UpdateResult> {
        const accessToken = await this.authManager.getAccessToken();
    
        const data: Record<string, any> = {
            access_token: accessToken,
            ...memberData,
        };

        // Remove undefined values
        Object.keys(data).forEach(key => {
            if (data[key] === undefined) {
                delete data[key];
            }
        });

        const response = await this.httpClient.post<UpdateResult>(`members/${id}`, data);
        return response.data;
    }

    /**
   * Get optional select values for a field
   */
    async getOptionalSelectValues(id: number): Promise<OptionalSelectValues> {
        const accessToken = await this.authManager.getAccessToken();
        const params = { access_token: accessToken };

        const response = await this.httpClient.get<OptionalSelectValues>(`optionalselectvalues/${id}`, params);
        return response.data;
    }

    /**
   * Get member type data
   */
    async getMemberType(id: number): Promise<MemberType> {
        const accessToken = await this.authManager.getAccessToken();
        const params = { access_token: accessToken };

        const response = await this.httpClient.get<MemberType>(`membertypes/${id}`, params);
        return response.data;
    }

    /**
   * Request password reset
   */
    async lostPassword(identification: string): Promise<LostPasswordResponse> {
        const data: LostPasswordRequest = { identification };
        const response = await this.httpClient.post<LostPasswordResponse>('lostpassword', data);
        return response.data;
    }

    /**
   * Get current authentication token information
   */
    getTokenInfo(): { accessToken: string | null; refreshToken: string | null; expiresAt: Date | null } {
        return this.authManager.getTokenInfo();
    }

    /**
   * Restore authentication session
   */
    restoreSession(accessToken: string, refreshToken: string, expiresAt: Date): void {
        this.authManager.restoreTokens(accessToken, refreshToken, expiresAt);
    }

    /**
   * Create a member update object with only the fields that should be updated
   */
    createMemberUpdate(updates: Partial<Member>): Partial<Member> {
        const allowedFields: (keyof Member)[] = [
            'firstname', 'lastname', 'address1', 'address2', 'postalcode',
            'phone1', 'phone2', 'mobile', 'email', 'password',
            'optional_textfield1', 'optional_textfield2', 'optional_textfield3',
            'optional_textfield4', 'optional_textfield5', 'optional_textfield6',
            'optional_select1', 'optional_select2', 'optional_select3', 'optional_select4',
            'optional_date1', 'optional_date2',
            'optional_checkbox1', 'optional_checkbox2', 'optional_checkbox3', 'optional_checkbox4'
        ];

        const memberUpdate: Partial<Member> = {};
    
        allowedFields.forEach(field => {
            if (updates[field] !== undefined) {
                (memberUpdate as any)[field] = updates[field];
            }
        });

        return memberUpdate;
    }
}
