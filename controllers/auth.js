const mysql = require("mysql");
const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
const {promisify} = require('util');
const { validationResult } = require('express-validator');
const { log } = require("console");

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST ,
    user: process.env.DATABASE_USER ,
    password: process.env.DATABASE_PASSWORD,
    database: 'myapirest'
});

exports.login = async (req , res) =>{
    try {
        const {email , password} = req.body;

        if(!email || !password){
            return res.status(400).render('login' , {
                message : 'Veuillez remplir les champs'
            })
        }

        db.query('SELECT * FROM users WHERE email = ?' , [email] , async (error , results) => {
            if( !results || results.length === 0 ||!(await bcryptjs.compare( password, results[0].password) ) ){
                res.status(401).render("login" , {
                    message:'Email ou Mots de Passe Incorrect '
                })
            }else{
                const id = results[0].id;

                const token = jwt.sign({ id } , process.env.JWT_SECRET , {
                    expiresIn : process.env.JWT_EXPIRES_IN
                });

                const cookieOptions = {
                    expires: new Date(
                        Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
                    ),
                    httpOnly: true
                }
                res.cookie('jwt' , token , cookieOptions);
                res.status(200).redirect('/');
            }

            
        })

    } catch (error) {
        console.log(error);
    }
}
//~Jolie Regex~
const emailRegex = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/;
const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\W)(?!.*\s).{12,}$/;
exports.register = async (req, res) => {
    const { name, email, password, passwordConfirm } = req.body;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).render('register', {
            message: 'Validation error',
            errors: errors.array()
        });
    }

    // Validate email format using regex
    if (!emailRegex.test(email)) {
        return res.status(422).render('register', {
            message: 'Invalid email format',
        });
    }

    // Validate password strength using regex
    if (!passwordRegex.test(password)) {
        return res.status(422).render('register', {
            message: 'Password must contain at least 12 characters, one uppercase letter, one lowercase letter,one special character , and one digit',
        });
    }

    try {
        const existingUser = await db.query('SELECT email FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.render('register', {
                message: 'Cette Email est déjà utilisée'
            });
        }

        const hashedPassword = await bcryptjs.hash(password, 8);

        const newUser = {
            name: name,
            email: email,
            password: hashedPassword
        };

        const result = await db.query('INSERT INTO users SET ?', newUser);

        return res.render('register', {
            messages: 'Compte Enregistré Avec Succès'
        });

    } catch (error) {
        console.log(error);
        return res.status(500).render('register', {
            message: 'Error'
        });
    }
};

exports.isLoggedIn = async (req , res , next) =>{
    if(req.cookies.jwt){
        try {
            //1) verify the token
        const decoded = await promisify(jwt.verify)(req.cookies.jwt,process.env.JWT_SECRET);
        //2) Check if the user still exists
        db.query('SELECT * FROM users WHERE id = ?' , [decoded.id] , (error , result) =>{

            if (!result) {
                return next();
            }

            req.user = result[0]
            return next();

        });


        } catch (error) {
            console.log(error);
            return next();
        }
    }else{
        next();
    }
    
}

exports.logout = async (req, res) => {
    res.cookie('jwt', '', {
        expires: new Date(0),
        httpOnly: true
    });

    res.status(200).redirect('/');
};

//User Crud (Update Account & Delete Account)
exports.update = async (req, res) => {
try {
    const { email, password } = req.body;

    if (!email && !password) {
    return res.status(400).render('update', {
        message: 'Veuillez remplir au moins un champ',
    });
    }

    try {
    const decoded = jwt.verify(req.cookies.jwt, process.env.JWT_SECRET);
    const userId = decoded.id;

    db.query('SELECT * FROM users WHERE id = ?', [userId], async (error, result) => {
        if (error) {
        return res.status(500).render('update', {
            message: 'Erreur lors de la mise à jour',
        });
        } else {
        if (!result) {
            return res.status(404).render('update', {
            message: 'Utilisateur introuvable',
            });
        }

        let updateQuery = '';
        const updateValues = [];


        if (email) {
            updateQuery += 'email = ?,';
            updateValues.push(email);
        }

        if (password) {
            updateQuery += 'password = ?,';
            updateValues.push(password);
        }

        // Remove the trailing comma from updateQuery
        updateQuery = updateQuery.slice(0, -1);

        // Add the userId to updateValues
        updateValues.push(userId);

        // Perform the update operation in the database
        // Replace the code below with your actual update logic
        db.query('UPDATE users SET ' + updateQuery + ' WHERE id = ?', updateValues, (error, result) => {
            if (error) {
            return res.status(500).render('update', {
                message: 'Erreur lors de la mise à jour',
            });
            } else {
            return res.status(200).render('update', {
                message: 'Mise à jour réussie',
            });
            }
        });
        }
    });
    } catch (error) {
    return res.status(401).render('update', {
        message: 'Accès non autorisé',
    });
    }
} catch (error) {
    console.log(error);
}
};

