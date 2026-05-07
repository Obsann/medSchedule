/**
 * Fast, synchronous email validation.
 * - Validates format via regex
 * - Blocks known disposable/throwaway email domains
 * No network calls — avoids DNS/MX hangs on cloud hosts.
 *
 * Returns { valid: boolean, message: string }
 */

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', 'tempmail.com', 'throwam.com',
  'sharklasers.com', 'guerrillamailblock.com', 'grr.la', 'guerrillamail.info',
  'guerrillamail.biz', 'guerrillamail.de', 'guerrillamail.net', 'guerrillamail.org',
  'spam4.me', 'trashmail.com', 'trashmail.me', 'trashmail.net', 'dispostable.com',
  'yopmail.com', 'yopmail.fr', 'cool.fr.nf', 'jetable.fr.nf', 'nospam.ze.tc',
  'nomail.xl.cx', 'mega.zik.dj', 'speed.1s.fr', 'courriel.fr.nf', 'moncourrier.fr.nf',
  'monemail.fr.nf', 'monmail.fr.nf', 'maildrop.cc', 'mailnull.com', 'spamgourmet.com',
  'tempinbox.com', 'fakeinbox.com', 'mailcatch.com', 'discard.email', 'spamfree24.org',
  'throwaway.email', 'getnada.com', 'mailnesia.com', 'mailnull.com',
]);

const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

function verifyEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, message: 'Email address is required.' };
  }

  const trimmed = email.trim().toLowerCase();

  if (!EMAIL_REGEX.test(trimmed)) {
    return { valid: false, message: 'The email address format is invalid.' };
  }

  const domain = trimmed.split('@')[1];
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return {
      valid: false,
      message: 'Disposable/temporary email addresses are not allowed. Please use a real email.',
    };
  }

  return { valid: true, message: 'Email accepted.' };
}

module.exports = { verifyEmail };
