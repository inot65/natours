const multer = require('multer');
const sharp = require('sharp');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

// configurare multer

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     // user-id-timestamp.jpeg
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`); //<-- obtin nume fisier
//     // console.log(`user-${req.user.id}-${Date.now()}.${ext}`);
//   }
// });
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    // pentru a semnala o eroare
    cb(
      new AppError('Nu este o imagine! Incarca o imagine te rog.', 400),
      false
    );
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

// fac un middleware pentru incarcare poza
exports.uploadUserPhoto = upload.single('photo');

// redimensionare imagini
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  // fisierul exista deja in req
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  //console.log('filename este : ', req.file.filename);

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

const filterObj = (obj, ...allowedFields) => {
  const newObject = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObject[el] = obj[el];
  });
  return newObject;
};

// handlere pentru useri

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1. fac o eroare daca userul vrea update de parola
  if (req.body.password || req.body.passwordConfirm) {
    next(
      new AppError(
        'Aceasta ruta nu este pentru actualizare parola. Utilizeaza te rog ruta /updateMyPassword !',
        400
      )
    ); // bad request
  }

  // 2. filtrez cimpurile nepermise a fi updatate
  // filtrez numai cimpurile permise a fi updatate
  // nu vreua sa las userul sa-si schimbe de exemplu rolul de ex.
  const filteredBody = filterObj(req.body, 'name', 'email');

  // adaug si 'photo'
  if (req.file) filteredBody.photo = req.file.filename;

  // 3. actualizez user document
  const user = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// exports.getUser = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'ruta nu a fost definita inca !'
//   });
// };
exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'ruta nu a fost definita inca ! Utilizeaza signup !'
  });
};
// exports.updateUser = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'ruta nu a fost definita inca !'
//   });
// };

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);

//exports.createUser = factory.createOne(User);
// parola NU SE MODIFICA AICI
exports.deleteUser = factory.deleteOne(User);
exports.updateUser = factory.updateOne(User);

// exports.deleteUser = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'ruta nu a fost definita inca !'
//   });
// };
