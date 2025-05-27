import { createPool, createConnection } from 'mysql2/promise';
import dotenv from 'dotenv';
import moment from 'moment';
import { db as firebaseDb } from '../server.js';

dotenv.config();

const remoteConfig = {
  host: process.env.STACKHERO_MYSQL_HOST || 'ukxdor.stackhero-network.com',
  user: process.env.STACKHERO_MYSQL_USER || 'root',
  password: process.env.STACKHERO_MYSQL_root_PASSWORD || 'IJ4v2fbIXl2P3uZvnOhKJjQhNi9gN6JT',
  database: 'healthtrack_db',
  port: parseInt(process.env.STACKHERO_MYSQL_PORT) || 4779,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  connectTimeout: 30000,
  ssl: { rejectUnauthorized: true },
};

let db;

// Function to attempt connection with retry logic
const attemptConnectionWithRetry = async (config, isPrimary = true, retries = 3, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const pool = createPool({ ...config });
      pool.config = config;
      const connection = await pool.getConnection();
      console.log(`${isPrimary ? 'Primary' : 'Secondary'} connection established to ${config.host}:${config.port}`);
      connection.release();
      return pool;
    } catch (error) {
      console.error(`Connection attempt ${i + 1}/${retries} to ${config.host}:${config.port} failed:`, error.message);
      if (error.code === 'ER_CON_COUNT_ERROR') {
        console.log('Too many connections, retrying after delay...');
        await new Promise(resolve => setTimeout(resolve, delay));
      } else if (error.code === 'ENOTFOUND') {
        console.log('DNS resolution failed, retrying after delay...');
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  throw new Error(`Failed to connect to ${config.host}:${config.port} after ${retries} attempts`);
};

// Function to check if a table exists and is reachable
const checkTableExistsAndIsReachable = async (pool, tableName) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(`SHOW TABLES LIKE ?`, [tableName]);
    if (rows.length === 0) {
      console.error(`Table ${tableName} does not exist in the database`);
      return { exists: false, reachable: false };
    }
    await connection.query(`SELECT 1 FROM ${tableName} LIMIT 1`);
    console.log(`Table ${tableName} exists and is reachable`);
    return { exists: true, reachable: true };
  } catch (error) {
    console.error(`Error checking table ${tableName}:`, error.message);
    return { exists: false, reachable: false };
  } finally {
    connection.release();
  }
};

// Function to create the database if it doesn't exist
const ensureDatabaseExists = async () => {
  const tempConfig = { ...remoteConfig, database: undefined };
  const connection = await createConnection(tempConfig);
  try {
    const [databases] = await connection.query("SHOW DATABASES LIKE 'healthtrack_db'");
    if (databases.length === 0 && process.env.NODE_ENV !== 'production') {
      await connection.query('CREATE DATABASE healthtrack_db');
      console.log('Database healthtrack_db created successfully.');
    } else {
      console.log('Database healthtrack_db already exists or production environment detected.');
    }
  } catch (error) {
    console.error('Error creating database:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
};

// Initialize the database connection and perform checks
const initializeDb = async () => {
  db = await attemptConnectionWithRetry(remoteConfig, true);
  if (!db) {
    throw new Error('Failed to initialize database: Remote connection failed');
  }

  await ensureDatabaseExists();

  // Check all tables
  const tables = ['users', 'exercises', 'food_logs', 'medications', 'reminders'];
  for (const table of tables) {
    const tableStatus = await checkTableExistsAndIsReachable(db, table);
    if (!tableStatus.exists) {
      throw new Error(`Critical: Table ${table} does not exist. Run migrations first.`);
    }
  }
};

// Periodic connection check and table verification
const startConnectionMonitor = () => {
  setInterval(async () => {
    if (!db) {
      console.log('No active connection, attempting to reinitialize...');
      await initializeDb();
      return;
    }
    const testConnection = await attemptConnectionWithRetry(db.config, true);
    if (!testConnection) {
      console.log('Active connection failed, attempting to reconnect...');
      const newDb = await attemptConnectionWithRetry(remoteConfig, true);
      if (newDb) {
        db = newDb;
        console.log('Switched to new active connection');
      } else {
        console.log('Failed to reconnect, no viable database available');
        return;
      }
    }
    const tables = ['users', 'exercises', 'food_logs', 'medications', 'reminders'];
    for (const table of tables) {
      const tableStatus = await checkTableExistsAndIsReachable(db, table);
      if (!tableStatus.exists) {
        console.error(`Critical: Table ${table} does not exist. Run migrations first.`);
      } else if (!tableStatus.reachable) {
        console.error(`Critical: Table ${table} is not reachable`);
      }
    }
    const [status] = await db.query("SHOW STATUS LIKE 'Threads_connected'");
    console.log(`Current connections: ${status[0].Value}`);
  }, 60000);
};

// Initialize the database connection
(async () => {
  try {
    await initializeDb();
    console.log('Database initialization completed');
    startConnectionMonitor();
  } catch (error) {
    console.error('Failed to initialize database:', error.message);
    process.exit(1);
  }
})();

export default db;