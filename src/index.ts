// Main exports
export { RegwebApi } from './regweb-api';
export { RegwebApiError } from './http-client';

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

// Re-export for convenience
import { RegwebApi } from './regweb-api';
export default RegwebApi;
