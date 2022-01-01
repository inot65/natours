const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
//const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// name, email, photo, password, passwordConfirm
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A user must have a name !']
    },
    email: {
      type: String,
      required: [true, 'A user must have a email !'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Adresa de email nu este corecta !']
    },
    photo: {
      type: String,
      default: 'default.jpg'
    },
    role: {
      type: String,
      enum: ['user', 'guide', 'lead-guide', 'admin'],
      default: 'user'
    },
    password: {
      type: String,
      required: [true, 'A user must have a password !'],
      minLength: [8, 'A password must have more or equal then 8 characters!'],
      select: false
    },
    passwordConfirm: {
      type: String,
      validate: {
        // asta va functiona doar la SAVE !!!  .create()  sau .save()
        validator: function(el) {
          return el === this.password;
        },
        message: 'Parolele nu sunt aceleasi !'
      },
      required: [true, 'A user must have a passwordConfirm !'],
      minLength: [
        8,
        'A passwordConfirm must have more or equal then 8 characters!'
      ]
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
      type: Boolean,
      default: true,
      select: false
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined; // aici facem stergerea cimpului efectiv !
  next();
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || this.isNew) return next(); // verific si daca documentul este NOU

  this.passwordChangedAt = Date.now() - 1000; // uneori salvarea merge mai lent si atunci scad o secunda din timpul la care s-a schimbat parola !
  // altfel, e posibil ca userul sa nu poata folosii tokenul ! din cauza diferentelor de timpi (cind  momentul in care s-a schimbat parola este > momentul generarii tokenului )
  next();
});

userSchema.pre(/^find/, function(next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changePasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    ); // obtin timpul in secunde asa !

    return JWTTimestamp < changedTimestamp;
  }

  // FALSE - inseamna ca nu s-a schimbat
  return false;
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  // acum criptam "resetToken"
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
