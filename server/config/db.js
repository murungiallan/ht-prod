const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Cinnamomo80854',
    database: 'healthtrack_db'
});

db.connect((err) => {

    if (err) {
        console.error('Database connection failed:', err.message);
    } else {
        console.log('Connected to MySQL Database');
    }

});

module.exports = db;