import { createPool, createConnection } from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

// Function to create the database if it doesn't exist (optional for Heroku, as the add-on manages this)
const ensureDatabaseExists = async () => {
  const connection = await createConnection({
    host: process.env.STACKHERO_MARIADB_HOST || 'localhost',
    user: process.env.STACKHERO_MARIADB_USER || 'root',
    password: process.env.STACKHERO_MARIADB_PASSWORD || process.env.DATABASE_PASSWORD || 'root',
  });

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

// Create a connection pool
const db = createPool({
  host: process.env.STACKHERO_MARIADB_HOST || 'localhost',
  user: process.env.STACKHERO_MARIADB_USER || 'root',
  password: process.env.STACKHERO_MARIADB_PASSWORD || process.env.DATABASE_PASSWORD || 'root',
  database: process.env.STACKHERO_MARIADB_DATABASE || 'healthtrack_db',
  port: process.env.STACKHERO_MARIADB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test the connection on startup
const initializeDb = async () => {
  try {
    await ensureDatabaseExists();
    const connection = await db.getConnection();
    console.log('Connected to MySQL/MariaDB Database');
    connection.release();
  } catch (error) {
    console.error('Database connection failed:', error.message);
    throw error;
  }
};

// Initialize the database connection
initializeDb().catch((error) => {
  console.error('Failed to initialize database:', error.message);
  process.exit(1);
});

export default db;