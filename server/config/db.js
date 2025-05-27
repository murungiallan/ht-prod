import { createPool, createConnection } from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const remoteConfig = {
  host: process.env.STACKHERO_MARIADB_HOST, // er4nv2.stackhero-network.com
  user: process.env.STACKHERO_MARIADB_USER,
  password: process.env.STACKHERO_MARIADB_PASSWORD,
  database: process.env.STACKHERO_MARIADB_DATABASE || 'healthtrack_db',
  port: parseInt(process.env.STACKHERO_MARIADB_PORT) || 3306,
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
  const tempConfig = { ...remoteConfig, database: undefined }; // Connect without specifying a database
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

// Function to create the users table (aligned with Stackhero example and app requirements)
const createUsersTable = async (pool) => {
  const connection = await pool.getConnection();
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        uid VARCHAR(255) NOT NULL UNIQUE,
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        display_name VARCHAR(255),
        password VARCHAR(255),
        role ENUM('user', 'admin') DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME,
        phone VARCHAR(20),
        address TEXT,
        height DECIMAL(5,2),
        weight DECIMAL(5,2),
        profile_image VARCHAR(255),
        weekly_food_calorie_goal INT,
        weekly_exercise_calorie_goal INT,
        fcm_token VARCHAR(255)
      ) ENGINE=InnoDB;
    `;
    await connection.query(query);
    console.log('Successfully created or verified "users" table');
  } catch (error) {
    console.error('Failed to create "users" table:', error.message);
    throw error;
  } finally {
    connection.release();
  }
};

// Function to insert a fake user (from Stackhero example)
const insertFakeUser = async (pool) => {
  const connection = await pool.getConnection();
  try {
    const fakeUserId = Math.round(Math.random() * 100000);
    await connection.query(
      'INSERT INTO users (uid, username, email, display_name, address) VALUES (?, ?, ?, ?, ?)',
      [
        `fake-${fakeUserId}`,
        'User name',
        'user@email.com',
        'Fake User',
        'User address',
      ]
    );
    console.log(`Inserted fake user with UID: fake-${fakeUserId}`);
  } catch (error) {
    console.error('Failed to insert fake user:', error.message);
    throw error;
  } finally {
    connection.release();
  }
};

// Function to count users (from Stackhero example)
const countUsers = async (pool) => {
  const connection = await pool.getConnection();
  try {
    const [usersCount] = await connection.query('SELECT COUNT(*) AS cpt FROM users');
    console.log(`There are now ${usersCount[0].cpt} users in the "users" table`);
    return usersCount[0].cpt;
  } catch (error) {
    console.error('Failed to count users:', error.message);
    throw error;
  } finally {
    connection.release();
  }
};

// Initialize the database connection
const initializeDb = async () => {
  db = await attemptConnectionWithRetry(remoteConfig, true);
  if (!db) {
    throw new Error('Failed to initialize database: Remote connection failed');
  }

  await ensureDatabaseExists();

  const tableStatus = await checkTableExistsAndIsReachable(db, 'users');
  if (!tableStatus.exists) {
    await createUsersTable(db);
    // Insert a fake user only if the table was just created
    await insertFakeUser(db);
  }

  // Log the number of users
  await countUsers(db);
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
    const tableStatus = await checkTableExistsAndIsReachable(db, 'users');
    if (!tableStatus.exists) {
      console.error('Critical: "users" table does not exist. Attempting to create...');
      await createUsersTable(db);
      await insertFakeUser(db);
    } else if (!tableStatus.reachable) {
      console.error('Critical: "users" table is not reachable');
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