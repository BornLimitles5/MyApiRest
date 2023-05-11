//Require
const express = require("express");
const path = require('path')
const mysql = require("mysql");
const dotenv = require('dotenv');

const { check } = require('express-validator');

exports.registerValidation = [
    check('name', 'Name is required').notEmpty(),
    check('email', 'Invalid email address').isEmail(),
    check('password', 'Password is required').notEmpty(),
    check('passwordConfirm').custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Passwords do not match');
        }
        return true;
    })
];

//Partial Avec Hbs
const hbs = require('hbs');
const fs = require('fs');

const header = fs.readFileSync('./views/header.hbs', 'utf8');
const footer = fs.readFileSync('./views/footer.hbs', 'utf8');

hbs.registerPartial('header', header);
hbs.registerPartial('footer', footer);
//Fin Partial

dotenv.config({ path: './.env'})
//Express
const app = express();
//Info Bdd
const db = mysql.createConnection({
    host: process.env.DATABASE_HOST ,
    user: process.env.DATABASE_USER ,
    password: process.env.DATABASE_PASSWORD,
    database: 'myapirest'
});
//Dossier 
const publicDirectory = path.join(__dirname , "./public")
app.use(express.static(publicDirectory));

app.use(express.urlencoded({extended :false}));

app.use(express.json());

//Moteur de Template
app.set('view engine' , 'hbs');
//Bdd Connection
db.connect( (error) => {
    if(error) {
        console.log(error)
    }else{
        console.log("Connexion réussis")
    }
})

//Route
app.use('/', require('./routes/pages'));
app.use('/auth' , require('./routes/auth'));

//Server
app.listen(3000 , () => {
    console.log("Server lancer sur le port 3000");
})