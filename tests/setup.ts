// Jest setup file
import 'jest';

// Mock axios for tests
jest.mock('axios', () => ({
    create: jest.fn(() => ({
        request: jest.fn(),
        interceptors: {
            response: {
                use: jest.fn(),
            },
        },
        defaults: {
            headers: {
                common: {},
            },
        },
    })),
}));
