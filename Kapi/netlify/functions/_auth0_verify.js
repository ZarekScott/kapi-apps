
const jwksClient = require('jwks-rsa');
const jwt = require('jsonwebtoken');

const issuer = process.env.AUTH0_ISSUER || `https://${process.env.AUTH0_DOMAIN}/`;
const audience = process.env.AUTH0_AUDIENCE;

const client = jwksClient({
  jwksUri: `${issuer}.well-known/jwks.json`
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, function(err, key) {
    if (err) return callback(err);
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

exports.verifyAuth0 = (event) => new Promise((resolve, reject) => {
  const auth = event.headers.authorization || event.headers.Authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return reject(Object.assign(new Error('Missing token'), { code: 401 }));

  jwt.verify(token, getKey, { audience, issuer, algorithms: ['RS256'] }, (err, decoded) => {
    if (err) return reject(Object.assign(new Error('Invalid token'), { code: 401 }));
    resolve(decoded);
  });
});
