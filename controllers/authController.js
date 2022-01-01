const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Email = require('./../utils/email');

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  // sterg parola din datele trimise ! In baza de date ramane !!!
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create(req.body);

  // trimitem email de bun venit
  const url = `${req.protocol}://${req.get('host')}/me`;
  console.log(url);
  await new Email(newUser, url).sendWelcome();

  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //1. verificam ca exista email-ul si parola

  if (!email || !password) {
    // facem o eroare cu clasa AppError
    return next(new AppError('Furnizeaza un email si o parola !', 400));
  }
  //2. verificam ca userul exista si parola e corecta
  const user = await User.findOne({ email }).select('+password');

  if (!user || !user.correctPassword(password, user.password)) {
    return next(new AppError('Email sau parola incorecta !', 401));
  }
  //3. daca e ok totul, trimitem tokenul JWT la client
  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1. obtin tokenul si il verific daca exista
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  //console.log('Tokenul este : ', token);

  if (!token) {
    //console.log(req.headers.authorization);
    //console.log(token);

    return next(
      new AppError(
        'Nu esti logat la aplicatie! Te rog sa te logezi ca sa ai acces !',
        401
      )
    );
  }
  // 2. verific (il validez) tokenul pe server
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // console.log(decoded);

  // 3. verific daca userul exista
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('Userul cu acest token nu mai exista !', 401));
  }

  // 4. verific daca userul a schimbat parola dupa ce JWT-ul a fost furnizat
  if (currentUser.changePasswordAfter(decoded.iat)) {
    return next(
      new AppError(
        'Ti-ai schimbat recent parola. Te rog sa te logezi iarasi !',
        401
      )
    );
  }
  // abia acum se da acces la ruta dorita !!!
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

// doar pentru a randa pagini si nu va fi nici o eroare
exports.isLoggedIn = async (req, res, next) => {
  // 1. obtin tokenul si il verific daca exista

  if (req.cookies.jwt) {
    try {
      // verific tokenul
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 1. verific daca userul exista
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 3. verific daca  userul a schimbat parola dupa ce JWT-ul a fost furnizat
      if (currentUser.changePasswordAfter(decoded.iat)) {
        return next();
      }
      // abia acum setez ca userul este logat la app !!!
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  return next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // rolurile sunt intr-o matrice. De ex, la noi sunt : ['admin','lead-guide']
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('Nu ai permisiunea sa executi aceasta operatiune !', 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1. obtin userul pe baza emailului publicat
  const user = await User.findOne({ email: req.body.email });
  // verific ca userul exista
  if (!user) {
    return next(new AppError('Nu exista un user cu acest email !', 404));
  }
  // 2. generez un token aleatoriu (pentru asta facem o metoda pentru instanta userului)
  const resetToken = user.createPasswordResetToken();

  // stochez this.passwordResetExpires modificat in
  // .createPasswordResetToken() - timp de expirare 10 minute
  await user.save({ validateBeforeSave: false });

  // 3. il trimit inapoi prin email la user
  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'succes',
      message: 'Tokenul s-a trimis prin e-mail !'
    });
  } catch (err) {
    // resetam tokenul si timpul de expirare
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    // console.log(err);

    // salvam datele !
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        'A aparut o eroare la transmiterea email-ului. Incearca iarasi mai tarziu !',
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1. obtin userul pe baza tokenului

  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  // 2. daca tokenul nu a expirat, si exista un user, setez noua parola
  if (!user) {
    return next(new AppError('Tokenul este invalid sau expirat !', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  // console.log(user.password, user.passwordConfirm, req.body);

  await user.save();

  // 3. actualizez changetPasswordAt pt user - se face in model !

  // 4. logez userul , trimite JWT
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //   1. obtin userul din colectie
  //  Daca userul este logat, AVEM DEJA userul in req !!!

  // verific daca userul exista
  const currentUser = await User.findById(req.user.id).select('+password');
  if (!currentUser) {
    return next(new AppError('Userul nu mai exista !', 401));
  }

  // 2. verific daca parola e corecta
  if (
    !(await currentUser.correctPassword(
      req.body.password,
      currentUser.password
    ))
  ) {
    return next(new AppError('Parola curenta nu este corecta !', 401));
  }
  // 3. actualizez parola

  currentUser.password = req.body.newPassword;
  currentUser.passwordConfirm = req.body.newPasswordConfirm;

  // salvez userul
  await currentUser.save();

  // 4. fac login la user , trimit JWT

  createSendToken(currentUser, 200, res);
});

exports.logout = async (req, res, next) => {
  await res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.status(200).json({
    status: 'success'
  });
};
