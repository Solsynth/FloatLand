export interface StoredTokenPair {
	token: string;
	refreshToken?: string;
	expiresAt?: string;
	refreshExpiresAt?: string;
}

const TOKEN_KEY = 'auth_token';
const TOKEN_PAIR_KEY = 'auth_token_pair';
const TOKEN_EXPIRY_SKEW_MS = 30 * 1000; // 30 seconds

let tokenRefreshInFlight: Promise<StoredTokenPair | null> | null = null;

export function decodeJwtExpiry(token: string): Date | null {
	const parts = token.split('.');
	if (parts.length < 2) return null;
	try {
		if (!parts[1]) return null;
		const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/');
		const payload = JSON.parse(atob(normalized));
		if (payload.exp && typeof payload.exp === 'number') {
			return new Date(payload.exp * 1000);
		}
	} catch {
		return null;
	}
	return null;
}

export function decodeJwtIssuedAt(token: string): Date | null {
	const parts = token.split('.');
	if (parts.length < 2) return null;
	try {
		if (!parts[1]) return null;
		const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/');
		const payload = JSON.parse(atob(normalized));
		if (payload.iat && typeof payload.iat === 'number') {
			return new Date(payload.iat * 1000);
		}
	} catch {
		return null;
	}
	return null;
}

export function isNotExpired(dateStr?: string): boolean {
	if (!dateStr) return false;
	const date = new Date(dateStr);
	return date.getTime() > Date.now() + TOKEN_EXPIRY_SKEW_MS;
}

export function shouldRefreshToken(tokenPair: StoredTokenPair): boolean {
	// If access token is still valid, don't refresh
	if (isNotExpired(tokenPair.expiresAt)) return false;

	// No refresh token available
	if (!tokenPair.refreshToken) return false;

	// Check if refresh token is still valid
	if (!isNotExpired(tokenPair.refreshExpiresAt)) return false;

	return true;
}

export function readTokenPair(): StoredTokenPair | null {
	if (typeof localStorage === 'undefined') return null;

	// Try new format first
	const raw = localStorage.getItem(TOKEN_PAIR_KEY);
	if (raw) {
		try {
			const parsed = JSON.parse(raw);
			if (parsed.token) {
				return {
					token: parsed.token,
					refreshToken: parsed.refresh_token || parsed.refreshToken,
					expiresAt: parsed.expires_at || parsed.expiresAt,
					refreshExpiresAt: parsed.refresh_expires_at || parsed.refreshExpiresAt
				};
			}
		} catch {
			// Fall through to legacy format
		}
	}

	// Legacy format: just the token string
	const legacyToken = localStorage.getItem(TOKEN_KEY);
	if (legacyToken) {
		return {
			token: legacyToken,
			expiresAt: undefined
		};
	}

	return null;
}

export function saveTokenPair(tokenPair: StoredTokenPair): void {
	if (typeof localStorage === 'undefined') return;

	const payload = {
		token: tokenPair.token,
		...(tokenPair.refreshToken && { refresh_token: tokenPair.refreshToken }),
		...(tokenPair.expiresAt && { expires_at: tokenPair.expiresAt }),
		...(tokenPair.refreshExpiresAt && {
			refresh_expires_at: tokenPair.refreshExpiresAt
		})
	};

	localStorage.setItem(TOKEN_PAIR_KEY, JSON.stringify(payload));
	// Also save token separately for backwards compatibility
	localStorage.setItem(TOKEN_KEY, tokenPair.token);
}

export function clearTokenPair(): void {
	if (typeof localStorage === 'undefined') return;
	localStorage.removeItem(TOKEN_PAIR_KEY);
	localStorage.removeItem(TOKEN_KEY);
}

export async function refreshAccessToken(
	apiBaseUrl: string,
	current: StoredTokenPair
): Promise<StoredTokenPair | null> {
	if (!current.refreshToken) return null;
	if (!isNotExpired(current.refreshExpiresAt)) return null;

	// Prevent concurrent refresh requests
	if (tokenRefreshInFlight) {
		return tokenRefreshInFlight;
	}

	tokenRefreshInFlight = (async () => {
		try {
			const response = await fetch(`${apiBaseUrl}/stargate/auth/token`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json'
				},
				body: JSON.stringify({
					grant_type: 'refresh_token',
					refresh_token: current.refreshToken
				})
			});

			if (!response.ok) {
				throw new Error(`Token refresh failed: ${response.status}`);
			}

			const data = await response.json();
			const nextToken = data.token as string | undefined;

			if (!nextToken) {
				return current;
			}

			const now = new Date();
			const expiresIn = data.expires_in as number | undefined;
			const refreshExpiresIn = data.refresh_expires_in as number | undefined;
			const nextRefreshToken = (data.refresh_token as string) || current.refreshToken;

			const refreshed: StoredTokenPair = {
				token: nextToken,
				refreshToken: nextRefreshToken,
				expiresAt: expiresIn
					? new Date(now.getTime() + expiresIn * 1000).toISOString()
					: decodeJwtExpiry(nextToken)?.toISOString(),
				refreshExpiresAt: refreshExpiresIn
					? new Date(now.getTime() + refreshExpiresIn * 1000).toISOString()
					: (nextRefreshToken ? decodeJwtExpiry(nextRefreshToken)?.toISOString() : undefined)
			};

			saveTokenPair(refreshed);
			console.log('[Auth] Access token refreshed successfully');
			return refreshed;
		} catch (err) {
			console.error('[Auth] Token refresh failed:', err);
			return null;
		} finally {
			tokenRefreshInFlight = null;
		}
	})();

	return tokenRefreshInFlight;
}

export async function getValidToken(
	apiBaseUrl: string
): Promise<string | null> {
	const tokenPair = readTokenPair();
	if (!tokenPair) return null;

	if (shouldRefreshToken(tokenPair)) {
		const refreshed = await refreshAccessToken(apiBaseUrl, tokenPair);
		return refreshed?.token ?? null;
	}

	return tokenPair.token;
}

export function setTokenFromResponse(
	token: string,
	refreshToken?: string,
	expiresIn?: number,
	refreshExpiresIn?: number
): void {
	const now = new Date();

	const tokenPair: StoredTokenPair = {
		token,
		refreshToken,
		expiresAt: expiresIn
			? new Date(now.getTime() + expiresIn * 1000).toISOString()
			: decodeJwtExpiry(token)?.toISOString(),
		refreshExpiresAt: refreshExpiresIn
			? new Date(now.getTime() + refreshExpiresIn * 1000).toISOString()
			: (refreshToken ? decodeJwtExpiry(refreshToken)?.toISOString() : undefined)
	};

	saveTokenPair(tokenPair);
}
