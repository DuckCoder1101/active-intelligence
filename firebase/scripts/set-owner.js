const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const path = require('path');

const UID = process.argv[2];

if (!UID) {
  console.error('Usage: node scripts/set-admin.js <UID>');
  process.exit(1);
}

const serviceAccount = require(path.resolve(__dirname, 'serviceAccount.json'));

initializeApp({ credential: cert(serviceAccount) });

const auth = getAuth();

auth
  .setCustomUserClaims(UID, {
    accessLevel: 'owner',
    complete: false,
    permissions: [],
  })
  .then(() => {
    console.log(`✓ Admin claims set for user ${UID}`);
    console.log('  Re-login or refresh the token to apply the new claims.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error:', err.message);
    process.exit(1);
  });
