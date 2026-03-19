"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  XCircle,
  LogIn,
  Menu,
  PlayCircle,
  Star,
  Bookmark,
  Film,
  Calendar,
  Clock3,
} from "lucide-react";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

type CatalogItem = {
  id: number;
  title: string;
  image: string;
  backdrop?: string;
  genre: string;
  year: string;
  rating: string;
  overview?: string;
  rawDate?: string;
};

type Category = {
  name: string;
  slug: string;
  total: number;
  image: string;
};

type TMDBGenre = {
  id: number;
  name: string;
};

type TMDBMovie = {
  id: number;
  title?: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  overview?: string;
  release_date?: string;
  vote_average?: number;
  genre_ids?: number[];
};

function buildImageUrl(
  path: string | null,
  size: "poster" | "backdrop" = "poster"
) {
  if (!path) {
    return size === "poster"
      ? "https://placehold.co/500x750/0f172a/e5e7eb?text=FilmX"
      : "https://placehold.co/1280x720/0f172a/e5e7eb?text=FilmX";
  }

  return size === "poster"
    ? `${TMDB_IMAGE_BASE}${path}`
    : `https://image.tmdb.org/t/p/w1280${path}`;
}

function getYear(date?: string) {
  return date ? date.slice(0, 4) : "N/A";
}

function mapGenres(
  genreIds: number[] | undefined,
  genreMap: Record<number, string>
) {
  if (!genreIds || genreIds.length === 0) return "Ismeretlen";
  return genreIds
    .slice(0, 2)
    .map((id) => genreMap[id])
    .filter(Boolean)
    .join("/");
}

const categories: Category[] = [
  {
    name: "Akció",
    slug: "akcio",
    total: 100,
    image: "https://i.postimg.cc/JzfWFmfC/action.jpg",
  },
  {
    name: "Vígjáték",
    slug: "vigjatek",
    total: 50,
    image: "https://i.postimg.cc/CKpxqjL8/comedy.jpg",
  },
  {
    name: "Thriller",
    slug: "thriller",
    total: 20,
    image: "https://i.postimg.cc/3rfrBMxY/thriller.webp",
  },
  {
    name: "Horror",
    slug: "horror",
    total: 80,
    image: "https://i.postimg.cc/HkXpdV4k/horror.jpg",
  },
  {
    name: "Kaland",
    slug: "kaland",
    total: 100,
    image: "https://i.postimg.cc/qRRVhRnn/adventure.jpg",
  },
  {
    name: "Animáció",
    slug: "animacio",
    total: 50,
    image: "https://i.postimg.cc/15pmZ8K5/animated.jpg",
  },
  {
    name: "Krimi",
    slug: "krimi",
    total: 20,
    image: "https://i.postimg.cc/XvX6Xq95/crime.jpg",
  },
  {
    name: "Sci-fi",
    slug: "sci-fi",
    total: 80,
    image: "https://i.postimg.cc/8568BYKP/sci-fi.jpg",
  },
];

