import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Film, Star, Clock, AlertCircle, PlusCircle, Sparkles, Trash2, Edit, CheckCircle } from 'lucide-react';
import './App.css';

const API_URL = "https://movie-watchlist-backend-ju1s.onrender.com/api/movies";

function App() {
  const [movies, setMovies] = useState([]);
  const [stats, setStats] = useState({ statusCounts: { 'To Watch': 0, Watching: 0, Watched: 0 }, totalHoursWatched: 0, avgRating: 0, topGenre: 'N/A' });
  const [watchNext, setWatchNext] = useState(null);
  
  const [statusFilter, setStatusFilter] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    genre: 'Action',
    releaseYear: new Date().getFullYear(),
    runtime: 120,
    platform: 'Netflix',
    priority: 3
  });

  const [statusModal, setStatusModal] = useState({ open: false, movie: null, targetStatus: '', rating: 5 });
  const [errorMessage, setErrorMessage] = useState('');

  const fetchMovies = useCallback(async () => {
    try {
      const params = { page, limit: 6 };
      if (statusFilter) params.status = statusFilter;
      if (genreFilter) params.genre = genreFilter;
      if (search) params.search = search;

      const res = await axios.get(API_BASE, { params });
      if (res.data.success) {
        setMovies(res.data.data.movies);
        setTotalPages(res.data.data.totalPages);
      }
    } catch (err) {
      console.error(err);
    }
  }, [page, statusFilter, genreFilter, search]);

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_BASE}/stats`);
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMovies();
    fetchStats();
  }, [fetchMovies]);

  const handleWatchNext = async () => {
    try {
      const res = await axios.get(`${API_BASE}/watch-next`);
      if (res.data.success) {
        setWatchNext(res.data.data);
      }
    } catch (err) {
      setWatchNext(null);
      alert(err.response?.data?.message || 'No movie found in "To Watch" status');
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      if (editingMovie) {
        await axios.put(`${API_BASE}/${editingMovie._id}`, formData);
      } else {
        await axios.post(API_BASE, formData);
      }
      setIsModalOpen(false);
      resetForm();
      fetchMovies();
      fetchStats();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Error saving movie');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      genre: 'Action',
      releaseYear: new Date().getFullYear(),
      runtime: 120,
      platform: 'Netflix',
      priority: 3
    });
    setEditingMovie(null);
    setErrorMessage('');
  };

  const openEdit = (movie) => {
    setEditingMovie(movie);
    setFormData({
      title: movie.title,
      genre: movie.genre,
      releaseYear: movie.releaseYear,
      runtime: movie.runtime,
      platform: movie.platform,
      priority: movie.priority
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (movie) => {
    if (movie.status === 'Watching') {
      alert('Movies in "Watching" status cannot be deleted!');
      return;
    }
    if (window.confirm(`Are you sure you want to delete "${movie.title}"?`)) {
      try {
        await axios.delete(`${API_BASE}/${movie._id}`);
        fetchMovies();
        fetchStats();
      } catch (err) {
        alert(err.response?.data?.message || 'Delete failed');
      }
    }
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { status: statusModal.targetStatus };
      if (statusModal.targetStatus === 'Watched' || statusModal.movie.status === 'Watched') {
        payload.rating = statusModal.rating;
      }
      await axios.patch(`${API_BASE}/${statusModal.movie._id}/status`, payload);
      setStatusModal({ open: false, movie: null, targetStatus: '', rating: 5 });
      fetchMovies();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || 'Status update failed');
    }
  };

  const getValidTransitions = (currentStatus) => {
    if (currentStatus === 'To Watch') return ['Watching', 'Watched'];
    if (currentStatus === 'Watching') return ['Watched', 'To Watch'];
    return [];
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1><Film className="icon" /> Movie Watchlist Manager</h1>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={handleWatchNext}>
            <Sparkles className="icon" /> What to Watch Next?
          </button>
          <button className="btn btn-primary" onClick={() => { resetForm(); setIsModalOpen(true); }}>
            <PlusCircle className="icon" /> Add Movie
          </button>
        </div>
      </header>

      {watchNext && (
        <div className="watch-next-banner">
          <h3><Sparkles /> Recommended Next Watch:</h3>
          <p><strong>{watchNext.title}</strong> ({watchNext.releaseYear}) | Priority: {watchNext.priority} | Runtime: {watchNext.runtime} mins | Genre: {watchNext.genre}</p>
          <button className="btn-close" onClick={() => setWatchNext(null)}>X</button>
        </div>
      )}

      <section className="stats-grid">
        <div className="stat-card">
          <h3>Status Breakdown</h3>
          <p>To Watch: {stats.statusCounts['To Watch']} | Watching: {stats.statusCounts.Watching} | Watched: {stats.statusCounts.Watched}</p>
        </div>
        <div className="stat-card">
          <h3>Total Time Watched</h3>
          <p><Clock className="icon" /> {stats.totalHoursWatched} Hours</p>
        </div>
        <div className="stat-card">
          <h3>Average Rating</h3>
          <p><Star className="icon" /> {stats.avgRating} / 10</p>
        </div>
        <div className="stat-card">
          <h3>Top Watched Genre</h3>
          <p>{stats.topGenre}</p>
        </div>
      </section>

      <section className="filter-section">
        <input 
          type="text" 
          placeholder="Search by title..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="To Watch">To Watch</option>
          <option value="Watching">Watching</option>
          <option value="Watched">Watched</option>
        </select>
        <select value={genreFilter} onChange={(e) => setGenreFilter(e.target.value)}>
          <option value="">All Genres</option>
          {['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Romance', 'Thriller'].map(g => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </section>

      <section className="movies-grid">
        {movies.map(movie => (
          <div key={movie._id} className="movie-card">
            <div className="card-header">
              <span className="code">{movie.movieCode}</span>
              <span className={`badge status-${movie.status.replace(/\s+/g, '-').toLowerCase()}`}>
                {movie.status}
              </span>
            </div>
            <h2>{movie.title} ({movie.releaseYear})</h2>
            <div className="card-details">
              <p><strong>Genre:</strong> {movie.genre}</p>
              <p><strong>Platform:</strong> {movie.platform}</p>
              <p><strong>Runtime:</strong> {movie.runtime} mins</p>
              <p><strong>Priority:</strong> {movie.priority}/5</p>
              {movie.rating && <p className="rating"><Star className="icon" /> {movie.rating}/10</p>}
            </div>

            <div className="card-actions">
              {movie.status !== 'Watched' && (
                <select 
                  onChange={(e) => {
                    if (e.target.value) {
                      setStatusModal({
                        open: true,
                        movie,
                        targetStatus: e.target.value,
                        rating: movie.rating || 5
                      });
                    }
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>Change Status</option>
                  {getValidTransitions(movie.status).map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              )}

              {movie.status === 'Watched' && (
                <button className="btn btn-sm" onClick={() => setStatusModal({ open: true, movie, targetStatus: 'Watched', rating: movie.rating || 5 })}>
                  Edit Rating
                </button>
              )}

              <button className="btn btn-icon" onClick={() => openEdit(movie)}>
                <Edit size={16} />
              </button>

              <button 
                className="btn btn-icon btn-danger" 
                disabled={movie.status === 'Watching'} 
                onClick={() => handleDelete(movie)}
                title={movie.status === 'Watching' ? "Cannot delete while Watching" : "Delete Movie"}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </section>

      <div className="pagination">
        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
        <span>Page {page} of {totalPages}</span>
        <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{editingMovie ? 'Edit Movie' : 'Add New Movie'}</h2>
            {errorMessage && <div className="error-box"><AlertCircle size={16} /> {errorMessage}</div>}
            <form onSubmit={handleFormSubmit}>
              <label>Title</label>
              <input type="text" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />

              <label>Genre</label>
              <select value={formData.genre} onChange={e => setFormData({ ...formData, genre: e.target.value })}>
                {['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Romance', 'Thriller'].map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>

              {!editingMovie && (
                <>
                  <label>Release Year (1950 - {new Date().getFullYear()})</label>
                  <input type="number" min="1950" max={new Date().getFullYear()} required value={formData.releaseYear} onChange={e => setFormData({ ...formData, releaseYear: e.target.value })} />
                </>
              )}

              <label>Runtime (30 - 300 mins)</label>
              <input type="number" min="30" max="300" required value={formData.runtime} onChange={e => setFormData({ ...formData, runtime: e.target.value })} />

              <label>Platform</label>
              <select value={formData.platform} onChange={e => setFormData({ ...formData, platform: e.target.value })}>
                {['Netflix', 'Prime Video', 'Hotstar', 'Theatre', 'Other'].map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>

              <label>Priority (1 to 5)</label>
              <input type="number" min="1" max="5" required value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })} />

              <div className="modal-buttons">
                <button type="submit" className="btn btn-primary">Save</button>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {statusModal.open && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Update Status / Rating</h2>
            <p>Movie: <strong>{statusModal.movie.title}</strong></p>
            <form onSubmit={handleStatusSubmit}>
              {(statusModal.targetStatus === 'Watched' || statusModal.movie.status === 'Watched') && (
                <div>
                  <label>Rating (1 to 10 mandatory):</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="10" 
                    required 
                    value={statusModal.rating} 
                    onChange={e => setStatusModal({ ...statusModal, rating: e.target.value })} 
                  />
                </div>
              )}
              <div className="modal-buttons">
                <button type="submit" className="btn btn-primary"><CheckCircle size={16}/> Submit</button>
                <button type="button" className="btn btn-secondary" onClick={() => setStatusModal({ open: false, movie: null, targetStatus: '', rating: 5 })}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;