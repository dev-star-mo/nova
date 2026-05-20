type ZohoTokenResponse = {
    access_token: string;
    expires_in: number;
    api_domain?: string;
    token_type?: string;
    error?: string;
};

export async function generateZohoAccessToken(): Promise<string> {
    try {
        const response = await fetch(
            "https://accounts.zoho.com/oauth/v2/token",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                    refresh_token: process.env.ZOHO_REFRESH_TOKEN!,
                    client_id: process.env.ZOHO_CLIENT_ID!,
                    client_secret: process.env.ZOHO_CLIENT_SECRET!,
                    grant_type: "refresh_token",
                }),
            }
        );

        const data: ZohoTokenResponse = await response.json();

        if (!response.ok || data.error) {
            console.error("Zoho token error:", data);
            throw new Error(data.error || "Failed to generate Zoho access token");
        }

        return data.access_token;

    } catch (error) {
        console.error("Zoho OAuth Error:", error);
        throw error;
    }
}
