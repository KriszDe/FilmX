import Image from "next/image";
import Link from "next/link";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

const headers = {
  Authorization: `Bearer ${process.env.TMDB_BEARER_TOKEN}`,
  accept: "application/json",
};

type TMDBGenre = {
  id: number;
  name: string;
};

type TMDBMovie = {
  id: number;
  title?: string;
  poster_path: string | null;
  overview?: string;
  release_date?: string;
  vote_average?: number;
};

type GenreResponse = {
  genres: TMDBGenre[];
};

type MovieResponse = {
  results: TMDBMovie[];
};

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    page?: string;
  }>;
};

const categoryMap: Record<string, string> = {
  akcio: "Akció",
  vigjatek: "Vígjáték",
  thriller: "Thriller",
  horror: "Horror",
  kaland: "Kaland",
  animacio: "Animáció",
  krimi: "Krimi",
  "sci-fi": "Sci-fi",
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

async function getGenres() {
  return tmdbFetch<GenreResponse>("/genre/movie/list?language=hu-HU");
}

async function getMoviesByGenre(genreId: number, page = 1) {
  return tmdbFetch<MovieResponse>(
    `/discover/movie?language=hu-HU&sort_by=popularity.desc&include_adult=false&include_video=false&page=${page}&with_genres=${genreId}`
  );
}

function buildImageUrl(path: string | null) {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/w500${path}`;
}

function getYear(movie: TMDBMovie) {
  return movie.release_date ? movie.release_date.slice(0, 4) : "N/A";
}

function Pager({
  currentPage,
  slug,
}: {
  currentPage: number;
  slug: string;
}) {
  const prevPage = currentPage > 1 ? currentPage - 1 : 1;
  const nextPage = currentPage + 1;

  return (
    <div className="flex items-center justify-center gap-3 py-10">
      <Link
        href={`/kategoriak/${slug}?page=${prevPage}`}
        className="rounded-lg bg-[#162033] px-4 py-2 text-sm text-white/80 hover:bg-[#2563eb]"
      >
        Előző
      </Link>

      <span className="rounded-lg border border-white/10 bg-[#0f172a] px-4 py-2 text-sm text-white">
        {currentPage}. oldal
      </span>

      <Link
        href={`/kategoriak/${slug}?page=${nextPage}`}
        className="rounded-lg bg-[#162033] px-4 py-2 text-sm text-white/80 hover:bg-[#2563eb]"
      >
        Következő
      </Link>
    </div>
  );
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const currentPage = Math.max(Number((await searchParams)?.page || 1), 1);

  const categoryName = categoryMap[slug];

  if (!categoryName) {
    return (
      <main className="min-h-screen bg-[#0f172a] px-5 py-20 text-white md:px-10 xl:px-[120px]">
        <h1 className="text-3xl font-bold">Nincs ilyen kategória</h1>
        <Link href="/" className="mt-6 inline-block text-[#60a5fa]">
          Vissza a főoldalra
        </Link>
      </main>
    );
  }

  const genreData = await getGenres();
  const genre = genreData.genres.find(
    (g) => g.name.toLowerCase() === categoryName.toLowerCase()
  );

  if (!genre) {
    return (
      <main className="min-h-screen bg-[#0f172a] px-5 py-20 text-white md:px-10 xl:px-[120px]">
        <h1 className="text-3xl font-bold">A kategória nem található</h1>
        <Link href="/" className="mt-6 inline-block text-[#60a5fa]">
          Vissza a főoldalra
        </Link>
      </main>
    );
  }

  const movieData = await getMoviesByGenre(genre.id, currentPage);

  return (
    <main className="min-h-screen bg-[#0f172a] text-[#e5e7eb]">
      <header className="sticky top-0 z-50 border-b border-[#22304a] bg-[#0f172a]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1920px] items-center justify-between px-5 py-5 md:px-10 xl:px-[120px]">
          <Link href="/" className="text-2xl font-black tracking-tight text-white">
            Film<span className="text-[#3b82f6]">X</span>
          </Link>

          <nav className="flex items-center gap-6 text-sm text-white/75">
            <Link href="/" className="hover:text-[#60a5fa]">
              Főoldal
            </Link>
            <Link href="/#category" className="hover:text-[#60a5fa]">
              Kategóriák
            </Link>
          </nav>
        </div>
      </header>

      <section className="px-5 py-10 md:px-10 xl:px-[120px]">
        <div className="mb-8">
          <div className="text-sm uppercase tracking-[0.2em] text-[#60a5fa]">
            Kategória
          </div>
          <h1 className="mt-3 text-4xl font-bold text-white md:text-5xl">
            {categoryName}
          </h1>
          <p className="mt-3 text-white/60">
            Az összes {categoryName.toLowerCase()} film.
          </p>
        </div>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-6 md:gap-8">
          {movieData.results
            .filter((movie) => movie.poster_path)
            .map((movie) => {
              const imageUrl = buildImageUrl(movie.poster_path);

              return (
                <article key={movie.id} className="group cursor-pointer">
                  <div className="relative mb-4 h-[250px] overflow-hidden rounded-2xl">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={movie.title || "Film"}
                        fill
                        unoptimized
                        className="object-cover transition duration-500 group-hover:scale-110"
                      />
                    ) : null}

                    <div className="absolute right-4 top-4 rounded-xl bg-[#162033cc] px-2.5 py-2 text-xs text-white">
                      ★ {movie.vote_average ? movie.vote_average.toFixed(1) : "-"}
                    </div>
                  </div>

                  <h3 className="mb-1 text-center text-base font-medium text-white group-hover:text-[#60a5fa]">
                    {movie.title || "Ismeretlen cím"}
                  </h3>

                  <div className="text-center text-xs text-[#cbd5e1]">
                    {categoryName} • {getYear(movie)}
                  </div>
                </article>
              );
            })}
        </div>

        <Pager currentPage={currentPage} slug={slug} />
      </section>
    </main>
  );
}