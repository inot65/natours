const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1) obtin tour data din colectie
  const tours = await Tour.find();

  // 2) construisc template-ul

  // 3) randez acest template utilizand date de la pct.1
  res.status(200).render('overview', {
    title: 'All Tours',
    tours
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  // 1. obtin datele pentru turul dorit (include si review-urile si ghizii turului)
  // console.log(req.params);

  // const slug = req.params;

  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review, rating, user'
  });
  if (!tour) {
    return next(new AppError('No tour with that name !', 404));
  }

  // 2. construiesc template-ul

  // 3. randare template cu datele de la step 1.

  res.status(200).render('tour', {
    title: tour.name,
    tour
  });
});

exports.getLoginForm = catchAsync(async (req, res) => {
  // 1. obtin datele pentru turul dorit (include si review-urile si ghizii turului)

  // 2. construiesc template-ul

  // 3. randare template cu datele de la step 1.

  res.status(200).render('login', {
    title: 'Log into your account'
  });
});

exports.getAccount = catchAsync(async (req, res) => {
  // 1. obtin datele pentru turul dorit (include si review-urile si ghizii turului)

  // 2. construiesc template-ul

  // 3. randare template cu datele de la step 1.

  res.status(200).render('account', {
    title: 'Your Account'
  });
});

exports.getMyTours = catchAsync(async (req, res, next) => {
  // 1. obtin toate rezervarile pentru userul curent
  const bookings = await Booking.find({ user: req.user.id });

  // 2. gasesc toate circuitele cu ID-urile returnate la pct.1
  const tourIDs = bookings.map(el => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIDs } });

  // 3. randare template 'overview' unde vom transmite doar circuitele rezervate de user
  res.status(200).render('overview', {
    title: 'My Tours',
    tours
  });
});

exports.updateUserData = catchAsync(async (req, res, next) => {
  // console.log('UPDATING USER DATA', req.body);
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email
    },
    {
      new: true,
      runValidators: true
    }
  );
  res.status(200).render('account', {
    title: 'Your Account',
    user: updatedUser
  });
});
