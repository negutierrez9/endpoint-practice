const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const app = express();

require('dotenv').config();
const port = process.env.PORT;

// Create connection to mysql cars database 
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
});

// Middleware function to configure database connection 
app.use(async function(req, res, next) {
  try {
    req.db = await pool.getConnection();
    req.db.connection.config.namedPlaceholders = true;

    await req.db.query(`SET SESSION sql_mode = "TRADITIONAL"`);
    await req.db.query(`SET time_zone = '-8:00'`);

    await next();

    req.db.release();
  } catch (err) {
    console.log(err);

    if (req.db) req.db.release();
    throw err;
  }
});

app.use(cors());
app.use(express.json());

// Home Page 
app.get('/', async function(req, res) {
  res.send(`<h1>Welcome to My Cars!<h1>`); 
}); 

// Get cars where deleted_flag = 0 
app.get('/cars', async function(req, res) {
  try {
    const [cars] = await req.db.query('SELECT * FROM cars WHERE deleted_flag = 0;'); 
    res.json({ cars }); 
  } catch (err) {
    console.error(err); 
    res.status(500).json({ msg: `Server Error: ${err}`})
  }
});

// Middleware after GET cars request with post processing 
app.use(async function(req, res, next) {
  try {
    console.log('Middleware after the get /cars');
    
    if (req.method === 'GET' && req.originalUrl === '/cars') {
      console.log(`Request to /cars complete. Status: ${res.statusCode}`)
    }

    await next();

  } catch (err) {
    console.error('Error in post-processing', err)
  }
});

// Add new car into database 
app.post('/cars', async function(req, res) {
  try {
    const { make, model, year } = req.body;
  
    const query = await req.db.query(
      `INSERT INTO cars (make, model, year) 
       VALUES (:make, :model, :year)`,
      {
        make,
        model,
        year,
      }
    );
  
    res.json({ success: true, message: 'Car successfully created', data: { make, model, year} });
  } catch (err) {
    res.json({ success: false, message: err, data: null })
  }
});

// Mark a car as 'deleted'
app.delete('/cars/:id', async function(req,res) {
  try {
    const id = req.params.id; 
    const query = await req.db.query(`UPDATE cars SET deleted_flag = 1 WHERE id = ?;`, id)

    if (query.affectedRows > 0) {
      res.json({ success: true, message: `Car with ID ${id} successfully deleted` });
    } else {
      res.status(404).json({ success: false, message: `Car with ID ${id} not found` });
    }
  } catch (err) {
    res.json({ success: false, message: err})
  }
});

// Update a car with data from the front end 
app.put('/cars', async function(req,res) {
  try {
    const { id, make, model, year } = req.body; 

    const query = await req.db.query(`
    UPDATE cars 
    SET make = :make, model = :model, year = :year 
    WHERE id = :id;
  `, { id, make, model, year });  
  
    if (query) {
      res.status(200).json({ success: true, message: `Updated car with ID ${id}`})
    } else {
      res.status(404).json({ success: false, message: `Car with ID ${id} not found`})
    }
  } catch (err) {
    res.status(500).json({ success: false, message: `Server error: ${err}`})
  }
});

app.listen(port, () => console.log(`212 API Example listening on http://localhost:${port}`));

