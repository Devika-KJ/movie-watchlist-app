const express = require('express');
const router = express.Router();
const Movie = require('../models/Movie');

const sendResponse = (res, statusCode, success, message, data = null) => {
  return res.status(statusCode).json({ success, message, data });
};

router.get('/watch-next', async (req, res) => {
  try {
    const movie = await Movie.findOne({ status: 'To Watch' })
      .sort({ priority: -1, runtime: 1 });

    if (!movie) {
      return sendResponse(res, 404, false, 'No movies in "To Watch" status');
    }
    return sendResponse(res, 200, true, 'Watch Next movie fetched successfully', movie);
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
});

router.get('/stats', async (req, res) => {
  try {
    const statusCounts = await Movie.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const statsMap = { 'To Watch': 0, 'Watching': 0, 'Watched': 0 };
    statusCounts.forEach(s => { statsMap[s._id] = s.count; });

    const watchedAgg = await Movie.aggregate([
      { $match: { status: 'Watched' } },
      {
        $group: {
          _id: null,
          totalRuntime: { $sum: '$runtime' },
          avgRating: { $avg: '$rating' }
        }
      }
    ]);

    const totalHoursWatched = watchedAgg.length ? (watchedAgg[0].totalRuntime / 60).toFixed(1) : 0;
    const avgRating = watchedAgg.length && watchedAgg[0].avgRating ? Number(watchedAgg[0].avgRating.toFixed(1)) : 0;

    const topGenreAgg = await Movie.aggregate([
      { $match: { status: 'Watched' } },
      { $group: { _id: '$genre', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);

    const topGenre = topGenreAgg.length ? topGenreAgg[0]._id : 'N/A';

    return sendResponse(res, 200, true, 'Stats fetched successfully', {
      statusCounts: statsMap,
      totalHoursWatched: Number(totalHoursWatched),
      avgRating,
      topGenre
    });
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
});

router.get('/', async (req, res) => {
  try {
    const { status, genre, search, page = 1, limit = 6 } = req.query;
    let query = {};

    if (status) query.status = status;
    if (genre) query.genre = genre;
    if (search) query.title = { $regex: search, $options: 'i' };

    let sortOptions = { createdAt: -1 };
    if (status === 'To Watch') {
      sortOptions = { priority: -1, createdAt: -1 };
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const totalMovies = await Movie.countDocuments(query);
    const totalPages = Math.ceil(totalMovies / limitNum) || 1;

    const movies = await Movie.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    return sendResponse(res, 200, true, 'Movies fetched successfully', {
      movies,
      currentPage: pageNum,
      totalPages,
      totalMovies
    });
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, genre, releaseYear, runtime, platform, priority } = req.body;

    const currentYear = new Date().getFullYear();
    if (releaseYear < 1950 || releaseYear > currentYear) {
      return sendResponse(res, 400, false, `Release year must be between 1950 and ${currentYear}`);
    }
    if (runtime < 30 || runtime > 300) {
      return sendResponse(res, 400, false, 'Runtime must be between 30 and 300 minutes');
    }

    const existing = await Movie.findOne({
      title: { $regex: `^${title.trim()}$`, $options: 'i' },
      releaseYear: Number(releaseYear)
    });

    if (existing) {
      return sendResponse(res, 409, false, 'A movie with this title and release year already exists!');
    }

    const count = await Movie.countDocuments({ releaseYear: Number(releaseYear) });
    const sequence = String(count + 1).padStart(3, '0');
    const movieCode = `MV-${releaseYear}-${sequence}`;

    const newMovie = new Movie({
      title,
      genre,
      releaseYear: Number(releaseYear),
      runtime: Number(runtime),
      platform,
      priority: Number(priority),
      movieCode,
      status: 'To Watch'
    });

    await newMovie.save();
    return sendResponse(res, 201, true, 'Movie added successfully', newMovie);
  } catch (error) {
    if (error.code === 11000) {
      return sendResponse(res, 409, false, 'A movie with this title and release year already exists!');
    }
    return sendResponse(res, 400, false, error.message);
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { title, genre, runtime, platform, priority } = req.body;
    const movie = await Movie.findById(req.params.id);

    if (!movie) return sendResponse(res, 404, false, 'Movie not found');

    if (runtime && (runtime < 30 || runtime > 300)) {
      return sendResponse(res, 400, false, 'Runtime must be between 30 and 300 minutes');
    }

    movie.title = title || movie.title;
    movie.genre = genre || movie.genre;
    movie.runtime = runtime ? Number(runtime) : movie.runtime;
    movie.platform = platform || movie.platform;
    movie.priority = priority ? Number(priority) : movie.priority;

    await movie.save();
    return sendResponse(res, 200, true, 'Movie details updated successfully', movie);
  } catch (error) {
    return sendResponse(res, 400, false, error.message);
  }
});

router.patch('/:id/status', async (req, res) => {
  try {
    const { status, rating } = req.body;
    const movie = await Movie.findById(req.params.id);

    if (!movie) return sendResponse(res, 404, false, 'Movie not found');

    if (movie.status === 'Watched' && status && status !== 'Watched') {
      return sendResponse(res, 400, false, 'Watched status is final and cannot be changed!');
    }

    if (status && status !== movie.status) {
      const allowedTransitions = {
        'To Watch': ['Watching', 'Watched'],
        'Watching': ['Watched', 'To Watch'],
        'Watched': []
      };

      if (!allowedTransitions[movie.status].includes(status)) {
        return sendResponse(res, 400, false, `Invalid status transition from "${movie.status}" to "${status}"`);
      }
      movie.status = status;
    }

    if (movie.status === 'Watched') {
      if (rating !== undefined && rating !== null) {
        if (rating < 1 || rating > 10) {
          return sendResponse(res, 400, false, 'Rating must be between 1 and 10');
        }
        movie.rating = Number(rating);
      } else if (!movie.rating) {
        return sendResponse(res, 400, false, 'Rating (1 to 10) is mandatory when movie is Watched!');
      }

      if (!movie.watchedDate) {
        movie.watchedDate = new Date();
      }
    } else {
      if (rating !== undefined && rating !== null) {
        return sendResponse(res, 400, false, 'Rating can only be set for movies in "Watched" status!');
      }
    }

    await movie.save();
    return sendResponse(res, 200, true, 'Movie status/rating updated successfully', movie);
  } catch (error) {
    return sendResponse(res, 400, false, error.message);
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return sendResponse(res, 404, false, 'Movie not found');

    if (movie.status === 'Watching') {
      return sendResponse(res, 400, false, 'Movies currently in "Watching" status cannot be deleted!');
    }

    await Movie.findByIdAndDelete(req.params.id);
    return sendResponse(res, 200, true, 'Movie deleted successfully');
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
});

module.exports = router;