import { createPool } from 'mysql2/promise';

// Create a connection pool
const db = createPool({
  host: 'localhost',
  user: 'root',
  password: 'root', // 'Cinnamomo80854' ,
  database: 'healthtrack_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test the connection on startup
const initializeDb = async () => {
  try {
    const connection = await db.getConnection();
    console.log('Connected to MySQL Database');
    connection.release(); // Release the connection back to the pool
  } catch (error) {
    console.error('Database connection failed:', error.message);
    throw error;
  }
};

// Initialize the database connection
initializeDb().catch((error) => {
  console.error('Failed to initialize database:', error);
  process.exit(1);
});

export default db;