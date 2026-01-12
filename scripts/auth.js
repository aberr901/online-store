// MSAL Authentication for Admin Panel
// This handles browser-based Entra ID authentication

class AuthService {
    constructor() {
        this.msalInstance = null;
        this.currentAccount = null;
        this.accessToken = null;
    }

    /**
     * Initialize MSAL
     */
    async initialize() {
        try {
            // Create MSAL instance
            this.msalInstance = new msal.PublicClientApplication(MSAL_CONFIG);
            await this.msalInstance.initialize();

            // Handle redirect response
            const response = await this.msalInstance.handleRedirectPromise();
            if (response) {
                this.currentAccount = response.account;
                console.log('Logged in successfully:', this.currentAccount.username);
            } else {
                // Check if already logged in
                const accounts = this.msalInstance.getAllAccounts();
                if (accounts.length > 0) {
                    this.currentAccount = accounts[0];
                }
            }

            // If not authenticated, try silent sign-in automatically
            if (!this.currentAccount) {
                await this.signInSilent();
            }

            return this.currentAccount !== null;
        } catch (error) {
            console.error('Error initializing auth:', error);
            return false;
        }
    }

    /**
     * Try to sign in silently using existing Azure session
     * This works if user is already logged into Azure in their browser
     */
    async signInSilent() {
        try {
            const response = await this.msalInstance.loginRedirect({
                scopes: ['User.Read'],
                prompt: 'none'  // Don't show login UI if already logged in
            });
            
            this.currentAccount = response?.account;
            return true;
        } catch (error) {
            // Silent login failed - user needs to login
            console.log('Silent login not available, redirect required');
            return false;
        }
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return this.currentAccount !== null;
    }

    /**
     * Get current user info
     */
    getCurrentUser() {
        return this.currentAccount;
    }

    /**
     * Sign in with popup
     */
    async signInPopup() {
        try {
            const response = await this.msalInstance.loginPopup({
                scopes: ['User.Read']
            });
            
            this.currentAccount = response.account;
            console.log('Logged in:', this.currentAccount.username);
            return true;
        } catch (error) {
            console.error('Login failed:', error);
            return false;
        }
    }

    /**
     * Sign in with redirect (automatic, uses existing Azure session if available)
     */
    async signInRedirect() {
        try {
            await this.msalInstance.loginRedirect({
                scopes: ['User.Read'],
                prompt: 'select_account'  // Let user choose if multiple accounts
            });
        } catch (error) {
            console.error('Login redirect failed:', error);
        }
    }

    /**
     * Get access token for Azure Storage
     * This token allows the user to access storage directly
     */
    async getStorageAccessToken() {
        if (!this.currentAccount) {
            throw new Error('Not authenticated');
        }

        try {
            // Try to get token silently (from cache)
            const response = await this.msalInstance.acquireTokenSilent({
                scopes: STORAGE_SCOPE.scopes,
                account: this.currentAccount
            });

            this.accessToken = response.accessToken;
            return this.accessToken;

        } catch (error) {
            if (error instanceof msal.InteractionRequiredAuthError) {
                // Silent token acquisition failed, use redirect
                try {
                    await this.msalInstance.acquireTokenRedirect({
                        scopes: STORAGE_SCOPE.scopes,
                        account: this.currentAccount
                    });
                    // After redirect, token will be available
                    return null;
                } catch (redirectError) {
                    console.error('Token acquisition failed:', redirectError);
                    throw redirectError;
                }
            } else {
                console.error('Token acquisition error:', error);
                throw error;
            }
        }
    }

    /**
     * Sign out
     */
    async signOut() {
        try {
            const logoutRequest = {
                account: this.currentAccount,
                postLogoutRedirectUri: window.location.origin
            };

            await this.msalInstance.logoutRedirect(logoutRequest);
            this.currentAccount = null;
            this.accessToken = null;
        } catch (error) {
            console.error('Logout failed:', error);
        }
    }
}

// Create singleton instance
const authService = new AuthService();
