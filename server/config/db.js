import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.MSSQL_URL;
let dbConfig = {
  user: process.env.MSSQL_USER || 'sa',
  password: process.env.MSSQL_PASSWORD || '',
  server: process.env.MSSQL_HOST || 'localhost',
  port: parseInt(process.env.MSSQL_PORT) || 1433,
  database: process.env.MSSQL_DATABASE || 'healthtrack_db',
  options: {
    encrypt: true, // Enforce encryption as required by the server
    trustServerCertificate: process.env.NODE_ENV === 'development', // Trust self-signed certs locally, validate in production
    enableArithAbort: true,
  },
};

if (connectionString) {
  const params = new URLSearchParams(connectionString.replace(';', '&'));
  dbConfig = {
    user: params.get('User ID') || 'sa',
    password: params.get('Password') || '',
    server: params.get('Server')?.split(',')[0] || 'localhost', // Extract server name
    port: parseInt(params.get('Server')?.split(',')[1]) || 1433, // Extract port
    database: params.get('Initial Catalog') || 'healthtrack_db',
    options: {
      encrypt: params.get('Encrypt') === 'True' || true,
      trustServerCertificate: process.env.NODE_ENV === 'development',
      enableArithAbort: true,
    },
  };
}

// Create a connection pool
const db = new sql.ConnectionPool(dbConfig);

// Test the connection on startup
const initializeDb = async () => {
  try {
    await db.connect();
    console.log('Connected to MSSQL Database');
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

// Export the pool for use in routes
export default db;