const express = require("express");
const database = require("../config/db");
const cors = require('cors');
const ExcelJS = require('exceljs');

const app = express();
app.use(cors());
app.use(express.json());

// Function to check and create tables if they don't exist
const checkAndCreateTables = () => {
  const createTables = async () => {
    try {
      await database.query(`CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(255),
        website VARCHAR(255),
        city VARCHAR(255),
        company VARCHAR(255)
      )`);

      await database.query(`CREATE TABLE IF NOT EXISTS posts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT,
        title VARCHAR(255) NOT NULL,
        body TEXT,
        FOREIGN KEY (userId) REFERENCES users(id)
      )`);
      console.log('Tables checked or created successfully');
    } catch (error) {
      console.error('Error checking or creating tables:', error);
    }
  };

  createTables();
};

// Middleware to handle database queries
const queryHandler = (query, values = []) => {
  return new Promise((resolve, reject) => {
    database.query(query, values, (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
};

// Endpoint to add a user
app.post('/addUser', async (req, res) => {
  const { name, email, phone, website, city, company } = req.body;
  const insertQuery = 'INSERT INTO users (name, email, phone, website, city, company) VALUES (?, ?, ?, ?, ?, ?)';
  const values = [name, email, phone, website, city, company];

  try {
    const result = await queryHandler(insertQuery, values);
    res.status(201).send({ message: 'User added successfully', id: result.insertId });
  } catch (error) {
    console.error('Error adding user:', error);
    res.status(500).send({ message: 'Error adding user', error });
  }
});

// Endpoint to check if a user exists based on their ID
app.get('/checkUser/:userId', async (req, res) => {
  const userId = req.params.userId;
  const checkUserQuery = 'SELECT EXISTS (SELECT 1 FROM users WHERE id = ?) AS userExists';

  try {
    const result = await queryHandler(checkUserQuery, [userId]);
    const userExists = result[0].userExists === 1;
    res.status(200).json({ exists: userExists });
  } catch (error) {
    console.error('Error checking user:', error);
    res.status(500).send({ message: 'Error checking user', error });
  }
});

// Endpoint to add posts for a user
app.post('/addPosts', async (req, res) => {
  const { userId, posts } = req.body;

  try {
    for (const post of posts) {
      const { title, body } = post;
      const insertQuery = 'INSERT INTO posts (userId, title, body) VALUES (?, ?, ?)';
      await queryHandler(insertQuery, [userId, title, body]);
    }
    res.status(201).send({ message: 'Posts added successfully' });
  } catch (error) {
    console.error('Error adding posts:', error);
    res.status(500).send({ message: 'Error adding posts', error });
  }
});

// Endpoint to check if posts exist for a user
app.get('/checkPosts/:userId', async (req, res) => {
  const userId = req.params.userId;
  const checkPostsQuery = 'SELECT EXISTS (SELECT 1 FROM posts WHERE userId = ?) AS postsExist';

  try {
    const result = await queryHandler(checkPostsQuery, [userId]);
    const postsExist = result[0].postsExist === 1;
    res.status(200).json({ exists: postsExist });
  } catch (error) {
    console.error('Error checking posts:', error);
    res.status(500).send({ message: 'Error checking posts', error });
  }
});

// Endpoint to download posts for a user in Excel format
app.get('/downloadPosts/:userId', async (req, res) => {
  const userId = req.params.userId;
  const getPostsQuery = 'SELECT p.id AS postId, p.userId, p.title, p.body FROM posts p WHERE p.userId = ?';

  try {
    const posts = await queryHandler(getPostsQuery, [userId]);
    if (posts.length === 0) {
      console.error('No posts found for the user with ID:', userId);
      res.status(404).send({ message: 'No posts found for the user' });
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Posts');
    worksheet.columns = [
      { header: 'User ID', key: 'userId', width: 10 },
      { header: 'Post ID', key: 'postId', width: 10 },
      { header: 'Title', key: 'title', width: 40 },
      { header: 'Body', key: 'body', width: 100 }
    ];

    posts.forEach(post => {
      worksheet.addRow(post);
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=posts.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error downloading posts:', error);
    res.status(500).send({ message: 'Error downloading posts', error });
  }
});

// Basic route for homepage
app.get('/', (req, res) => {
  res.json({ "Message": "HomePage" });
});

// Check and create tables at startup
checkAndCreateTables();

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
