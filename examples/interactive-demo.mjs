#!/usr/bin/env bun
import { RegwebApi, RegwebApiError } from '../src/index.ts';
import { createInterface } from 'readline';

// Create readline interface for user input
const rl = createInterface({
    input: process.stdin,
    output: process.stdout
});

// Helper function to prompt for input
function prompt(question) {
    return new Promise((resolve) => {
        rl.question(question, resolve);
    });
}

// Helper function to prompt for password (hidden input)
function promptPassword(question) {
    return new Promise((resolve) => {
        process.stdout.write(question);
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.setEncoding('utf8');
        
        let password = '';
        
        const onData = (char) => {
            switch (char) {
                case '\n':
                case '\r':
                case '\u0004': // Ctrl+D
                    process.stdin.setRawMode(false);
                    process.stdin.pause();
                    process.stdin.removeListener('data', onData);
                    console.log(''); // New line
                    resolve(password);
                    break;
                case '\u0003': // Ctrl+C
                    process.exit(1);
                    break;
                case '\u007f': // Backspace
                    if (password.length > 0) {
                        password = password.slice(0, -1);
                        process.stdout.write('\b \b');
                    }
                    break;
                default:
                    password += char;
                    process.stdout.write('*');
                    break;
            }
        };
        
        process.stdin.on('data', onData);
    });
}

// Main interactive demo function
async function interactiveDemo() {
    console.log('🚀 Regweb API Interactive Demo');
    console.log('================================\n');

    try {
        // Get API configuration
        const baseUrl = await prompt('Enter your Regweb API base URL (e.g., https://your-instance.regweb.no): ');
        const clientId = await prompt('Enter your client ID: ');
        const clientSecret = await prompt('Enter your client secret: ');

        console.log('\n📡 Initializing API client...');
        console.log(`   Base URL: ${baseUrl.trim()}`);
        console.log(`   Client ID: ${clientId.trim()}`);
        console.log(`   Client Secret: ${"".padStart(clientSecret.trim().length, '*')}`);

        // Initialize the API client
        const api = new RegwebApi({
            baseUrl: baseUrl.trim(),
            clientId: clientId.trim(),
            clientSecret: clientSecret.trim(),
        });

        console.log('✅ API client initialized successfully!\n');

        // Get login credentials
        const username = await prompt('Enter your username or email: ');
        const password = await promptPassword('Enter your password: ');

        console.log('\n🔐 Authenticating...');

        // Authenticate
        const authResponse = await api.login(username.trim(), password);
        console.log('✅ Authentication successful!');
        console.log(`🎫 Access token expires in: ${authResponse.expires_in} seconds\n`);

        // Get current user
        console.log('👤 Fetching user information...');
        const user = await api.getUser(true);
        
        console.log('✅ User information retrieved:');
        console.log(`   Name: ${user.firstname} ${user.lastname}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Username: ${user.username}`);
        console.log(`   Is Member: ${user.is_member ? '✅ Yes' : '❌ No'}\n`);

        if (user.is_member && user.member) {
            console.log('👥 Member Details:');
            console.log(`   Member ID: ${user.member.id}`);
            console.log(`   Active: ${user.member.active ? '✅ Yes' : '❌ No'}`);
            
            if (user.member.address1) {
                console.log(`   Address: ${user.member.address1}`);
                if (user.member.address2) {
                    console.log(`            ${user.member.address2}`);
                }
                if (user.member.postalcode) {
                    console.log(`            ${user.member.postalcode}`);
                }
            }
            
            if (user.member.phone1) {
                console.log(`   Phone: ${user.member.phone1}`);
            }
            if (user.member.mobile) {
                console.log(`   Mobile: ${user.member.mobile}`);
            }
            
            if (user.member.membertype) {
                console.log(`   Member Type: ${user.member.membertype.name} (ID: ${user.member.membertype.id})`);
            }

            // Show custom fields if they exist
            const customFields = [];
            for (let i = 1; i <= 6; i++) {
                const field = user.member[`optional_textfield${i}`];
                if (field) {
                    customFields.push(`Text Field ${i}: ${field}`);
                }
            }
            for (let i = 1; i <= 4; i++) {
                const field = user.member[`optional_select${i}_label`];
                if (field) {
                    customFields.push(`Select Field ${i}: ${field}`);
                }
            }
            for (let i = 1; i <= 2; i++) {
                const field = user.member[`optional_date${i}`];
                if (field) {
                    customFields.push(`Date Field ${i}: ${field}`);
                }
            }
            for (let i = 1; i <= 4; i++) {
                const field = user.member[`optional_checkbox${i}`];
                if (field !== undefined) {
                    customFields.push(`Checkbox ${i}: ${field ? '✅' : '❌'}`);
                }
            }

            if (customFields.length > 0) {
                console.log('\n📋 Custom Fields:');
                customFields.forEach(field => console.log(`   ${field}`));
            }

            // Interactive menu
            console.log('\n🔧 What would you like to do?');
            console.log('1. Update a text field');
            console.log('2. View optional select values');
            console.log('3. View member type details');
            console.log('4. Test password recovery');
            console.log('5. Exit');

            const choice = await prompt('\nEnter your choice (1-5): ');

            switch (choice.trim()) {
                case '1':
                    await updateTextField(api, user.member.id);
                    break;
                case '2':
                    await viewSelectValues(api);
                    break;
                case '3':
                    await viewMemberType(api, user.member.membertype?.id);
                    break;
                case '4':
                    await testPasswordRecovery(api);
                    break;
                case '5':
                    console.log('👋 Goodbye!');
                    break;
                default:
                    console.log('❌ Invalid choice');
            }
        }

        // Clean up
        api.logout();
        console.log('\n🔓 Logged out successfully');

    } catch (error) {
        console.error('\n❌ Error occurred:');
        
        if (error instanceof RegwebApiError) {
            console.error(`   Status: ${error.status}`);
            console.error(`   Error: ${error.data.error}`);
            console.error(`   Description: ${error.data.error_description}`);
            
            if (error.data.member_active_check_failed) {
                console.error('   ⚠️  Member account is not active');
            }
            if (error.data.unique_email_check_failed) {
                console.error('   ⚠️  Email is not unique in the system');
            }
        } else {
            console.error(`   ${error.message}`);
        }
    } finally {
        rl.close();
    }
}