export default function Page() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("összes műfaj");
  const [year, setYear] = useState("összes év");
  const [sortType, setSortType] = useState<"kiemelt" | "népszerű" | "legújabb">(
    "népszerű"
  );
  const [visibleCount, setVisibleCount] = useState(20);
  const [movies, setMovies] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadContent() {
      try {
        setLoading(true);

        const token = process.env.NEXT_PUBLIC_TMDB_BEARER_TOKEN;

        if (!token) {
          console.error("Hiányzik a NEXT_PUBLIC_TMDB_BEARER_TOKEN");
          setMovies([]);
          setLoading(false);
          return;
        }

        const authHeaders = {
          Authorization: `Bearer ${token}`,
          accept: "application/json",
        };

        const [movieGenresRes, popular1, popular2, popular3, topRated1] =
          await Promise.all([
            fetch(`${TMDB_BASE_URL}/genre/movie/list?language=hu-HU`, {
              headers: authHeaders,
            }).then((r) => r.json()),
            fetch(`${TMDB_BASE_URL}/movie/popular?language=hu-HU&page=1`, {
              headers: authHeaders,
            }).then((r) => r.json()),
            fetch(`${TMDB_BASE_URL}/movie/popular?language=hu-HU&page=2`, {
              headers: authHeaders,
            }).then((r) => r.json()),
            fetch(`${TMDB_BASE_URL}/movie/popular?language=hu-HU&page=3`, {
              headers: authHeaders,
            }).then((r) => r.json()),
            fetch(`${TMDB_BASE_URL}/movie/top_rated?language=hu-HU&page=1`, {
              headers: authHeaders,
            }).then((r) => r.json()),
          ]);

        const movieGenres = Array.isArray(movieGenresRes?.genres)
          ? (movieGenresRes.genres as TMDBGenre[])
          : [];

        const movieGenreMap: Record<number, string> = {};
        movieGenres.forEach((g) => {
          movieGenreMap[g.id] = g.name;
        });

        const allMovies = [
          ...((popular1?.results as TMDBMovie[]) || []),
          ...((popular2?.results as TMDBMovie[]) || []),
          ...((popular3?.results as TMDBMovie[]) || []),
          ...((topRated1?.results as TMDBMovie[]) || []),
        ];

        const uniqueMap = new Map<number, TMDBMovie>();
        allMovies.forEach((movie) => {
          if (!uniqueMap.has(movie.id)) uniqueMap.set(movie.id, movie);
        });

        const normalizedMovies: CatalogItem[] = Array.from(uniqueMap.values())
          .filter((item) => item?.poster_path || item?.backdrop_path)
          .map((item) => ({
            id: item.id,
            title: item.title || "Ismeretlen film",
            image: buildImageUrl(item.poster_path ?? null, "poster"),
            backdrop: buildImageUrl(item.backdrop_path ?? null, "backdrop"),
            genre: mapGenres(item.genre_ids, movieGenreMap),
            year: getYear(item.release_date),
            rating: item.vote_average ? item.vote_average.toFixed(1) : "0.0",
            overview: item.overview,
            rawDate: item.release_date,
          }));

        setMovies(normalizedMovies);
      } catch (error) {
        console.error("TMDB betöltési hiba:", error);
        setMovies([]);
      } finally {
        setLoading(false);
      }
    }

    loadContent();
  }, []);

  const filteredMovies = useMemo(() => {
    let result = [...movies];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (movie) =>
          movie.title.toLowerCase().includes(q) ||
          movie.genre.toLowerCase().includes(q)
      );
    }

    if (genre !== "összes műfaj") {
      result = result.filter((movie) =>
        movie.genre.toLowerCase().includes(genre.toLowerCase())
      );
    }

    if (year !== "összes év") {
      result = result.filter((movie) => {
        const y = Number(movie.year);

        if (year === "2024") return y === 2024;
        if (year === "2020-2023") return y >= 2020 && y <= 2023;
        if (year === "2010-2019") return y >= 2010 && y <= 2019;
        if (year === "2000-2009") return y >= 2000 && y <= 2009;
        if (year === "1980-1999") return y >= 1980 && y <= 1999;
        return true;
      });
    }

    if (sortType === "népszerű") {
      result.sort((a, b) => Number(b.rating) - Number(a.rating));
    }

    if (sortType === "legújabb") {
      result.sort((a, b) => {
        const aTime = a.rawDate ? new Date(a.rawDate).getTime() : 0;
        const bTime = b.rawDate ? new Date(b.rawDate).getTime() : 0;
        return bTime - aTime;
      });
    }

    return result;
  }, [movies, search, genre, year, sortType]);

  const visibleMovies = filteredMovies.slice(0, visibleCount);
  const heroMovie = filteredMovies[0] || movies[0];

  return (
    <main className="min-h-screen bg-[#0f172a] text-[#e5e7eb]">
      <div className="mx-auto max-w-[1920px]">
        <header className="sticky top-0 z-50 border-b border-[#22304a] bg-[#0f172a]/95 backdrop-blur-md">
          <div className="mx-auto flex h-20 items-center justify-between px-5 md:px-10 xl:px-[120px]">
            <div className="flex items-center gap-4 md:gap-8">
              <button
                type="button"
                onClick={() => setMobileNavOpen((v) => !v)}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#22304a] bg-[#162033] xl:hidden"
              >
                <Menu className="h-5 w-5 text-[#60a5fa]" />
              </button>

              <a href="#" className="shrink-0">
                <div className="text-2xl font-black tracking-tight text-white">
                  Film<span className="text-[#3b82f6]">X</span>
                </div>
              </a>

              <nav className="hidden xl:block">
                <ul className="flex items-center gap-10">
                  <li>
                    <a href="#" className="text-sm font-medium hover:text-[#60a5fa]">
                      Főoldal
                    </a>
                  </li>
                  <li>
                    <a
                      href="#category"
                      className="text-sm font-medium hover:text-[#60a5fa]"
                    >
                      Kategóriák
                    </a>
                  </li>
                </ul>
              </nav>
            </div>

            <div className="flex items-center gap-3 md:gap-4">
              <form
                className={`${
                  searchOpen ? "flex" : "hidden"
                } absolute left-5 right-5 top-full mt-3 rounded-2xl border border-[#22304a] bg-[#162033] p-2 shadow-2xl xl:static xl:mt-0 xl:flex xl:w-[340px] xl:items-center xl:border-0 xl:bg-transparent xl:p-0 xl:shadow-none`}
                onSubmit={(e) => e.preventDefault()}
              >
                <div className="relative w-full">
                  <input
                    type="text"
                    name="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Mit keresel?"
                    className="w-full rounded-2xl bg-[#162033] px-4 py-3 pr-20 text-sm font-medium text-white outline-none placeholder:text-[#cbd5e1]"
                  />
                  <button
                    type="submit"
                    className="absolute right-12 top-1/2 -translate-y-1/2"
                  >
                    <Search className="h-5 w-5 text-[#60a5fa]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSearchOpen(false)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 xl:hidden"
                  >
                    <XCircle className="h-5 w-5 text-[#60a5fa]" />
                  </button>
                </div>
              </form>

              <button
                type="button"
                onClick={() => setSearchOpen((v) => !v)}
                className="xl:hidden"
              >
                <Search className="h-5 w-5 text-[#60a5fa]" />
              </button>

              <a href="#" className="hidden items-center gap-2 text-sm xl:flex">
                <span>Belépés</span>
                <LogIn className="h-5 w-5 text-[#60a5fa]" />
              </a>
            </div>
          </div>

          {mobileNavOpen && (
            <nav className="border-t border-[#22304a] bg-[#111b2d] px-5 py-5 xl:hidden">
              <ul className="space-y-5">
                <li>
                  <a href="#" className="text-sm font-medium hover:text-[#60a5fa]">
                    Főoldal
                  </a>
                </li>
                <li>
                  <a
                    href="#category"
                    className="text-sm font-medium hover:text-[#60a5fa]"
                  >
                    Kategóriák
                  </a>
                </li>
              </ul>
            </nav>
          )}
        </header>

        <section className="mb-14 px-5 pt-8 md:px-10 xl:px-[120px]">
          <div className="relative h-[280px] overflow-hidden rounded-[20px] md:h-[430px]">
            <Image
              src={
                heroMovie?.backdrop ||
                heroMovie?.image ||
                "https://image.tmdb.org/t/p/w1280/7P8x0q1F9N3K5Aqj8QxjG9mGf3T.jpg"
              }
              alt={heroMovie?.title || "Legjobb tartalom"}
              fill
              unoptimized
              className="object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-r from-[#020817]/95 via-[#020817]/70 to-[#020817]/30" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

            <div className="absolute bottom-6 left-6 right-6 md:bottom-12 md:left-12 md:right-12">
              <div className="mb-4 flex flex-wrap items-center gap-3 md:gap-5">
                <div className="flex items-center gap-2">
                  <Film className="h-4 w-4 text-[#3b82f6]" />
                  <span className="text-xs font-semibold md:text-sm">
                    {heroMovie?.genre || "Film"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#3b82f6]" />
                  <span className="text-xs font-semibold md:text-sm">
                    {heroMovie?.year || "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-[#3b82f6]" />
                  <span className="text-xs font-semibold md:text-sm">
                    Legjobb tartalom
                  </span>
                </div>
                <div className="rounded bg-[#2563eb] px-2 py-1 text-xs font-bold uppercase text-white">
                  FILM
                </div>
              </div>

              <h1 className="max-w-4xl text-2xl font-bold text-white drop-shadow md:text-5xl">
                {heroMovie?.title || "Legjobb tartalom"}
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/70 md:text-base">
                {heroMovie?.overview || "Kiemelt film a FilmX főoldalán."}
              </p>
            </div>
          </div>
        </section>

        <section className="mb-14 px-5 md:px-10 xl:px-[120px]">
          <div className="mb-5 text-2xl font-semibold text-white md:text-3xl">
            Összes film
          </div>

          <div className="mb-8 rounded-[20px] bg-[#162033] p-5 md:flex md:items-center md:justify-between">
            <div className="mb-5 flex flex-col gap-4 md:mb-0 md:flex-row">
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="rounded-xl bg-[#0f172a] px-4 py-3 text-sm text-white outline-none"
              >
                <option value="összes műfaj">Összes műfaj</option>
                <option value="akció">Akció</option>
                <option value="kaland">Kaland</option>
                <option value="animáció">Animáció</option>
                <option value="dráma">Dráma</option>
                <option value="fantasy">Fantasy</option>
                <option value="horror">Horror</option>
                <option value="sci-fi">Sci-fi</option>
                <option value="háborús">Háborús</option>
                <option value="vígjáték">Vígjáték</option>
                <option value="krimi">Krimi</option>
                <option value="thriller">Thriller</option>
              </select>

              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="rounded-xl bg-[#0f172a] px-4 py-3 text-sm text-white outline-none"
              >
                <option value="összes év">Összes év</option>
                <option value="2024">2024</option>
                <option value="2020-2023">2020-2023</option>
                <option value="2010-2019">2010-2019</option>
                <option value="2000-2009">2000-2009</option>
                <option value="1980-1999">1980-1999</option>
              </select>
            </div>

            <div className="inline-flex rounded-2xl bg-[#0f172a] p-2">
              {(["kiemelt", "népszerű", "legújabb"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setSortType(item)}
                  className={`rounded-xl px-4 py-2 text-sm font-medium ${
                    sortType === item
                      ? "bg-[#162033] text-[#60a5fa]"
                      : "text-white/75 hover:text-white"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center text-white/60">Betöltés...</div>
          ) : (
            <>
              <div className="mb-10 grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-6 md:gap-8">
                {visibleMovies.map((movie) => (
                  <article key={movie.id} className="group cursor-pointer">
                    <div className="relative mb-4 h-[250px] overflow-hidden rounded-2xl">
                      <Image
                        src={movie.image}
                        alt={movie.title}
                        fill
                        unoptimized
                        className="object-cover transition duration-500 group-hover:scale-110"
                      />

                      <div className="absolute inset-0 bg-black/10 opacity-0 backdrop-blur-[2px] transition group-hover:opacity-100" />

                      <div className="absolute left-4 top-4 rounded-xl bg-[#162033] p-2 text-[#60a5fa] opacity-0 transition group-hover:opacity-100">
                        <Bookmark className="h-4 w-4" />
                      </div>

                      <div className="absolute right-4 top-4 flex items-center gap-1 rounded-xl bg-[#162033cc] px-2.5 py-2 text-xs text-white opacity-0 transition group-hover:opacity-100">
                        <Star className="h-4 w-4 text-[#60a5fa]" />
                        <span>{movie.rating}</span>
                      </div>

                      <div className="absolute left-3 bottom-3 rounded-lg bg-[#0f172acc] px-2.5 py-1 text-[11px] text-white">
                        Film
                      </div>

                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 transition group-hover:opacity-100">
                        <PlayCircle className="h-14 w-14 text-white" />
                      </div>
                    </div>

                    <h3 className="mb-1 text-center text-base font-medium text-white group-hover:text-[#60a5fa]">
                      {movie.title}
                    </h3>

                    <div className="flex items-center justify-center gap-3 text-center text-xs text-[#cbd5e1]">
                      <span>{movie.genre}</span>
                      <span>{movie.year}</span>
                    </div>
                  </article>
                ))}
              </div>

              {visibleCount < filteredMovies.length && (
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + 20)}
                  className="mx-auto block rounded-2xl bg-[#162033] px-8 py-4 text-sm font-medium text-white transition hover:bg-[#2563eb]"
                >
                  TOVÁBBI FILMEK BETÖLTÉSE
                </button>
              )}
            </>
          )}
        </section>

        <section id="category" className="mb-14 px-5 md:px-10 xl:px-[120px]">
          <h2 className="mb-12 text-3xl font-medium text-white md:text-[40px]">
            Kategóriák
          </h2>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/kategoriak/${category.slug}`}
                className="group relative block h-[150px] cursor-pointer overflow-hidden rounded-[20px]"
              >
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  unoptimized
                  className="object-cover transition duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute bottom-5 left-5 text-xl text-white group-hover:text-[#60a5fa]">
                  {category.name}
                </div>
                <div className="absolute bottom-5 right-5 rounded-lg bg-[#162033cc] px-2.5 py-1.5 text-sm text-white">
                  {category.total}
                </div>
              </Link>
            ))}
          </div>
        </section>

        <footer className="bg-[#111827] px-5 pb-10 pt-16 md:px-10 xl:px-[120px]">
          <div className="mb-14 flex flex-col gap-10 border-b border-[#22304a] pb-14 xl:flex-row xl:justify-between">
            <div className="max-w-[280px]">
              <div className="mb-6 text-2xl font-black tracking-tight text-white">
                Film<span className="text-[#3b82f6]">X</span>
              </div>

              <p className="mb-5 text-sm leading-6 text-[#cbd5e1]">
                Filmek és sorozatok.
              </p>

              <div className="flex items-center gap-4 text-[#cbd5e1]">
                <a href="#">Fb</a>
                <a href="#">Tw</a>
                <a href="#">Ig</a>
                <a href="#">Tk</a>
                <a href="#">Yt</a>
              </div>
            </div>

            <div className="grid w-full grid-cols-2 gap-8 md:grid-cols-4">
              <ul>
                <li className="mb-4 text-white">FilmX</li>
                <li className="mb-2 text-sm text-[#cbd5e1]">Rólunk</li>
                <li className="mb-2 text-sm text-[#cbd5e1]">Profilom</li>
                <li className="mb-2 text-sm text-[#cbd5e1]">Árak</li>
                <li className="text-sm text-[#cbd5e1]">Kapcsolat</li>
              </ul>

              <ul>
                <li className="mb-4 text-white">Böngészés</li>
                <li className="text-sm text-[#cbd5e1]">Streaming könyvtár</li>
              </ul>

              <ul>
                <li className="mb-4 text-white">Tartalom</li>
                <li className="mb-2 text-sm text-[#cbd5e1]">Sorozatok</li>
                <li className="mb-2 text-sm text-[#cbd5e1]">Filmek</li>
                <li className="mb-2 text-sm text-[#cbd5e1]">Gyerekeknek</li>
                <li className="text-sm text-[#cbd5e1]">Kollekciók</li>
              </ul>

              <ul>
                <li className="mb-4 text-white">Segítség</li>
                <li className="mb-2 text-sm text-[#cbd5e1]">Fiók és számlázás</li>
                <li className="mb-2 text-sm text-[#cbd5e1]">Csomagok és árak</li>
                <li className="mb-2 text-sm text-[#cbd5e1]">Támogatott eszközök</li>
                <li className="text-sm text-[#cbd5e1]">Akadálymentesség</li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col-reverse items-start justify-between gap-4 md:flex-row md:items-center">
            <p className="text-sm text-[#94a3b8]">© Szerzői jog 2024 FilmX</p>
            <div className="flex flex-wrap gap-6 text-sm text-[#94a3b8]">
              <a href="#">Adatvédelmi irányelvek</a>
              <a href="#">Felhasználási feltételek</a>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}