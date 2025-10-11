import { useState } from "preact/hooks";
import { Movie } from "../database.ts";
import MovieForm from "./MovieForm.tsx";

interface Props {
  initialMovies: Movie[];
}
export default function MovieList({ initialMovies }: Props) {
  const [movies, setMovies] = useState(initialMovies);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);

  const handleDelete = async (id: string) => {
    if (confirm("¿Are you sure you want to delete this movie?")) {
      const response = await fetch(`/api/movies/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setMovies(movies.filter((movie) => movie.id !== id));
      } else {
        alert("Error deleting movie.");
      }
    }
  };

  const handleEdit = (movie: Movie) => {
    setEditingMovie(movie);
  };

  const updateMovieList = async () => {
    const resp = await fetch(`/api/movies`);
    const newMovies = await resp.json();
    setMovies(newMovies);
  };

  return (
    <div class="p-8 mx-auto max-w-screen-md">
      <h4 class="text-3xl font-semibold text-gray-900 dark:text-gray-100">
        Comerciante. Su asistente en el Negocio.
      </h4>
      <MovieForm
        movieToEdit={editingMovie}
        setEditingMovie={setEditingMovie}
        onSave={updateMovieList}
      />
      {movies.length > 0
        ? (
          <ul class="space-y-4">
            {movies.map((movie) => (
              <li
                key={movie.id}
                class="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 flex justify-between items-center transition-colors"
              >
                <div>
                  <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {movie.title}
                  </h2>
                  <p class="text-gray-600 dark:text-gray-400">
                    Genre: {movie.genre}
                  </p>
                </div>
                <div class="space-x-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(movie)}
                    class="bg-slate-400 hover:bg-slate-500 dark:bg-slate-500 dark:hover:bg-slate-600 text-white font-bold py-1 px-2 rounded text-sm transition-colors"
                  >
                   Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(movie.id)}
                    class="bg-pink-400 hover:bg-pink-500 dark:bg-pink-500 dark:hover:bg-pink-600 text-white font-bold py-1 px-2 rounded text-sm transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )
        : (
          <p class="text-gray-600 dark:text-gray-400 text-center py-8">
            There are no movies to show.
          </p>
        )}
    </div>
  );
}