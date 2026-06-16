// ─── TTL Constants (milliseconds) ────────────────────────────────────────────
export const TTL = {
    posts:     5 * 60 * 1000,   // 5 minutes
    adoptions: 5 * 60 * 1000,   // 5 minutes
    campaigns: 3 * 60 * 1000,   // 3 minutes
    profile:   10 * 60 * 1000,  // 10 minutes
};

/**
 * Returns true if cached data is still within the TTL window.
 * @param {number|null} lastFetched - timestamp (Date.now()) of last fetch
 * @param {number} ttl - TTL duration in milliseconds
 */
export const isCacheValid = (lastFetched, ttl) => {
    if (!lastFetched) return false;
    return (Date.now() - lastFetched) < ttl;
};

/**
 * Returns milliseconds remaining before cache expires.
 * Returns 0 if already expired or never fetched.
 * @param {number|null} lastFetched
 * @param {number} ttl
 */
export const getRemainingTTL = (lastFetched, ttl) => {
    if (!lastFetched) return 0;
    return Math.max(0, ttl - (Date.now() - lastFetched));
};