// Helper function to update a text field
async function updateTextField(api, memberId) {
    console.log('\n✏️  Update Text Field');
    console.log('Available fields: optional_textfield1 through optional_textfield6');
    
    const fieldNumber = await prompt('Which field number (1-6)? ');
    const fieldName = `optional_textfield${fieldNumber}`;
    const newValue = await prompt(`Enter new value for ${fieldName}: `);

    try {
        const result = await api.updateMember(memberId, {
            [fieldName]: newValue.trim()
        });

        if (result.success) {
            console.log('✅ Field updated successfully!');
        } else {
            console.log('❌ Update failed:', result.errors);
        }
    } catch (error) {
        console.error('❌ Error updating field:', error.message);
    }
}

// Helper function to view optional select values
async function viewSelectValues(api) {
    console.log('\n📋 Optional Select Values');
    
    const fieldId = await prompt('Enter select field ID (1-4): ');
    
    try {
        const selectValues = await api.getOptionalSelectValues(parseInt(fieldId));
        console.log(`✅ Select field: ${selectValues.label}`);
        console.log('   Available options:');
        selectValues.values.forEach(option => {
            console.log(`   ${option.id}: ${option.label}`);
        });
    } catch (error) {
        console.error(`❌ Could not retrieve select values: ${error.message}`);
    }
}

// Helper function to view member type details
async function viewMemberType(api, memberTypeId) {
    if (!memberTypeId) {
        console.log('❌ No member type ID available');
        return;
    }

    console.log('\n🏷️  Member Type Details');
    
    try {
        const memberType = await api.getMemberType(memberTypeId);
        console.log(`✅ Member Type: ${memberType.name}`);
        console.log(`   ID: ${memberType.id}`);
        if (memberType.contingent !== undefined) {
            console.log(`   Contingent: ${memberType.contingent}`);
        }
    } catch (error) {
        console.error(`❌ Could not retrieve member type: ${error.message}`);
    }
}

// Helper function to test password recovery
async function testPasswordRecovery(api) {
    console.log('\n🔓 Password Recovery Test');
    
    const identification = await prompt('Enter email or member ID for password recovery: ');
    
    try {
        const result = await api.lostPassword(identification.trim());
        if (result.success) {
            console.log('✅ Password recovery email sent successfully!');
        } else {
            console.log('❌ Password recovery failed');
        }
    } catch (error) {
        console.error(`❌ Password recovery error: ${error.message}`);
    }
}

// Run the interactive demo
interactiveDemo().catch(console.error);
