import { join } from "$std/path/mod.ts";
const DB_PATH = join(Deno.cwd(), "db.json");

export interface Movie {
    id:string,
    title:string,
    genre:string;
}

export async function readMovies(): Promise<Movie[]> {
    try {
        const data = await Deno.readTextFile(DB_PATH);
        const movies = JSON.parse(data);
        return movies as Movie[];
    } catch (error) {
        if (error instanceof Deno.errors.NotFound) {
            return [];
        }
        throw error;
    }
}

export async function writeMovies(movies:Movie[]): Promise<void> {
    const data = JSON.stringify(movies, null, 2);
    await Deno.writeTextFile(DB_PATH, data);
}