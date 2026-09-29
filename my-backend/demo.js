// Shared public demo account — its profile is locked and it never sends email alerts
const DEMO_USERNAME = 'testuser';

const isDemo = (username) => username === DEMO_USERNAME;

module.exports = { DEMO_USERNAME, isDemo };
