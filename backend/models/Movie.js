const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  genre: {
    type: String,
    required: true,
    enum: ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Romance', 'Thriller']
  },
  releaseYear: {
    type: Number,
    required: true,
    min: [1950, 'Release Year must be >= 1950'],
    max: [new Date().getFullYear(), `Release Year cannot be in the future`]
  },
  runtime: {
    type: Number,
    required: true,
    min: [30, 'Runtime must be at least 30 minutes'],
    max: [300, 'Runtime must be at most 300 minutes']
  },
  platform: {
    type: String,
    required: true,
    enum: ['Netflix', 'Prime Video', 'Hotstar', 'Theatre', 'Other']
  },
  priority: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  movieCode: {
    type: String,
    unique: true
  },
  status: {
    type: String,
    enum: ['To Watch', 'Watching', 'Watched'],
    default: 'To Watch'
  },
  rating: {
    type: Number,
    min: 1,
    max: 10,
    default: null
  },
  watchedDate: {
    type: Date,
    default: null
  }
}, { timestamps: true });

movieSchema.index({ title: 1, releaseYear: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

module.exports = mongoose.model('Movie', movieSchema);