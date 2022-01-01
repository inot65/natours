const mongoose = require('mongoose');
const slugify = require('slugify');
const User = require('./userModel');
//const Review = require('./reviewModel');

//const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name !'],
      unique: true,
      trim: true,
      maxLength: [
        40,
        'A tour name must have less or equal then 40 characters!'
      ],
      minLength: [10, 'A tour name must have more or equal then 10 characters!']
      // validate: [
      //   validator.isAlpha,
      //   'Numele trebuie sa contina numai caractere alfanumerice'
      // ]
    },
    slug: {
      type: String
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration !']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size !']
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty !'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, difficult !'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: val => Math.round(val * 10) / 10
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price !']
    },
    priceDiscount: {
      type: Number,
      validate: [
        function(val) {
          //console.log('Testate validator: ', val, this.price);

          // nu va merge expresia de mai jos la update, doar la document NOU
          return val < this.price;
        }
      ]
    },
    summary: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image !']
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false
    },
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      adress: String,
      description: String
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        adress: String,
        description: String,
        day: Number
      }
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      }
    ]
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// tourSchema.index({ price: 1 });

tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});

// virtual populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id'
});

tourSchema.pre('save', function(next) {
  // console.log(this);
  this.slug = slugify(this.name, { lower: true });
  next();
});

// tourSchema.pre('save', async function(next) {
//   // async id => await User.findById(id) returneaza o Promise !
//   const guidesPromises = this.guides.map(async id => await User.findById(id));

//   // transformam matricea de Promise-uri in rezultatul final, matrice de obiecte
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

tourSchema.pre('save', function(next) {
  console.log('Voi salva documentul...');
  next();
});

tourSchema.post('save', function(doc, next) {
  // console.log(doc);
  next();
});

// query middleware

tourSchema.pre(/^find/, function(next) {
  this.find({ secretTour: { $ne: true } });

  // folosesc la cronometrarea interogarii !
  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt'
  });
  next();
});

tourSchema.post(/^find/, function(docs, next) {
  //this.find({ secretTour: { $ne: true } });
  console.log(`Interogarea a durat : ${Date.now() - this.start} ms !`);
  // console.log(docs);
  next();
});

// aggregation middleware
// tourSchema.pre('aggregate', function(next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

//   console.log(this.pipeline());
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
