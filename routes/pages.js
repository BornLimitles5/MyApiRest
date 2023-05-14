const express = require('express');
const mysql = require("mysql");
const authController = require('../controllers/auth')
const router = express.Router();


router.get('/',authController.isLoggedIn ,  (req, res) => {
  res.render('index' , {user : req.user});
});

router.get('/register',authController.isLoggedIn , (req, res) => {
  if (req.user) {
    res.redirect('/')
  }else{
    res.render('register');
  }
});

router.get('/login',authController.isLoggedIn , (req, res) => {
  if (req.user) {
    res.redirect('/')
  }else{
    res.render('login');
  }
});

router.get('/profile' ,authController.isLoggedIn ,(req , res) =>{
  if(req.user){
    res.render('profile' , {user : req.user});
  }else{
    res.redirect('/login')
  }
  
});

router.get('/update', authController.isLoggedIn, (req, res) => {
  if (req.user) {
    res.render('update' , {user : req.user}); 
  } else {
    res.redirect('/'); 
  }
});

router.get('/delete', authController.isLoggedIn, (req, res) => {
  if (req.user) {
    res.render('delete' , {user : req.user});
  } else {
    res.redirect('/');
  }
});

router.get('/admin', (req, res) => {
  res.redirect('https://www.youtube.com/watch?v=a3Z7zEc7AXQ');
});

router.get('/admin/admin', authController.isLoggedIn, authController.isAdmin, async (req, res) => {
  const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: 'myapirest'
  });

  if (req.user.role === 'admin') {
    db.connect((error) => {
      if (error) {
        console.log(error);
        res.status(500).send('Database connection error');
      } else {
        db.query('SELECT * FROM users', (error, users) => {
          if (error) {
            console.log(error);
            res.status(500).send('Error retrieving users');
          } else {
            const isAdmin = req.user.role === 'admin';
            res.render('admin/admin', { users, isAdmin , user : req.user});
          }
          db.end(); // Close the database connection
        });
      }
    });
  } else {
    res.redirect('/');
  }
});


router.get('/admin/:id/edit', authController.isLoggedIn, authController.isAdmin, async (req, res) => {
  const userId = req.params.id;
  console.log(userId);
  const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: 'myapirest'
  });

  if (req.user.role === 'admin') {
    db.connect((error) => {
      if (error) {
        console.log(error);
        res.status(500).send('Database connection error');
      } else {
        db.query('SELECT * FROM users WHERE id = ?', [userId], (error, result) => {
          if (error) {
            console.log(error);
            res.status(500).send('Error retrieving user');
          } else if (result.length === 0) {
            res.status(404).send('User not found');
          } else {
            const user = result[0];
            res.render('admin/edit', { user });
          }
          db.end(); // Close the database connection
        });
      }
    });
  } else {
    res.redirect('/');
  }
});


router.get('/admin/:id/delete', authController.isLoggedIn, authController.isAdmin, async (req, res) => {
  const userId = req.params.id;

  // Render the delete view with the user ID
  res.render('admin/delete', { userId  , user: req.user});
});

router.post('/admin/:id/delete', authController.isLoggedIn, authController.isAdmin, async (req, res) => {
  const userId = req.params.id;

  const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: 'myapirest'
  });

  db.connect((error) => {
    if (error) {
      console.log(error);
      res.status(500).send('Database connection error');
    } else {
      // Perform the user deletion operation using the userId
      db.query('DELETE FROM users WHERE id = ?', [userId], (error, result) => {
        if (error) {
          console.log(error);
          res.status(500).send('Error deleting user');
        } else {
          // Handle the deletion success, e.g., redirect to another page or display a success message
          res.redirect('/admin/admin');
        }
        db.end(); // Close the database connection
      });
    }
  });
});



module.exports = router;
