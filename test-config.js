/**
 * Test configuration module - loads credentials securely
 *
 * Usage:
 *   const { getCredentials } = require('./test-config');
 *   const { username, password } = getCredentials();
 *
 * Credentials can be provided via:
 *   1. Environment variables: PBS_TEST_USER and PBS_TEST_PASSWORD
 *   2. Command line arguments: node script.js <username> <password>
 *   3. Local test-users.json file (not committed to git)
 */

const fs = require('fs');
const path = require('path');

function getCredentials(userIndex = 0) {
    // Priority 1: Environment variables
    if (process.env.PBS_TEST_USER && process.env.PBS_TEST_PASSWORD) {
        return {
            username: process.env.PBS_TEST_USER,
            password: process.env.PBS_TEST_PASSWORD
        };
    }

    // Priority 2: Command line arguments
    const args = process.argv.slice(2);
    if (args.length >= 2 && !args[0].startsWith('-')) {
        return {
            username: args[0],
            password: args[1]
        };
    }

    // Priority 3: Local test-users.json file
    const configPath = path.join(__dirname, 'test-users.json');
    if (fs.existsSync(configPath)) {
        try {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            if (config.testUsers && config.testUsers[userIndex]) {
                return {
                    username: config.testUsers[userIndex].username,
                    password: config.testUsers[userIndex].password
                };
            }
        } catch (e) {
            console.error('Error reading test-users.json:', e.message);
        }
    }

    // No credentials found
    console.error(`
ERROR: No credentials found!

Please provide credentials via one of these methods:

1. Environment variables:
   export PBS_TEST_USER="your_username"
   export PBS_TEST_PASSWORD="your_password"
   node ${path.basename(process.argv[1])}

2. Command line arguments:
   node ${path.basename(process.argv[1])} <username> <password>

3. Create test-users.json from the template:
   cp test-users.json.example test-users.json
   # Edit test-users.json with your credentials
`);
    process.exit(1);
}

module.exports = { getCredentials };
