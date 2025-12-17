import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiResponse, RequestOptions, ApiError } from './types';

/**
 * Custom error class for API errors
 */
export class RegwebApiError extends Error {
    public readonly status: number;
    public readonly statusText: string;
    public readonly data: ApiError;

    constructor(message: string, status: number, statusText: string, data: ApiError) {
        super(message);
        this.name = 'RegwebApiError';
        this.status = status;
        this.statusText = statusText;
        this.data = data;
    }
}

/**
 * HTTP client wrapper for making API requests
 */
export class HttpClient {
    private client: AxiosInstance;

    constructor(baseURL: string, timeout: number = 30000) {
        this.client = axios.create({
            baseURL,
            timeout,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
            },
        });

        // Response interceptor for error handling
        this.client.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response) {
                    const { status, statusText, data } = error.response;
                    throw new RegwebApiError(
                        data?.error_description || statusText || 'API Error',
                        status,
                        statusText,
                        data
                    );
                }
                throw error;
            }
        );
    }

    /**
   * Make an HTTP request
   */
    async request<T = any>(options: RequestOptions): Promise<ApiResponse<T>> {
        const config: AxiosRequestConfig = {
            method: options.method,
            url: options.url,
            headers: options.headers,
        };

        // Handle query parameters
        if (options.params) {
            config.params = options.params;
        }

        // Handle request body
        if (options.data) {
            if (options.method === 'POST') {
                // Convert to URL-encoded format for POST requests
                config.data = new URLSearchParams(options.data).toString();
            } else {
                config.data = options.data;
            }
        }

        try {
            const response: AxiosResponse<T> = await this.client.request(config);
      
            return {
                data: response.data,
                status: response.status,
                statusText: response.statusText,
                headers: response.headers as Record<string, string>,
            };
        } catch (error) {
            if (error instanceof RegwebApiError) {
                throw error;
            }
            throw new Error(`Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
   * Make a GET request
   */
    async get<T = any>(url: string, params?: Record<string, any>, headers?: Record<string, string>): Promise<ApiResponse<T>> {
        return this.request<T>({
            method: 'GET',
            url,
            params,
            headers,
        });
    }

    /**
   * Make a POST request
   */
    async post<T = any>(url: string, data?: Record<string, any>, headers?: Record<string, string>): Promise<ApiResponse<T>> {
        return this.request<T>({
            method: 'POST',
            url,
            data,
            headers,
        });
    }

    /**
   * Set default headers
   */
    setDefaultHeaders(headers: Record<string, string>): void {
        Object.assign(this.client.defaults.headers.common, headers);
    }

    /**
   * Remove default headers
   */
    removeDefaultHeaders(keys: string[]): void {
        keys.forEach(key => {
            delete this.client.defaults.headers.common[key];
        });
    }
}
