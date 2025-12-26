import * as path from 'path';

// Ensure NODE_CONFIG_DIR points to the config directory
process.env.NODE_CONFIG_DIR = path.resolve(__dirname, '../config');
