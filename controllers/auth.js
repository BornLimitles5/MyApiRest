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
            if( !results || !(await bcryptjs.compare( password, results[0].password) ) ){
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

exports.register = async (req, res) => {
    const { name, email, password, passwordConfirm } = req.body;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).render('register', {
            message: 'Validation error',
            errors: errors.array()
        });
    }

    try {
        const existingUser = await db.query('SELECT email FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.render('register', {
                message: 'Cette Email est déja utilisée'
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
            message: 'Compte Enregistré Avec Succès'
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
