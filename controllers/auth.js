const mysql = require("mysql");
const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
const { validationResult } = require('express-validator');

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST ,
    user: process.env.DATABASE_USER ,
    password: process.env.DATABASE_PASSWORD,
    database: 'myapirest'
});

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
