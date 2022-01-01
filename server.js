const mongoose = require('mongoose');
const dotenv = require('dotenv');
const app = require('./app');

process.on('uncaughtException', err => {
  console.log(err);
  console.log('Excepție neacoperita! 💀 Inchidere aplicatie...');
  process.exit(1);
});

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
  .then(() => console.log('conexiunea la baza de date a fost facuta ! '));

// console.log(`Mediul setat este mediul : ${app.get('env')}`);
// console.log('\n----------- Variabile din Node.js ---------\n');
// console.log(process.env);

// 4. start server
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
}); // serverul il pun in ascultare

process.on('unhandledRejection', err => {
  console.log(err.name, err.message);
  console.log('Respingere neacoperită! 💀 Inchidere aplicatie...');
  server.close(() => {
    process.exit(1);
  });
});
