const express = require('express');
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

router.get('/admin', authController.isLoggedIn, authController.isAdmin, (req, res) => {
  if(req.user.role == "admin"){
    const isAdmin = req.user.role === 'admin';
    res.render('admin', {user : req.user, isAdmin });
  }else{
    res.redirect('/')
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


module.exports = router;
