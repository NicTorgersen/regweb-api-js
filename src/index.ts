// Main exports
export { RegwebApi } from './regweb-api';
export { RegwebApiError } from './http-client';
export { RegwebProxyClient } from './proxy-client';

// Type exports
export type {
    RegwebApiConfig,
    AuthRequest,
    AuthResponse,
    User,
    Member,
    MemberType,
    OptionalSelectValues,
    OptionalSelectValue,
    UpdateResult,
    LostPasswordRequest,
    LostPasswordResponse,
    ApiError,
    HttpMethod,
    RequestOptions,
    ApiResponse,
} from './types';

export type {
    ProxyClientConfig,
    AuthResult,
    Tokens,
    User as ProxyUser,
    Member as ProxyMember,
} from './proxy-client';

// Re-export for convenience
import { RegwebApi } from './regweb-api';

export default RegwebApi;
