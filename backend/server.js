const express = require('express');
const cors = require('cors');
const mysql = require('mysql');
const session = require('express-session');


const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');


const app = express();
const port = 3000;

app.use(cors());  // Enable CORS for all routes
app.use(express.json());  // Middleware to parse JSON bodies


// Set up session middleware
app.use(session({
  secret: 'ytwe767829329y',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Use 'secure: true' if you're using HTTPS
}));

// Create a connection to the database
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'reports'
});

// Connect to the database
db.connect(err => {
  if (err) {
    console.error('Error connecting to the database:', err.stack);
    return;
  }
  console.log('Connected to the database as id ' + db.threadId);
});

// Route to handle adding a lost item report
app.post('/api/lost-items', (req, res) => {
  const { itemName, description, reward, dateReported } = req.body;

  // Server-side validation (optional)
  if (!itemName || !description || !reward || !dateReported) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const query = 'INSERT INTO lost_items (item_name, description, reward, date_reported) VALUES (?, ?, ?, ?)';
  const values = [itemName, description, reward, dateReported];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error('Error inserting data into the database:', err);
      return res.status(500).json({ message: 'Error inserting data', error: err.message });
    }
    res.status(201).json({ id: result.insertId, ...req.body });
  });
});

//login & signup

app.post('/login', (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ error: 'Email, password, and role are required' });
  }

  const sql = 'SELECT * FROM login WHERE email = ?';
  db.query(sql, [email], (err, results) => {
    if (err) {
      console.error('Error querying the database:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = results[0];
    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    req.session.user = { id: user.id, email: user.email, role: role }; // Store user info in session
    res.status(200).json({ message: 'Login successful' });
  });
});

// User sign up route
app.post('/signup', (req, res) => {
  const { name, email, password } = req.body;
  console.log('Received data:', req.body); // Log the received data

  if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  const sql = "INSERT INTO login (name, email, password) VALUES (?, ?, ?)";
  db.query(sql, [name, email, hashedPassword], (err, results) => {
      if (err) {
          console.error('Error inserting data:', err);
          return res.status(500).json("Error inserting data");
      }
      return res.status(201).json({ message: "User signed up successfully" });
  });
});

// User login route


// server.js or your route file
app.get('/api/lost', (req, res) => {
    const query = 'SELECT * FROM lost_items';
    db.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching items from database:', err);
        return res.status(500).json({ message: 'Error fetching items', error: err });
      }
      console.log('Fetched items:', results); // Debugging line
      res.json(results);
    });
  });
  
  // Route to handle deleting a lost item report
  app.delete('/api/lost/:id', (req, res) => {
    const { id } = req.params;
  
    if (!id || isNaN(id)) {
      console.log('Invalid ID received:', id); // Debugging line
      return res.status(400).json({ message: 'Invalid ID' });
    }
  
    const deleteQuery = 'DELETE FROM lost_items WHERE id = ?';
    db.query(deleteQuery, [id], (err, result) => {
      if (err) {
        console.error('Error deleting data from the database:', err);
        return res.status(500).json({ message: 'Error deleting data', error: err.message });
      }
      if (result.affectedRows === 0) {
        console.log('No item found with ID:', id); // Debugging line
        return res.status(404).json({ message: 'Item not found' });
      }
      console.log('Item deleted with ID:', id); // Debugging line
      res.status(200).json({ message: 'Item deleted successfully' });
    });
  });
  
  // Route to get all returned items
app.get('/api/returned-items', (req, res) => {
    const query = 'SELECT * FROM lost_items WHERE status = "returned"';
    db.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching returned items:', err);
        return res.status(500).json({ message: 'Error fetching returned items', error: err });
      }
      res.json(results);
    });
  });
  
  // Route to add a returned item
  app.post('/api/returned-items', (req, res) => {
    const { itemName, description, reward, dateReported } = req.body;
  
    if (!itemName || !description || !reward || !dateReported) {
      return res.status(400).json({ message: 'All fields are required' });
    }
  
    const query = 'INSERT INTO lost_items (item_name, description, reward, date_reported, status) VALUES (?, ?, ?, ?, "returned")';
    const values = [itemName, description, reward, dateReported];
  
    db.query(query, values, (err, result) => {
      if (err) {
        console.error('Error inserting returned item:', err);
        return res.status(500).json({ message: 'Error inserting returned item', error: err.message });
      }
      res.status(201).json({ id: result.insertId, ...req.body });
    });
  });
  
  // Route to update a returned item
  // Route to get all returned items
app.get('/api/returned-items', (req, res) => {
    const query = 'SELECT * FROM lost_items WHERE status = "returned"';
    db.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching returned items:', err);
        return res.status(500).json({ message: 'Error fetching returned items', error: err.message });
      }
      res.json(results);
    });
  });
  
  // Route to mark a lost item as returned
  app.post('/api/mark-returned/:id', (req, res) => {
    const { id } = req.params;
  
    if (!id || isNaN(id)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }
  
    const query = 'UPDATE lost_items SET status = "returned" WHERE id = ? AND status = "lost"';
    db.query(query, [id], (err, result) => {
      if (err) {
        console.error('Error marking item as returned:', err);
        return res.status(500).json({ message: 'Error marking item as returned', error: err.message });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Item not found or already returned' });
      }
      res.status(200).json({ message: 'Item marked as returned' });
    });
  });
  // Route to update a returned item
app.put('/api/returned-items/:id', (req, res) => {
  const { id } = req.params;
  const { item_name, description, reward, date_reported } = req.body;

  if (!id || isNaN(id)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const query = 'UPDATE lost_items SET item_name = ?, description = ?, reward = ?, date_reported = ? WHERE id = ? AND status = "returned"';
  const values = [item_name, description, reward, date_reported, id];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error('Error updating returned item:', err);
      return res.status(500).json({ message: 'Error updating returned item', error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Item not found or not returned' });
    }
    res.status(200).json({ message: 'Item updated successfully' });
  });
});

  // Route to delete a returned item
  app.delete('/api/returned-items/:id', (req, res) => {
    const { id } = req.params;
  
    if (!id || isNaN(id)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }
  
    const query = 'DELETE FROM lost_items WHERE id = ? AND status = "returned"';
    db.query(query, [id], (err, result) => {
      if (err) {
        console.error('Error deleting returned item:', err);
        return res.status(500).json({ message: 'Error deleting returned item', error: err.message });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Item not found or not returned' });
      }
      res.status(200).json({ message: 'Item deleted successfully' });
    });
  });
  
 
  

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
