const { Pool } = require('pg')
require('dotenv').config()


const pool = new Pool({
	host: process.env.DB_HOST,
	user: process.env.DB_USERNAME,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
	port: 5432
})

const queryDatabase = async (sql, params) => new Promise(
	(resolve, reject) => {
		const handler = (error, result) => {
			if (error) {
				reject(error);
				return;
			}
			resolve(result.rows);
		}
		pool.query(sql, params, handler);
})

module.exports = { queryDatabase };