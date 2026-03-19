const TMDB_BASE_URL = "https://api.themoviedb.org/3";

const headers = {
  Authorization: `Bearer ${process.env.TMDB_BEARER_TOKEN}`,
  accept: "application/json",
};

type Movie = {
  id: number;
  title: string;
  poster_path: string | null;
};

type ConfigResponse = {
  images: {
    secure_base_url: string;
    poster_sizes: string[];
  };
};

async function tmdbFetch<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${TMDB_BASE_URL}${endpoint}`, {
    headers,
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`TMDB hiba: ${res.status}`);
  }

  return res.json();
}

export async function getImageConfig() {
  const data = await tmdbFetch<ConfigResponse>("/configuration");
  return data.images;
}

export async function getPopularMovies(page = 1) {
  const data = await tmdbFetch<{ results: Movie[] }>(
    `/movie/popular?language=hu-HU&page=${page}`
  );
  return data.results;
}

export function buildPosterUrl(
  baseUrl: string,
  size: string,
  posterPath: string | null
) {
  if (!posterPath) return null;
  return `${baseUrl}${size}${posterPath}`;
}