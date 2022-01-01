const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 1. globals middlewares
// servire fisiere statice
// app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public')));

// fac un middleware cu helmet (set security HTTP headers)
app.use(helmet());

// logging in etapa de dezvoltare
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// limitez cererile de la acelasi IP
const limiter = rateLimit({
  max: 100, // numarul de requesturi
  windowMs: 60 * 60 * 1000, // fereastra de timp in care sunt permise maxim 100 de requesturi
  message: 'Prea multe cereri de la acest IP. Incercati peste o ora !'
});
// fac limitarea la API !
app.use('/api', limiter);

// body parser, citirea datelor din body in req.body
app.use(express.json({ limit: '10kb' }));

// tot body parser, dar pentru datele encodate
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// folosim parserul de cookie-uri
app.use(cookieParser());

//

// sanitizare date impotriva NOSQL query injection
app.use(mongoSanitize());

// sanitizare date impotriva XSS
app.use(xss());

// prevenire poluare parametrii
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price'
    ]
  })
);

// testare middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  //console.log(req.cookies);
  next();
});

// 3. ROUTES
app.use('/', viewRouter);

// pe tourRouter il folosesc ca middleware
app.use('/api/v1/tours', tourRouter);
// pe userRouter il folosesc ca middleware
app.use('/api/v1/users', userRouter);
// pe reviewRouter il folosesc ca middleware
app.use('/api/v1/reviews', reviewRouter);

// pe bookingsRouter il folosesc ca middleware
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Nu pot gasi ${req.originalUrl} pe acest server !`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
