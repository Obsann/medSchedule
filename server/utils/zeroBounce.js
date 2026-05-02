const ZeroBounceSDK = require('@zerobounce/zero-bounce-sdk');

const zeroBounce = new ZeroBounceSDK();

// Statuses that should be blocked from registering
const BLOCKED_STATUSES = ['invalid', 'spamtrap', 'abuse', 'do_not_mail'];

let initialized = false;

function ensureInit() {
  if (!initialized) {
    const apiKey = process.env.ZEROBOUNCE_API_KEY;
    if (!apiKey) {
      console.warn('[ZeroBounce] ZEROBOUNCE_API_KEY is not set — email verification will be skipped.');
      return false;
    }
    zeroBounce.init(apiKey, ZeroBounceSDK.ApiURL.DEFAULT_API_URL);
    initialized = true;
  }
  return true;
}

/**
 * Verify an email address via ZeroBounce.
 * Returns { valid: boolean, status: string, subStatus: string, message: string }
 *
 * If ZeroBounce is unavailable or unconfigured, it defaults to allowing the email
 * so that registration is not completely blocked by a third-party outage.
 */
async function verifyEmail(email) {
  if (!ensureInit()) {
    // API key missing — skip verification, allow the email through
    return { valid: true, status: 'skipped', subStatus: '', message: 'ZeroBounce not configured — skipping verification.' };
  }

  try {
    const response = await zeroBounce.validateEmail(email, { timeout: 10 });

    const status = (response.status || '').toLowerCase();
    const subStatus = (response.sub_status || '').toLowerCase();

    if (BLOCKED_STATUSES.includes(status)) {
      return {
        valid: false,
        status,
        subStatus,
        message: 'The provided email address is invalid or undeliverable. Please use a valid email.',
      };
    }

    return { valid: true, status, subStatus, message: 'Email accepted.' };
  } catch (error) {
    // If ZeroBounce is down or errors out, fail open — don't block the user
    console.error('[ZeroBounce] Verification error:', error.message || error);
    return { valid: true, status: 'error', subStatus: '', message: 'Verification service unavailable — allowing email.' };
  }
}

module.exports = { verifyEmail };
