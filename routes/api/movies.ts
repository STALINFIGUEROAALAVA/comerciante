import { Movie, readMovies, writeMovies } from "../../database.ts";
import { ulid } from "https://deno.land/x/ulid@v0.2.2/mod.ts";

export const handler = {
  async GET(_req: Request): Promise<Response> {
    const movies = await readMovies();
    return Response.json(movies);
  },

  async POST(req: Request): Promise<Response> {
    const { title, genre } = await req.json();
    if (!title || !genre) {
      return new Response("Title and genre are required", { status: 400 });
    }
    const movies = await readMovies();
    const newMovie: Movie = {
      id: ulid(),
      title,
      genre,
    };
    movies.push(newMovie);
    await writeMovies(movies);
    return new Response("Movie created successfully!", { status: 201 });
  },
};