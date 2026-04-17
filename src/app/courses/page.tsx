"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import styles from "./page.module.css";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";

type Course = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  type: string;
  category: string;
  level: string;
  thumbnail: string | null;
  price: string | null;
  status: string;
  totalVideos: number;
  totalDuration: number;
  totalModules: number;
  contentType: "EBOOK" | "VIDEO" | "VOICE";
};

const categories = ["Business", "Programming", "Design", "Audio/Video", "Marketing", "Personal Growth"];
const levels = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;
const contentTypes = [
  { value: "ALL", label: "Semua Format" },
  { value: "EBOOK", label: "Ebook" },
  { value: "VIDEO", label: "Video Course" },
  { value: "VOICE", label: "Voice / SFX" },
] as const;
const sortOptions = [
  { value: "NEWEST", label: "Terbaru" },
  { value: "OLDEST", label: "Terlama" },
  { value: "TITLE_ASC", label: "Judul A-Z" },
  { value: "TITLE_DESC", label: "Judul Z-A" },
  { value: "DURATION_DESC", label: "Durasi Terpanjang" },
] as const;

const upcomingWebinars = [
  { date: "28 Apr", title: "Live Webinar: AI for UMKM", speaker: "Coach Rani", cta: "Save Seat", href: "/courses/live-webinar-ai-for-umkm-webinar" },
  { date: "05 Mei", title: "Workshop: Personal Branding", speaker: "Dimas F", cta: "Join Waitlist", href: "/courses/workshop-personal-branding-webinar" },
];

const premiumVideos = [
  { title: "Mentoring Rekaman: Closing Sales", price: "Rp149.000", note: "Akses terpisah, tidak termasuk paket 29rb", cta: "Lihat Detail", href: "/courses/mentoring-rekaman-closing-sales-premium" },
  { title: "Deep Dive Ads Optimization", price: "Rp199.000", note: "Akses terpisah, tidak termasuk paket 29rb", cta: "Lihat Detail", href: "/courses/deep-dive-ads-optimization-premium" },
];

type SidebarItem = {
  id: string;
  section: "WEBINAR" | "PREMIUM_VIDEO";
  title: string;
  subtitle: string | null;
  dateLabel: string | null;
  ctaLabel: string | null;
  href: string | null;
  priceLabel: string | null;
};

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function getContentIcon(contentType: "EBOOK" | "VIDEO" | "VOICE") {
  if (contentType === "EBOOK") return "📘";
  if (contentType === "VOICE") return "🎧";
  return "🎬";
}

