import { createPool, createConnection } from "mysql2/promise";
import dotenv from "dotenv";
import moment from "moment-timezone";
import url from "url";

dotenv.config();

// Logging helper
const logToFile = (message, level = "INFO") => {
  const timestamp = moment().tz("Asia/Singapore").format("YYYY-MM-DD HH:mm:ss");
  const logMessage = `[${timestamp}] [${level}] ${message}\n`;
  console.log(logMessage); // Log to console for Heroku
};

// Configuration and initialization state
let pool = null;
let poolPromise = null;

// Function to initialize the database pool
const initializePool = async () => {
  if (pool) return pool; // Return existing pool if already initialized
  if (poolPromise) return await poolPromise; // Return ongoing initialization promise

  poolPromise = (async () => {
    // Validate JAWSDB_URL
    if (!process.env.JAWSDB_URL) {
      logToFile("JAWSDB_URL environment variable is missing", "ERROR");
      throw new Error("JAWSDB_URL is required for database connection");
    }

    let remoteConfig;
    try {
      const parsedUrl = url.parse(process.env.JAWSDB_URL);
      const [user, password] = parsedUrl.auth ? parsedUrl.auth.split(":") : [null, null];
      if (!user || !password || !parsedUrl.hostname || !parsedUrl.pathname) {
        throw new Error("Invalid JAWSDB_URL format");
      }
      remoteConfig = {
        host: parsedUrl.hostname,
        user,
        password,
        database: parsedUrl.pathname.slice(1),
        port: parsedUrl.port ? parseInt(parsedUrl.port) : 3306,
        waitForConnections: true,
        connectionLimit: 5,
        queueLimit: 0,
        connectTimeout: 30000,
      };
      logToFile(`Using JawsDB configuration: ${remoteConfig.host}:${remoteConfig.port}`);
    } catch (error) {
      logToFile(`Failed to parse JAWSDB_URL: ${error.message}`, "ERROR");
      throw error;
    }

    // Attempt connection with retry logic
    const attemptConnectionWithRetry = async (config, retries = 3, delay = 5000) => {
      for (let i = 0; i < retries; i++) {
        try {
          const pool = createPool({ ...config });
          const connection = await pool.getConnection();
          logToFile(`Connection established to ${config.host}:${config.port}`);
          connection.release();
          return pool;
        } catch (error) {
          logToFile(
            `Connection attempt ${i + 1}/${retries} to ${config.host}:${config.port} failed: ${error.message}`,
            "ERROR"
          );
          if (i < retries - 1) {
            logToFile(`Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          } else {
            throw error;
          }
        }
      }
    };

    // Check table existence
    const checkTableExistsAndIsReachable = async (pool, tableName) => {
      const connection = await pool.getConnection();
      try {
        const [rows] = await connection.query(`SHOW TABLES LIKE ?`, [tableName]);
        if (rows.length === 0) {
          logToFile(`Table ${tableName} does not exist in the database`, "ERROR");
          return { exists: false, reachable: false };
        }
        await connection.query(`SELECT 1 FROM ${tableName} LIMIT 1`);
        logToFile(`Table ${tableName} exists and is reachable`);
        return { exists: true, reachable: true };
      } catch (error) {
        logToFile(`Error checking table ${tableName}: ${error.message}`, "ERROR");
        return { exists: false, reachable: false };
      } finally {
        connection.release();
      }
    };

    // Ensure database exists
    const ensureDatabaseExists = async (config) => {
      const tempConfig = { ...remoteConfig, database: undefined };
      const connection = await createConnection(tempConfig);
      try {
        const [databases] = await connection.query("SHOW DATABASES LIKE ?", [remoteConfig.database]);
        if (databases.length === 0) {
          await connection.query(`CREATE DATABASE \`${remoteConfig.database}\``);
          logToFile(`Database ${remoteConfig.database} created successfully`);
        } else {
          logToFile(`Database ${remoteConfig.database} already exists`);
        }
      } catch (error) {
        logToFile(`Error creating database: ${error.message}`, "ERROR");
        throw error;
      } finally {
        await connection.end();
      }
    };

    try {
      const createdPool = await attemptConnectionWithRetry(remoteConfig);
      await ensureDatabaseExists(remoteConfig);

      // Check all tables
      const tables = ["users", "exercises", "food_logs", "medications", "reminders"];
      for (const table of tables) {
        const tableStatus = await checkTableExistsAndIsReachable(createdPool, table);
        if (!tableStatus.exists) {
          throw new Error(`Critical: Table ${table} does not exist. Run migrations first.`);
        }
      }

      logToFile("Database initialization completed");
      pool = createdPool; // Set the pool after successful initialization
      poolPromise = null; // Clear the promise
      return pool;
    } catch (error) {
      poolPromise = null; // Clear the promise to allow retries
      logToFile(`Failed to initialize database: ${error.message}`, "ERROR");
      throw error;
    }
  })();

  return await poolPromise;
};

// Define db with a query method that ensures initialization
const db = {
  query: async (...args) => {
    const initializedPool = await initializePool();
    return initializedPool.query(...args);
  },
  getConnection: async () => {
    const initializedPool = await initializePool();
    return initializedPool.getConnection();
  },
  // Add other pool methods as needed
  end: async () => {
    const initializedPool = await initializePool();
    return initializedPool.end();
  },
};

// Start initialization on module load (non-blocking)
initializePool().catch(error => {
  logToFile(`Initial database initialization failed: ${error.message}`, "ERROR");
});

// Export db directly
export default db;