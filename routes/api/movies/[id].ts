import { Handlers } from "$fresh/server.ts";
import { readMovies, writeMovies } from "../../../database.ts";

export const handler: Handlers = {
  async PUT(req, ctx) {
    const { id } = ctx.params;
    const { title, genre } = await req.json();
     console.log(title, genre);
    const movies = await readMovies();
    const index = movies.findIndex((movie) => movie.id === id);

    if (index === -1) {
      return new Response(
        JSON.stringify({ error: "Movie not found" }),
        { status: 404 },
      );
    }

    movies[index] = { ...movies[index], title, genre };
    await writeMovies(movies);

    return new Response(
      JSON.stringify({ message: "Successfully updated movie" }),
      { status: 200 },
    );
  },

  async DELETE(_req, ctx) {
    const { id } = ctx.params; 
    let movies = await readMovies();
    const initialLength = movies.length;
    movies = movies.filter((movie) => movie.id !== id);

    if (movies.length === initialLength) {
      return new Response(
        JSON.stringify({ error: "Movie not found." }),
        { status: 404 },
      );
    }
    await writeMovies(movies);
    return new Response(
      JSON.stringify({ message: "Successfully removed movie." }),
      { status: 200 },
    );
  },
};