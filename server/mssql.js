import sql from 'mssql';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  user: process.env.MSSQL_USER || 'uz7z1wrl9wlshyd',
  password: process.env.MSSQL_PASSWORD || 'Xwdp2m%?9?K3gcUINV4SSs2oX',
  server: process.env.MSSQL_HOST || 'eu-az-sql-serv1.database.windows.net',
  port: parseInt(process.env.MSSQL_PORT) || 1433,
  database: process.env.MSSQL_DATABASE || 'd2fuhm81uv8ywb0',
  options: {
    encrypt: true,
    trustServerCertificate: process.env.NODE_ENV === 'development',
    enableArithAbort: true,
  },
};

async function importSqlFile(filePath) {
  try {
    const sqlPool = await sql.connect(dbConfig);
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    const statements = sqlContent.split(';').filter(statement => statement.trim().length > 0);

    for (const statement of statements) {
      await sqlPool.request().query(statement);
      console.log('Executed:', statement.substring(0, 50) + '...');
    }

    console.log('SQL file imported successfully.');
  } catch (error) {
    console.error('Error importing SQL file:', error.message);
  } finally {
    await sql.close();
  }
}

const sqlFilePath = 'C:\\Users\\USER\\OneDrive - Swinburne Sarawak\\Documents\\dumps\\Dump20250526.sql';
importSqlFile(sqlFilePath);