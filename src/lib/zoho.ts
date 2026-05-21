type ZohoTokenResponse = {
    access_token: string;
    expires_in: number;
    api_domain?: string;
    token_type?: string;
    error?: string;
};

export async function generateZohoAccessToken(): Promise<string> {
    const refreshToken = process.env.ZOHO_REFRESH_TOKEN;
    const clientId = process.env.ZOHO_CLIENT_ID;
    const clientSecret = process.env.ZOHO_CLIENT_SECRET;

    // Log presence and length of variables for diagnostics on Vercel
    console.log("Zoho OAuth Config Check:", {
        hasRefreshToken: !!refreshToken,
        refreshTokenLength: refreshToken?.length ?? 0,
        hasClientId: !!clientId,
        clientIdLength: clientId?.length ?? 0,
        hasClientSecret: !!clientSecret,
        clientSecretLength: clientSecret?.length ?? 0,
    });

    if (!refreshToken || !clientId || !clientSecret) {
        throw new Error("Missing Zoho configuration. Check ZOHO_REFRESH_TOKEN, ZOHO_CLIENT_ID, and ZOHO_CLIENT_SECRET.");
    }

    try {
        const response = await fetch(
            "https://accounts.zoho.com/oauth/v2/token",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                    refresh_token: refreshToken,
                    client_id: clientId,
                    client_secret: clientSecret,
                    redirect_uri: "https://novadrive-alpha.vercel.app/api/auth/callback",
                    grant_type: "refresh_token",
                }),
            }
        );

        const data: ZohoTokenResponse = await response.json();
        console.log("Zoho token response metadata:", {
            api_domain: data.api_domain,
            token_type: data.token_type,
            expires_in: data.expires_in
        });

        if (!response.ok || data.error) {
            console.error("Zoho token error details:", data);
            const errorMsg = data.error === "invalid_scope"
                ? "Invalid OAuth Scope. Ensure the refresh token was generated with 'ZohoSign.templates.ALL' and 'ZohoSign.documents.ALL' scopes."
                : (data.error || `Zoho OAuth failed with status ${response.status}`);
            throw new Error(errorMsg);
        }

        return data.access_token;

    } catch (error) {
        console.error("Zoho OAuth Exception:", error);
        throw error;
    }
}
