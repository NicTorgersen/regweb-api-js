/**
 * Configuration options for the Regweb API client
 */
export interface RegwebApiConfig {
    baseUrl: string;
    clientId: string;
    clientSecret: string;
    timeout?: number;
}

/**
 * OAuth2 authentication request
 */
export interface AuthRequest {
    grant_type: 'password' | 'refresh_token';
    client_id: string;
    client_secret: string;
    username?: string;
    password?: string;
    refresh_token?: string;
}

/**
 * OAuth2 authentication response
 */
export interface AuthResponse {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
    scope: string;
}

/**
 * User object
 */
export interface User {
    username: string;
    firstname: string;
    lastname: string;
    is_member: boolean;
    email: string;
    member?: Member;
}

/**
 * Member object with all optional fields
 */
export interface Member {
    id: number;
    active?: boolean;
    firstname: string;
    lastname: string;
    address1?: string;
    address2?: string;
    postalcode?: string;
    phone1?: string;
    phone2?: string;
    mobile?: string;
    email: string;
    password?: string;

    // Optional text fields
    optional_textfield1?: string;
    optional_textfield2?: string;
    optional_textfield3?: string;
    optional_textfield4?: string;
    optional_textfield5?: string;
    optional_textfield6?: string;

    // Optional select fields
    optional_select1?: number;
    optional_select1_label?: string;
    optional_select2?: number;
    optional_select2_label?: string;
    optional_select3?: number;
    optional_select3_label?: string;
    optional_select4?: number;
    optional_select4_label?: string;

    // Optional date fields
    optional_date1?: string;
    optional_date2?: string;

    // Optional checkbox fields
    optional_checkbox1?: boolean;
    optional_checkbox2?: boolean;
    optional_checkbox3?: boolean;
    optional_checkbox4?: boolean;

    // Member type
    membertype?: MemberType;
}

/**
 * Member type object
 */
export interface MemberType {
  id: number;
  name: string;
  contingent?: number;
}

/**
 * Optional select values container
 */
export interface OptionalSelectValues {
  id: number;
  label: string;
  values: OptionalSelectValue[];
}

/**
 * Individual optional select value
 */
export interface OptionalSelectValue {
  id: number;
  label: string;
}

/**
 * Update result response
 */
export interface UpdateResult {
  success: boolean;
  errors?: Record<string, string[]>;
}

/**
 * Lost password request
 */
export interface LostPasswordRequest {
  identification: string;
}

/**
 * Lost password response
 */
export interface LostPasswordResponse {
  success: boolean;
}

/**
 * API error response
 */
export interface ApiError {
  error: string;
  error_description: string;
  member_active_check_failed?: boolean;
  unique_email_check_failed?: boolean;
}

/**
 * HTTP methods
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

/**
 * Request options
 */
export interface RequestOptions {
  method: HttpMethod;
  url: string;
  params?: Record<string, any>;
  data?: Record<string, any>;
  headers?: Record<string, string>;
}

/**
 * API response wrapper
 */
export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}
