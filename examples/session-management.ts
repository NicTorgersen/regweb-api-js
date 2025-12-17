import { RegwebApi, RegwebApiError } from '../src';

/**
 * Example showing session management and token persistence
 */
async function sessionManagementExample() {
    const api = new RegwebApi({
        baseUrl: 'https://your-regweb-instance.com',
        clientId: 'your-client-id',
        clientSecret: 'your-client-secret',
    });

    try {
    // Login and get tokens
        console.log('🔐 Logging in...');
        const authResponse = await api.login('username', 'password');
        console.log('✅ Login successful!');
        console.log('🎫 Access token expires in:', authResponse.expires_in, 'seconds');

        // Get token info
        const tokenInfo = api.getTokenInfo();
        console.log('📅 Token expires at:', tokenInfo.expiresAt);

        // Store tokens for later use (in a real app, you'd save these securely)
        const storedTokens = {
            accessToken: tokenInfo.accessToken!,
            refreshToken: tokenInfo.refreshToken!,
            expiresAt: tokenInfo.expiresAt!,
        };

        console.log('💾 Tokens stored for later use');

        // Simulate app restart - create new API instance
        console.log('\n🔄 Simulating app restart...');
        const newApi = new RegwebApi({
            baseUrl: 'https://your-regweb-instance.com',
            clientId: 'your-client-id',
            clientSecret: 'your-client-secret',
        });

        // Check if we're logged in (should be false)
        console.log('🔍 Is logged in?', newApi.isLoggedIn());

        // Restore session from stored tokens
        console.log('🔄 Restoring session...');
        newApi.restoreSession(
            storedTokens.accessToken,
            storedTokens.refreshToken,
            storedTokens.expiresAt
        );

        // Check if we're logged in now (should be true if token hasn't expired)
        console.log('🔍 Is logged in after restore?', newApi.isLoggedIn());

        // Try to use the API
        console.log('👤 Fetching user data with restored session...');
        const user = await newApi.getUser();
        console.log('✅ User data retrieved:', user.firstname, user.lastname);

        // Demonstrate automatic token refresh
        console.log('\n🔄 Testing automatic token refresh...');
    
        // Force token refresh by calling refreshToken directly
        const refreshedTokens = await newApi.refreshToken();
        console.log('✅ Token refreshed successfully!');
        console.log('🎫 New token expires in:', refreshedTokens.expires_in, 'seconds');

        // Use API again with refreshed token
        await newApi.getUser();
        console.log('✅ API call successful after token refresh');

    } catch (error) {
        if (error instanceof RegwebApiError) {
            console.error('❌ API Error:', error.message);
            console.error('   Status:', error.status);
            console.error('   Error code:', error.data.error);
      
            // Handle specific authentication errors
            if (error.status === 401) {
                console.log('🔐 Authentication failed - please login again');
            }
        } else {
            console.error('❌ Unexpected error:', error);
        }
    }
}

/**
 * Example showing error handling and recovery
 */
async function errorHandlingExample() {
    const api = new RegwebApi({
        baseUrl: 'https://your-regweb-instance.com',
        clientId: 'your-client-id',
        clientSecret: 'your-client-secret',
    });

    try {
    // Try to use API without authentication
        console.log('🚫 Trying to access API without authentication...');
        await api.getUser();
    } catch (error) {
        console.log('✅ Correctly caught authentication error:', error.message);
    }

    try {
    // Try invalid login
        console.log('🚫 Trying invalid login...');
        await api.login('invalid-user', 'wrong-password');
    } catch (error) {
        if (error instanceof RegwebApiError) {
            console.log('✅ Login failed as expected');
            console.log('   Error:', error.data.error);
            console.log('   Description:', error.data.error_description);
      
            // Check for specific error flags
            if (error.data.member_active_check_failed) {
                console.log('   ⚠️  Member account is not active');
            }
            if (error.data.unique_email_check_failed) {
                console.log('   ⚠️  Email is not unique in the system');
            }
        }
    }

    // Now login correctly
    try {
        console.log('🔐 Logging in with correct credentials...');
        await api.login('correct-username', 'correct-password');
        console.log('✅ Login successful!');

        // Try to access non-existent member
        console.log('🚫 Trying to access non-existent member...');
        await api.getMember(99999);
    } catch (error) {
        if (error instanceof RegwebApiError && error.status === 404) {
            console.log('✅ Correctly caught 404 error for non-existent member');
        }
    }

    try {
    // Try to access member without permission
        console.log('🚫 Trying to access member without permission...');
        await api.getMember(1); // Assuming this member exists but user has no access
    } catch (error) {
        if (error instanceof RegwebApiError && error.status === 403) {
            console.log('✅ Correctly caught 403 error for unauthorized access');
        }
    }
}

// Run examples
console.log('=== Session Management Example ===');
sessionManagementExample()
    .then(() => {
        console.log('\n=== Error Handling Example ===');
        return errorHandlingExample();
    })
    .catch(console.error);
