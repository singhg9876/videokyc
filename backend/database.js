const sql = require('mysql');
// SQL Server connection configuration
const config = {

    host: "217.21.91.52",
    user: "u484552506_dev",
    password: "SgServices@123",
    database: "u484552506_expertinfrakyc",
    connectionLimit: 10
};

// Connect to the database
async function connectToDatabase() {
    try {
        const pool = await sql.createPool(config);
        console.log('Connected to the database successfully');
        return pool;
    } catch (err) {
        console.error('Database connection failed:', err);
    }
}

module.exports = { connectToDatabase, sql };