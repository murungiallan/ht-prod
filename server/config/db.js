import { createPool } from 'mysql2/promise';
import dotenv from 'dotenv';
import { parse } from 'url';

dotenv.config();

// Parse the database URL if available (for production)
const databaseUrl = process.env.STACKHERO_MYSQL_DATABASE_URL;
let dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '',
  database: 'healthtrack_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : { rejectUnauthorized: false },
};

if (databaseUrl) {
  const parsedUrl = parse(databaseUrl, true);
  const auth = parsedUrl.auth ? parsedUrl.auth.split(':') : ['root', ''];
  const sslOptions = process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : { rejectUnauthorized: false };
  
  dbConfig = {
    host: parsedUrl.hostname || 'localhost',
    port: parseInt(parsedUrl.port) || 3306,
    user: auth[0] || 'root',
    password: auth[1] || '',
    database: parsedUrl.pathname ? parsedUrl.pathname.split('/')[1] : 'healthtrack_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: sslOptions,
  };

  // Override database name if the URL specifies 'root'
  if (dbConfig.database === 'root') {
    dbConfig.database = process.env.MYSQL_DATABASE || 'healthtrack_db';
  }
}

// Create a connection pool
const db = createPool(dbConfig);

// Test the connection on startup
const initializeDb = async () => {
  try {
    const connection = await db.getConnection();
    console.log('Connected to MySQL Database');
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