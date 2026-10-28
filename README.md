# 🎬 Movie Watchlist Manager (MERN Stack)

A full-stack Movie Watchlist Manager web application built for the MERN stack exam. It allows movie enthusiasts to plan what to watch, track progress, manage ratings, view statistics, and ensure strict status/validation workflows.

---

## 🛠️ Tech Stack
- **Frontend:** React.js, Lucide Icons, Custom CSS (Cinema Dark Dashboard Theme)
- **Backend:** Node.js, Express.js
- **Database:** MongoDB Atlas (Mongoose)

---

## 🔌 API Endpoints Created

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/api/movies` | Get all movies (supports filtering by status/genre, title search, pagination, and sorting) |
| **POST** | `/api/movies` | Add a new movie with server-side validations & auto-generated movie code |
| **PUT** | `/api/movies/:id` | Update movie details or transition status (with strict workflow & rating checks) |
| **DELETE** | `/api/movies/:id` | Delete a movie (restricted if status is `Watching`) |
| **GET** | `/api/movies/watch-next` | Get the recommended highest-priority `To Watch` movie |
| **GET** | `/api/movies/stats` | Get dashboard aggregations (status counts, hours watched, average rating, top genre) |

---

## 📸 Application Screenshots

*(Placeholder note: Ensure you take 2 screenshots of your working app—e.g., the Dashboard view and the Add Movie modal/Watch Next banner—and place them in an `assets/` folder or drag-and-drop them directly into your GitHub README file)*

### 1. Dashboard & Statistics Overview
![Dashboard View](./assets/dashboard-screenshot.png)

### 2. Add Movie & Watch Next Recommendations
![Watch Next & Modal](./assets/watchnext-screenshot.png)

---

## 🚀 Getting Started Locally

1. Clone the repository:
   ```bash
   git clone [https://github.com/Devika-KJ/movie-watchlist-app.git](https://github.com/Devika-KJ/movie-watchlist-app.git)