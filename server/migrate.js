import db from './config/db.js';

// Array of SQL statements to create and alter tables
const createTables = [
  `
  CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      uid VARCHAR(255) NOT NULL,
      username VARCHAR(100) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      display_name VARCHAR(255),
      password VARCHAR(255) NOT NULL,
      role ENUM('user', 'admin') DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_login TIMESTAMP NULL DEFAULT NULL,
      weekly_food_calorie_goal FLOAT DEFAULT NULL,
      weekly_exercise_calorie_goal FLOAT DEFAULT NULL,
      profile_image VARCHAR(255) DEFAULT NULL,
      phone VARCHAR(20) DEFAULT NULL,
      address VARCHAR(255) DEFAULT NULL,
      height FLOAT DEFAULT NULL,
      weight FLOAT DEFAULT NULL
  )`,
  `
  CREATE TABLE IF NOT EXISTS exercises (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    activity VARCHAR(100) NOT NULL,
    duration INT NOT NULL,
    calories_burned INT,
    date_logged TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,
  `
  CREATE TABLE IF NOT EXISTS food_diary (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    food_name VARCHAR(100) NOT NULL,
    portion_size VARCHAR(50),
    calories INT,
    date_logged TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,
  `
  CREATE TABLE IF NOT EXISTS medications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    medication_name VARCHAR(100) NOT NULL,
    dosage VARCHAR(50) NOT NULL,
    frequency ENUM('daily', 'weekly', 'monthly') NOT NULL,
    times_per_day INT NOT NULL,
    times JSON NOT NULL,
    doses JSON NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,
  `
  CREATE TABLE IF NOT EXISTS reminders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    medication_id INT NOT NULL,
    dose_index INT NOT NULL,
    reminder_time TIME NOT NULL,
    date DATE NOT NULL,
    type ENUM('single', 'daily') NOT NULL,
    status ENUM('pending', 'sent') DEFAULT 'pending',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (medication_id) REFERENCES medications(id) ON DELETE CASCADE
  )`,
];

// Function to run migrations sequentially
const runMigrations = async () => {
  try {
    for (const tableSQL of createTables) {
      await db.query(tableSQL);
      console.log(`Table created or already exists: ${tableSQL.match(/CREATE TABLE IF NOT EXISTS (\w+)/)[1]}`);
    }
    console.log('All migrations completed successfully!');
  } catch (err) {
    console.error('Error executing migration:', err.sqlMessage || err.message);
    throw err;
  } finally {
    await db.end();
    console.log('Database connection pool closed.');
  }
};

// Execute migrations
runMigrations().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});