exports.delete = async (req, res) => {
    try {
      // Get the user ID from the decoded JWT token
      const decoded = jwt.verify(req.cookies.jwt, process.env.JWT_SECRET);
      const userId = decoded.id;
  
      // Delete the user from the database
      db.query('DELETE FROM users WHERE id = ?', [userId], (error, result) => {
        if (error) {
          return res.status(500).render('delete', {
            message: 'Error deleting account',
          });
        } else {
          // Clear the JWT cookie and redirect to the login page
          res.cookie('jwt', '', {
            expires: new Date(0),
            httpOnly: true,
          });
          return res.status(200).render('delete', {
            message: 'Account successfully deleted',
          });
        }
      });
    } catch (error) {
      return res.status(401).render('delete', {
        message: 'Unauthorized access',
      });
    }
};

//Admin Fonction
exports.isAdmin = async (req, res, next) => {
  if (req.cookies.jwt) {
      try {
          // Verify the token
          const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);
          
          // Check if the user still exists
          db.query('SELECT * FROM users WHERE id = ?', [decoded.id], (error, result) => {
              if (!result) {
                  return next();
              }

              // Assign user data to req.user
              req.user = result[0];

              // Check if the user has the role admin
              if (req.user.role === 'admin') {
                  req.isAdmin = true;
              } else {
                  req.isAdmin = false;
              }

              return next();
          });
      } catch (error) {
          console.log(error);
          return next();
      }
  } else {
      next();
  }
};

exports.AdminEdit = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password } = req.body;

    if (!name && !email && !password) {
      return res.status(400).render('admin/edit', {
        message: 'Veuillez remplir au moins un champ',
      });
    }

    try {

      // Fetch the user to be edited from the database
      db.query('SELECT * FROM users WHERE id = ?', [id], async (error, result) => {
        if (error) {
          return res.status(500).render('admin/edit', {
            message: 'Erreur lors de la récupération de l\'utilisateur',
          });
        } else {
          if (!result || result.length === 0) {
            return res.status(404).render('admin/edit', {
              message: 'Utilisateur introuvable',
            });
          }

          let updateQuery = '';
          const updateValues = [];

          if (name) {
            updateQuery += 'name = ?,';
            updateValues.push(name);
          }

          if (email) {
            updateQuery += 'email = ?,';
            updateValues.push(email);
          }

          if (password) {
            const salt = await bcryptjs.genSalt(8);
            const hashedPassword = await bcryptjs.hash(password, salt);
            updateQuery += 'password = ?,';
            updateValues.push(hashedPassword);
          }

          // Remove the trailing comma from updateQuery
          updateQuery = updateQuery.slice(0, -1);

          // Add the user ID to updateValues
          updateValues.push(id);

          // Perform the update operation in the database
          db.query('UPDATE users SET ' + updateQuery + ' WHERE id = ?', updateValues, (error, result) => {
            if (error) {
              return res.status(500).render('admin/edit', {
                message: 'Erreur lors de la mise à jour',
              });
            } else {
              return res.status(200).render('admin/edit', {
                message: 'Mise à jour réussie',
              });
            }
          });
        }
      });
    } catch (error) {
      return res.status(401).render('admin/edit', {
        message: 'Accès non autorisé',
      });
    }
  } catch (error) {
    console.log(error);
  }
};










