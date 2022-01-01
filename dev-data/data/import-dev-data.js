const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');

const Tour = require('./../../models/tourModel');
const User = require('./../../models/userModel');
const Review = require('./../../models/reviewModel');

/* eslint-disable prettier/prettier */
// setez unde am fisierul de configurare dorit
dotenv.config({ path: './config.env' });

// prelucrez sirusl de conectare, si introduc parola corecta
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

// fac conectarea
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(con => console.log('conexiunea la baza de date a fost facuta ! '));

// citesc fisierul cu date
const tours = JSON.parse(fs.readFileSync(`${__dirname}\\tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}\\users.json`, 'utf-8'));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}\\reviews.json`, 'utf-8')
);

// import datele citite in baza de date
const importData = async () => {
  try {
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews);
    console.log('Datele au fost importate cu succes !');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

// sterg datele existente in colectie
const deleteData = async () => {
  try {
    await Review.deleteMany();
    await User.deleteMany();
    await Tour.deleteMany();
    console.log('Datele existente au fost sterse !');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};
if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
