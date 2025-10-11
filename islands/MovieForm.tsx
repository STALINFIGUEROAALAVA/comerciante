import { useEffect, useState } from "preact/hooks";
import { Movie } from "../database.ts";
import { JSX } from "preact";

interface Props {
  movieToEdit?: Movie | null;
  setEditingMovie?: (movie: Movie | null) => void;
  onSave: () => void;
}

export default function MovieForm(
  { movieToEdit, setEditingMovie, onSave }: Props,
) {
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");

  useEffect(() => {
    if (movieToEdit) {
      setTitle(movieToEdit.title);
      setGenre(movieToEdit.genre);
    } else {
      setTitle("");
      setGenre("");
    }
  }, [movieToEdit]);

  const handleSubmit = async (e: JSX.TargetedEvent<HTMLFormElement, Event>) => {
    e.preventDefault();
    if (!title || !genre) {
      alert("Title and genre are required.");
      return;
    }

    const method = movieToEdit ? "PUT" : "POST";
    const url = movieToEdit ? `/api/movies/${movieToEdit.id}` : "/api/movies";

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, genre }),
    });

    if (response.ok) {
      if (setEditingMovie) {
        setEditingMovie(null);
      }
      onSave();
      setTitle("");
      setGenre("");
    } else {
      alert("Error saving movie.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 mt-8 transition-colors"
    >
      <h2 class="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
        {movieToEdit ? "Edit Movie" : "Add New Movie"}
      </h2>
      <div class="mb-4">
        <label
          for="title"
          class="block text-gray-700 dark:text-gray-300 font-bold mb-2"
        >
          Title
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onInput={(e) => setTitle(e.currentTarget.value)}
          class="shadow appearance-none border border-gray-300 dark:border-gray-600 rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
          placeholder="Title of the movie"
        />
      </div>

      <div class="mb-6">
        <label
          for="genre"
          class="block text-gray-700 dark:text-gray-300 font-bold mb-2"
        >
          Genre
        </label>
        <input
          type="text"
          id="genre"
          value={genre}
          onInput={(e) => setGenre(e.currentTarget.value)}
          class="shadow appearance-none border border-gray-300 dark:border-gray-600 rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
          placeholder="Genre of the movie"
        />
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          type="submit"
          class="bg-purple-500 hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
        >
          {movieToEdit ? "Update" : "Add"}
        </button>

        {movieToEdit && (
          <button
            type="button"
            onClick={() => setEditingMovie && setEditingMovie(null)}
            class="bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}