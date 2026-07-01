const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const path = require('path');

const UID = process.argv[2];

if (!UID) {
  console.error('Usage: node scripts/revoke-session.js <UID>');
  process.exit(1);
}

const serviceAccount = require(path.resolve(__dirname, 'serviceAccount.json'));

initializeApp({ credential: cert(serviceAccount) });

const auth = getAuth();

auth
  .revokeRefreshTokens(UID)
  .then(() => {
    console.log(`✓ Session revoked for user ${UID}`);
    console.log('  The user will be forced to sign in again.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error:', err.message);
    process.exit(1);
  });
