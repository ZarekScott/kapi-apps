
const { verifyAuth0 } = require('./_auth0_verify');

exports.handler = async (event) => {
  try {
    const user = await verifyAuth0(event);
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ email: user.email || user.sub, products: [] })
    };
  } catch (e) {
    return { statusCode: e.code || 401, body: e.message || 'Unauthorized' };
  }
};