export default function CatalogPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedSearch = searchParams.get("search") || "";
  const selectedCategory = searchParams.get("category") || "ALL";
  const selectedContentType = (searchParams.get("contentType") || "ALL").toUpperCase();
  const selectedLevel = (searchParams.get("level") || "ALL").toUpperCase();
  const selectedSort = (searchParams.get("sort") || "NEWEST").toUpperCase();

  const [searchInput, setSearchInput] = useState(selectedSearch);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [webinars, setWebinars] = useState<SidebarItem[]>([]);
  const [premiumItems, setPremiumItems] = useState<SidebarItem[]>([]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [accessReady, setAccessReady] = useState(false);

  useEffect(() => {
    if (isPending) return;

    const role = (session?.user as Record<string, unknown> | undefined)?.role as string | undefined;
    const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
    if (isAdmin) {
      setAccessReady(true);
      return;
    }

    if (!session) {
      router.replace("/pricing");
      return;
    }

    let isCancelled = false;
    async function ensureMainAccess() {
      try {
        const res = await fetch("/api/access/main");
        if (!res.ok) {
          router.replace("/pricing");
          return;
        }
        const data = await res.json();
        if (!data.hasMainAccess) {
          router.replace("/pricing");
          return;
        }
        if (!isCancelled) setAccessReady(true);
      } catch {
        router.replace("/pricing");
      }
    }
    void ensureMainAccess();
    return () => {
      isCancelled = true;
    };
  }, [isPending, session, router]);

  useEffect(() => {
    setSearchInput(selectedSearch);
  }, [selectedSearch]);

  useEffect(() => {
    if (!mobileFiltersOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileFiltersOpen]);

  const applyFilters = (patch: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(patch).forEach(([key, value]) => {
      const normalized = value?.trim() || "";
      const shouldDelete =
        normalized.length === 0 ||
        (key === "category" && normalized === "ALL") ||
        (key === "contentType" && normalized === "ALL") ||
        (key === "level" && normalized === "ALL") ||
        (key === "sort" && normalized === "NEWEST");

      if (shouldDelete) {
        params.delete(key);
      } else {
        params.set(key, normalized);
      }
    });
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const clearAllFilters = () => {
    setSearchInput("");
    router.replace(pathname, { scroll: false });
  };

  const hasActiveFilters = Boolean(
    selectedSearch || selectedCategory !== "ALL" || selectedContentType !== "ALL" || selectedLevel !== "ALL" || selectedSort !== "NEWEST"
  );
  const activeFilterCount =
    Number(Boolean(selectedSearch)) +
    Number(selectedCategory !== "ALL") +
    Number(selectedContentType !== "ALL") +
    Number(selectedLevel !== "ALL") +
    Number(selectedSort !== "NEWEST");

  useEffect(() => {
    if (!accessReady) return;
    async function fetchCourses() {
      setError("");
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedCategory !== "ALL") params.set("category", selectedCategory);
        if (selectedContentType !== "ALL") params.set("contentType", selectedContentType);
        if (selectedLevel !== "ALL") params.set("level", selectedLevel);
        if (selectedSort !== "NEWEST") params.set("sort", selectedSort);
        if (selectedSearch.trim()) params.set("search", selectedSearch.trim());

        const res = await fetch(`/api/courses?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setCourses(Array.isArray(data) ? data : []);
        } else {
          const data = await res.json();
          setError(data.error || "Failed to load courses.");
        }
      } catch {
        setError("Failed to load courses.");
      } finally {
        setLoading(false);
      }
    }
    void fetchCourses();
  }, [accessReady, selectedCategory, selectedContentType, selectedLevel, selectedSort, selectedSearch]);

  useEffect(() => {
    async function fetchSidebarItems() {
      try {
        const res = await fetch("/api/sidebar-items");
        if (!res.ok) return;
        const data = await res.json();
        setWebinars(data.webinars || []);
        setPremiumItems(data.premiumVideos || []);
      } catch {
        // Keep static fallback
      }
    }
    void fetchSidebarItems();
  }, []);

  const searchSummary = useMemo(() => {
    if (loading || !accessReady) return "Loading...";
    return `${courses.length} konten tersedia`;
  }, [accessReady, courses.length, loading]);

  const onSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    applyFilters({ search: searchInput });
  };

  if (!accessReady) {
    return (
      <div className={styles.catalogLayout}>
        <main className={styles.mainCatalog}>
          <div className={styles.catalogState}>Memeriksa akses member...</div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.catalogLayout}>
      <aside className={styles.leftSidebar}>
        <div className={styles.leftSidebarInner}>
          <div className={styles.sidebarSection}>
            <h3 className={styles.sidebarTitle}>Content Type</h3>
            <div className={styles.categoryList}>
              {contentTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  className={`${styles.categoryItem} ${selectedContentType === type.value ? styles.active : ""}`}
                  onClick={() => applyFilters({ contentType: type.value })}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.sidebarSection}>
            <h3 className={styles.sidebarTitle}>Categories</h3>
            <div className={styles.categoryList}>
              <button
                type="button"
                className={`${styles.categoryItem} ${selectedCategory === "ALL" ? styles.active : ""}`}
                onClick={() => applyFilters({ category: "ALL" })}
              >
                All Courses
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={`${styles.categoryItem} ${selectedCategory === category ? styles.active : ""}`}
                  onClick={() => applyFilters({ category })}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      <main className={styles.mainCatalog}>
        <div className={styles.catalogHeader}>
          <h1 className={styles.catalogTitle}>Course Library</h1>
          <p className={styles.catalogMeta}>{searchSummary}</p>
          {error ? <p className={styles.catalogError}>{error}</p> : null}
          <button
            type="button"
            className={styles.mobileFilterTrigger}
            onClick={() => setMobileFiltersOpen(true)}
            aria-expanded={mobileFiltersOpen}
            aria-controls="mobile-advanced-filters"
          >
            <span className={styles.mobileFilterIcon} aria-hidden>
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </span>
            Filter Lanjutan
            {activeFilterCount > 0 ? <span className={styles.mobileFilterBadge}>{activeFilterCount}</span> : null}
          </button>

          <form className={styles.filterBar} onSubmit={onSearchSubmit}>
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Cari judul course..."
              className={styles.searchInput}
            />
            <select
              className={styles.compactSelect}
              value={selectedLevel}
              onChange={(event) => applyFilters({ level: event.target.value })}
            >
              <option value="ALL">Semua Level</option>
              {levels.map((level) => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
            <select
              className={styles.compactSelect}
              value={selectedSort}
              onChange={(event) => applyFilters({ sort: event.target.value })}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <button type="submit" className={styles.filterActionBtn}>Apply</button>
            {hasActiveFilters ? (
              <button type="button" className={styles.filterResetBtn} onClick={clearAllFilters}>Reset</button>
            ) : null}
          </form>
        </div>

        <div className={styles.assetGrid}>
          {loading ? (
            <div className={styles.catalogState}>Loading courses...</div>
          ) : courses.length === 0 ? (
            <div className={styles.catalogState}>No courses found matching your filters.</div>
          ) : (
            courses.map((course) => (
              <Link href={`/courses/${course.slug}`} key={course.id} className={styles.assetCard}>
                <div className={styles.assetThumbnail}>{getContentIcon(course.contentType)}</div>
                <div className={styles.assetInfo}>
                  <div className={styles.assetType}>
                    {course.contentType}
                    <span className={styles.assetLevel}>{course.level}</span>
                  </div>
                  <div className={styles.assetName}>{course.title}</div>
                  <div className={styles.assetMeta}>
                    <span>{course.totalModules} Modules • {course.totalVideos} Videos</span>
                    <span>{formatDuration(course.totalDuration)}</span>
                  </div>
                  <div className={styles.includedTag}>Included in your one-time access</div>
                </div>
              </Link>
            ))
          )}
        </div>
      </main>

      {mobileFiltersOpen ? (
        <div className={styles.mobileFilterOverlay} onClick={() => setMobileFiltersOpen(false)}>
          <div
            id="mobile-advanced-filters"
            className={styles.mobileFilterDrawer}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.mobileFilterHeader}>
              <h2 className={styles.mobileFilterTitle}>Filter Lanjutan</h2>
              <button type="button" className={styles.mobileFilterClose} onClick={() => setMobileFiltersOpen(false)}>
                ✕
              </button>
            </div>

            <form
              className={styles.mobileSearchForm}
              onSubmit={(event) => {
                event.preventDefault();
                applyFilters({ search: searchInput });
                setMobileFiltersOpen(false);
              }}
            >
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Cari judul course..."
                className={styles.searchInput}
              />
              <button type="submit" className={styles.filterActionBtn}>Terapkan</button>
            </form>

            <div className={styles.mobileFilterSection}>
              <h3 className={styles.sidebarTitle}>Level</h3>
              <select
                className={styles.compactSelect}
                value={selectedLevel}
                onChange={(event) => applyFilters({ level: event.target.value })}
              >
                <option value="ALL">Semua Level</option>
                {levels.map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            <div className={styles.mobileFilterSection}>
              <h3 className={styles.sidebarTitle}>Urutkan</h3>
              <select
                className={styles.compactSelect}
                value={selectedSort}
                onChange={(event) => applyFilters({ sort: event.target.value })}
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className={styles.mobileFilterSection}>
              <h3 className={styles.sidebarTitle}>Content Type</h3>
              <div className={styles.categoryList}>
                {contentTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    className={`${styles.categoryItem} ${selectedContentType === type.value ? styles.active : ""}`}
                    onClick={() => applyFilters({ contentType: type.value })}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.mobileFilterSection}>
              <h3 className={styles.sidebarTitle}>Categories</h3>
              <div className={styles.categoryList}>
                <button
                  type="button"
                  className={`${styles.categoryItem} ${selectedCategory === "ALL" ? styles.active : ""}`}
                  onClick={() => applyFilters({ category: "ALL" })}
                >
                  All Courses
                </button>
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    className={`${styles.categoryItem} ${selectedCategory === category ? styles.active : ""}`}
                    onClick={() => applyFilters({ category })}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.mobileFilterActions}>
              <button
                type="button"
                className={styles.filterResetBtn}
                onClick={() => {
                  clearAllFilters();
                  setMobileFiltersOpen(false);
                }}
              >
                Reset Semua
              </button>
              <button type="button" className={styles.filterActionBtn} onClick={() => setMobileFiltersOpen(false)}>
                Selesai
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <aside className={styles.rightSidebar}>
        <div className={styles.rightSidebarInner}>
          <div className={styles.sidebarSection}>
            <h3 className={styles.sidebarTitle}>Upcoming Webinar</h3>
            <div className={styles.webinarList}>
              {(webinars.length > 0 ? webinars : upcomingWebinars).map((webinar) => {
                const dateLabel = "id" in webinar ? webinar.dateLabel : webinar.date;
                const subtitle = "id" in webinar ? webinar.subtitle : webinar.speaker;
                const ctaLabel = "id" in webinar ? webinar.ctaLabel : webinar.cta;
                const href = "id" in webinar ? webinar.href : webinar.href;
                const targetHref = href || "/courses/live-webinar-ai-for-umkm-webinar";

                return (
                  <Link key={webinar.title} href={targetHref} className={styles.webinarCardLink}>
                    <div className={styles.webinarCard}>
                      <div className={styles.webinarDate}>📅 {dateLabel || "Soon"}</div>
                      <div className={styles.webinarTitle}>{webinar.title}</div>
                      <div className={styles.webinarSpeaker}>{subtitle || "-"}</div>
                      {ctaLabel && <span className={styles.webinarBtn}>{ctaLabel}</span>}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className={styles.sidebarSection}>
            <h3 className={styles.sidebarTitle}>Premium Paid Video</h3>
            <div className={styles.webinarList}>
              {(premiumItems.length > 0 ? premiumItems : premiumVideos).map((item) => {
                const subtitle = "id" in item ? item.subtitle : item.note;
                const price = "id" in item ? item.priceLabel : item.price;
                const href = "id" in item ? item.href : item.href;
                const ctaLabel = "id" in item ? item.ctaLabel : item.cta;
                const targetHref = href || "/courses/mentoring-rekaman-closing-sales-premium";

                return (
                  <Link key={item.title} href={targetHref} className={styles.webinarCardLink}>
                    <div className={styles.webinarCard}>
                      <div className={styles.webinarDate}>💎</div>
                      <div className={styles.webinarTitle}>{item.title}</div>
                      <div className={styles.webinarSpeaker}>{subtitle || "-"}</div>
                      <div className={styles.premiumPrice}>{price || "-"}</div>
                      {ctaLabel && <span className={styles.webinarBtn}>{ctaLabel}</span>}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

