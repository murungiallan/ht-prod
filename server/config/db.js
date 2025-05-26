import { createPool, createConnection } from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

// Configuration for local and remote instances
const localConfig = {
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'healthtrack_db',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 30000, // 30 seconds timeout
};

const remoteConfig = {
  host: process.env.STACKHERO_MARIADB_HOST,
  user: process.env.STACKHERO_MARIADB_USER,
  password: process.env.STACKHERO_MARIADB_PASSWORD,
  database: process.env.STACKHERO_MARIADB_DATABASE || 'healthtrack_db',
  port: parseInt(process.env.STACKHERO_MARIADB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 30000, // 30 seconds timeout
  ssl: {
    rejectUnauthorized: true, // Enable SSL if required by remote instance
  },
};

let db; // Active connection pool

// Function to test and set the active connection pool
const attemptConnection = async (config, isPrimary = true) => {
  try {
    const pool = createPool({ ...config });
    pool.config = config; // Attach config to the pool for later use
    const connection = await pool.getConnection();
    console.log(`${isPrimary ? 'Primary' : 'Secondary'} connection established to ${config.host}:${config.port}`);
    connection.release();
    return pool;
  } catch (error) {
    console.error(`Connection to ${config ? `${config.host}:${config.port}` : 'undefined host'} failed:`, error.message);
    return null;
  }
};

// Initialize the database connection with failover
const initializeDb = async () => {
  // Attempt primary (remote) connection first
  db = await attemptConnection(remoteConfig, true);
  if (!db) {
    // Fallback to local connection
    db = await attemptConnection(localConfig, false);
    if (!db) {
      throw new Error('Failed to initialize database: Both remote and local connections failed');
    }
  }
};

// Function to create the database if it doesn't exist
const ensureDatabaseExists = async () => {
  if (!db || !db.config) {
    throw new Error('No active database connection available');
  }
  const connection = await createConnection(db.config);
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

// Periodic connection check and failover
const startConnectionMonitor = () => {
  setInterval(async () => {
    if (!db) {
      console.log('No active connection, attempting to reinitialize...');
      await initializeDb();
      return;
    }
    const testConnection = await attemptConnection(db.config, true);
    if (!testConnection) {
      console.log('Active connection failed, attempting to switch...');
      const newDb = await attemptConnection(remoteConfig, true) || await attemptConnection(localConfig, false);
      if (newDb) {
        db = newDb;
        console.log('Switched to new active connection');
      } else {
        console.log('Failed to switch connections, no viable database available');
      }
    }
  }, 60000); // Check every 60 seconds
};

// Initialize the database connection
(async () => {
  try {
    await initializeDb();
    await ensureDatabaseExists();
    console.log('Database initialization completed');
    startConnectionMonitor();
  } catch (error) {
    console.error('Failed to initialize database:', error.message);
    process.exit(1);
  }
})();

// Export the active connection pool
export default db;