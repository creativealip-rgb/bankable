"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import styles from "./SearchModal.module.css";

interface SearchResult {
  id: string;
  title: string;
  type: string;
  href: string;
  category: string;
}

export function SearchModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results || []);
        setSelectedIndex(0);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (results.length || 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + (results.length || 1)) % (results.length || 1));
    }
    if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      router.push(results[selectedIndex].href);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.searchHeader}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.searchIcon}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Cari kursus, webinar, atau ebook... (Esc untuk keluar)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className={styles.searchInput}
          />
          {loading && <div className={styles.spinner}></div>}
        </div>

        <div className={styles.resultsArea}>
          {results.length > 0 ? (
            <div className={styles.resultsList}>
              {results.map((res, index) => (
                <div
                  key={res.id}
                  className={`${styles.resultItem} ${index === selectedIndex ? styles.active : ""}`}
                  onMouseEnter={() => setSelectedIndex(index)}
                  onClick={() => {
                    router.push(res.href);
                    onClose();
                  }}
                >
                  <div className={styles.resultInfo}>
                    <span className={styles.resultTitle}>{res.title}</span>
                    <span className={styles.resultType}>{res.type}</span>
                  </div>
                  <div className={styles.resultCategory}>{res.category}</div>
                </div>
              ))}
            </div>
          ) : query.length >= 2 && !loading ? (
            <div className={styles.noResults}>Tidak ada hasil ditemukan untuk "{query}"</div>
          ) : (
            <div className={styles.placeholder}>
              <p>Ketik sesuatu untuk mulai mencari...</p>
              <div className={styles.shortcuts}>
                <span><kbd>↑↓</kbd> Navigasi</span>
                <span><kbd>Enter</kbd> Pilih</span>
                <span><kbd>Esc</kbd> Tutup</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
