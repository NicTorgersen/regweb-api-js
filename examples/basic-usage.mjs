import { RegwebApi } from '../src/index.js';

async function basicExample() {
    // Initialize the API client
    const api = new RegwebApi({
        baseUrl: 'https://<your-instance>.regweb.no', // set this to your instance
        clientId: '<your-client-id>', // set this to your client id
        clientSecret: '<your-client-secret>', // set this to your client secret
    });

    try {
    // Authenticate
        console.log('Logging in...');
        await api.login('<username>', '<password>'); // set this to your username and password
        console.log('✅ Logged in successfully!');

        // Response from refresh token
        const refreshResponse = await api.refreshToken();
        console.log('Refresh token response:', refreshResponse);

        // Get current user
        console.log('\nFetching user data...');
        const user = await api.getUser();
        console.log('👤 Current user:', user.firstname, user.lastname);
        console.log('📧 Email:', user.email);
        console.log('👥 Is member:', user.is_member);

        if (user.is_member && user.member) {
            console.log('\n📋 Member details:');
            console.log('  ID:', user.member.id);
            console.log('  Address:', user.member.address1);
            console.log('  Phone:', user.member.phone1);
            console.log('  Mobile:', user.member.mobile);
        }

        // Get member data directly (if you know the ID)
        if (user.is_member && user.member) {
            console.log('\nFetching member data directly...');
            const member = await api.getMember(user.member.id);
            console.log('👥 Member data:', member.firstname, member.lastname);
        }

        // Update member data (uncomment if you want to try)
        // if (user.is_member && user.member) {
        //     console.log('\nUpdating member data...');
        //     const updateResult = await api.updateMember(user.member.id, {
        //         optional_textfield1: 'Updated via API at ' + new Date().toISOString(),
        //     });
        //
        //     if (updateResult.success) {
        //         console.log('✅ Member updated successfully!');
        //     } else {
        //         console.log('❌ Update failed:', updateResult.errors);
        //     }
        // }

        // Get optional select values
        console.log('\nFetching optional select values...');
        try {
            const selectValues = await api.getOptionalSelectValues(1);
            console.log('📋 Optional select field 1:', selectValues.label);
            console.log('   Options:', selectValues.values.map(v => `${v.id}: ${v.label}`).join(', '));
        } catch {
            console.log('ℹ️  Optional select field 1 not configured');
        }

        // Get member type
        if (user.is_member && user.member && user.member.membertype) {
            console.log('\nFetching member type...');
            const memberType = await api.getMemberType(user.member.membertype.id);
            console.log('🏷️  Member type:', memberType.name);
            console.log('💰 Contingent:', memberType.contingent);
        }

        console.log('\n✅ All operations completed successfully!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.data) {
            console.error('   Error code:', error.data.error);
            console.error('   Description:', error.data.error_description);
        }
    } finally {
    // Clean up
        api.logout();
        console.log('\n👋 Logged out');
    }
}

// Run the example
basicExample().catch(console.error);
