const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// // MySQL connection
// const mysql = require('mysql');


// XAMPP Default Configuration
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'myDB',
  port: 3306 // Default MySQL port
});

db.connect(err => {
  if (err) {
    console.error('Connection Error:', {
      code: err.code,
      message: err.sqlMessage
    });
    process.exit(1);
  }
  console.log(' Successfully connected to MySQL');
});

// 2: Create Tables with /install
app.get('/install', (req, res) => {
  console.log('Install route called');

  const tableQueries = [
    `CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      category_id INT,
      name VARCHAR(255),
      price DECIMAL(10,2),
      description TEXT,
      image VARCHAR(255),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )`,
    `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255),
      password VARCHAR(255)
    )`,
    `CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      total DECIMAL(10,2),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS order_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT,
      product_id INT,
      quantity INT,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )`
  ];

  let completed = 0;

  tableQueries.forEach(query => {
    db.query(query, (err, result) => {
      if (err) {
        console.error('Error creating table:', err.sqlMessage);
        return res.send('Error creating tables: ' + err.sqlMessage);
      }

      completed++;
      if (completed === tableQueries.length) {
        console.log('All tables created');
        res.send('All tables created successfully');
      }
    });
  });
});

// Set up multer storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Uploads folder
  },
  filename: (req, file, cb) => {
    // Generate a unique filename based on the current timestamp
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

// Initialize multer with storage configuration
const upload = multer({ storage: storage });

app.post('/add-product', upload.single('image'), (req, res) => {
    console.log('Form Data:', req.body);
    console.log('Uploaded File:', req.file);
  
    const { category_id, name, price, description } = req.body;
    const image = req.file ? req.file.filename : null;
  
    // Check if category exists
    const checkCategorySql = `SELECT * FROM categories WHERE id = ?`;
    db.query(checkCategorySql, [category_id], (err, results) => {
      if (err) {
        console.error('Error checking category:', err.message);
        return res.status(500).send('Error checking category');
      }
  
      if (results.length === 0) {
        console.log('Category does not exist for ID:', category_id);
        return res.status(400).send('Category does not exist');
      }
  
      // Insert the product
      const sql = `INSERT INTO products (category_id, name, price, description, image) VALUES (?, ?, ?, ?, ?)`;
      db.query(sql, [category_id, name, price, description, image], (err, result) => {
        if (err) {
          console.error('Error adding product:', err.message);
          return res.status(500).send('Error adding product: ' + err.message);
        }
        console.log('Product added:', result);
        res.send('Product added successfully');
      });
    });
  });
  
// Add product route
app.post('/add-product', upload.single('image'), (req, res) => {
  const { category_id, name, price, description } = req.body;
  const image = req.file ? req.file.filename : null;

  // Check if the category exists
  const checkCategorySql = `SELECT * FROM categories WHERE id = ?`;
  db.query(checkCategorySql, [category_id], (err, results) => {
    if (err) {
      console.error('Error checking category:', err.message);
      return res.status(500).send('Error checking category');
    }

    if (results.length === 0) {
      // If category doesn't exist, send an error message
      return res.status(400).send('Category does not exist');
    }

    // Insert the product if the category exists
    const sql = `INSERT INTO products (category_id, name, price, description, image) VALUES (?, ?, ?, ?, ?)`;
    db.query(sql, [category_id, name, price, description, image], (err, result) => {
      if (err) {
        console.error('Error adding product:', err.message);
        return res.status(500).send('Error adding product: ' + err.message);
      }
      res.send('Product added successfully');
    });
  });
});

// Serve the index.html file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
// Get all categories
app.get('/categories', (req, res) => {
    const query = 'SELECT * FROM categories';
    db.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching categories:', err);
        return res.status(500).send('Error fetching categories');
      }
      res.json(results);
    });
  });
  

  app.get('/products', (req, res) => {
    const query = 'SELECT * FROM products';
    db.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching products:', err);
        return res.status(500).send('Error fetching products');
      }
      res.json(results);
    });
  });
  