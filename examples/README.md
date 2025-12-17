# Regweb API Examples

This directory contains examples demonstrating how to use the Regweb API JavaScript SDK.

## Interactive Demo

**File:** `interactive-demo.mjs`

A comprehensive interactive terminal demo that guides you through testing the API.

### How to run:

```bash
# From the project root
bun run demo

# Or directly
bun examples/interactive-demo.mjs
```

### Features:

- **Interactive prompts** for API configuration and credentials
- **Hidden password input** for security
- **Complete API testing** including:
  - Authentication
  - User data retrieval
  - Member information display
  - Text field updates
  - Optional select values
  - Member type information
  - Password recovery testing

### What you'll need:

- Regweb API base URL (e.g., `https://your-instance.regweb.com`)
- Client ID and Client Secret
- Valid username/email and password

## Basic Usage Example

**File:** `basic-usage.mjs`

A simple example showing basic API operations.

### How to run:

```bash
bun examples/basic-usage.mjs
```

### Features:

- Basic authentication
- User data retrieval
- Member data operations
- Error handling examples

## Session Management Example

**File:** `session-management.ts`

Advanced example demonstrating session persistence and token management.

### Features:

- Token storage and restoration
- Automatic token refresh
- Session persistence across app restarts
- Comprehensive error handling
- Authentication state management

### How to run:

```bash
# Compile and run with TypeScript
bun examples/session-management.ts
```

## Tips for Testing

1. **Start with the interactive demo** - It's the easiest way to test your API connection
2. **Have your credentials ready** - You'll need your API base URL, client credentials, and user login
3. **Test in a safe environment** - Use test accounts when possible
4. **Check error messages** - The examples include comprehensive error handling to help debug issues

## Common Issues

### Connection Errors
- Verify your base URL is correct and accessible
- Check that your client credentials are valid
- Ensure your network allows connections to the API

### Authentication Errors
- Verify username/password are correct
- Check if the user account is active
- Ensure the user has appropriate permissions

### API Errors
- Check the error messages for specific details
- Verify the member ID exists and you have access
- Ensure required fields are provided for updates

## Customization

Feel free to modify these examples for your specific use case:

- Add additional API calls
- Implement different error handling strategies
- Create custom workflows for your application
- Add logging or monitoring features

## Support

If you encounter issues with the examples:

1. Check the main README.md for API documentation
2. Review the error messages carefully
3. Verify your API credentials and permissions
4. Open an issue on the GitHub repository if needed
