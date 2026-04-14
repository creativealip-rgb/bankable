"use client";

import { useState } from "react";
import styles from "./page.module.css";
import Link from "next/link";

const categories = ["Design", "Programming", "Business", "Audio/Video", "Marketing", "Personal Growth"];

const assets = [
  { id: 1, type: "Video", title: "Video Editing Masterclass", category: "Audio/Video", meta: "15 Modules" },
  { id: 2, type: "Ebook", title: "Cinematic Lighting Guide", category: "Audio/Video", meta: "120 Pages" },
  { id: 3, type: "Voice", title: "Cinematic Whoosh Pack", category: "Audio/Video", meta: "50 Files" },
  { id: 4, type: "Video", title: "Advanced React Patterns", category: "Programming", meta: "10 Modules" },
  { id: 5, type: "Ebook", title: "UI/UX Foundations", category: "Design", meta: "85 Pages" },
  { id: 6, type: "Voice", title: "Sci-Fi User Interface SFX", category: "Design", meta: "200 Files" },
  { id: 7, type: "Video", title: "Freelance Business Setup", category: "Business", meta: "8 Modules" },
  { id: 8, type: "Ebook", title: "The Art of Negotiation", category: "Business", meta: "60 Pages" },
  { id: 9, type: "Voice", title: "Nature Ambience Loops", category: "Audio/Video", meta: "25 Files" },
  { id: 10, type: "Video", title: "Figma Prototyping", category: "Design", meta: "12 Modules" },
  { id: 11, type: "Ebook", title: "Python Data Science", category: "Programming", meta: "210 Pages" },
  { id: 12, type: "Voice", title: "Footsteps Foley Bundle", category: "Audio/Video", meta: "150 Files" },
];

const webinars = [
  { id: 1, date: "15 Apr 2026", title: "Live Q&A: Video Editing Workflows", speaker: "John Doe" },
  { id: 2, date: "18 Apr 2026", title: "Breaking into Tech in 2026", speaker: "Jane Smith" },
  { id: 3, date: "22 Apr 2026", title: "Mastering Client Acquisition", speaker: "Alex Brown" },
];

export default function CatalogPage() {
  const [activeType, setActiveType] = useState("All");
  const [selectedCats, setSelectedCats] = useState<string[]>([]);

  const toggleCat = (cat: string) => {
    setSelectedCats(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const filteredAssets = assets.filter(asset => {
    const typeMatch = activeType === "All" || asset.type === activeType;
    const catMatch = selectedCats.length === 0 || selectedCats.includes(asset.category);
    return typeMatch && catMatch;
  });

  return (
    <div className={styles.catalogLayout}>
      {/* Left Sidebar - Categories */}
      <aside className={styles.leftSidebar}>
        <h3 className={styles.sidebarTitle}>Categories</h3>
        <div className={styles.categoryList}>
          {categories.map(cat => (
            <div 
              key={cat} 
              className={`${styles.categoryItem} ${selectedCats.includes(cat) ? styles.active : ""}`}
              onClick={() => toggleCat(cat)}
            >
              {cat}
            </div>
          ))}
        </div>
      </aside>

      {/* Main Catalog */}
      <main className={styles.mainCatalog}>
        <div className={styles.catalogHeader}>
          <h1 className={styles.catalogTitle}>Digital Asset Library</h1>
          
          {/* Asset Type Filter */}
          <div className={styles.filterGroup}>
            <button 
              className={`${styles.filterBtn} ${activeType === "All" ? styles.active : ""}`}
              onClick={() => setActiveType("All")}
            >
              All Assets
            </button>
            <button 
              className={`${styles.filterBtn} ${activeType === "Video" ? styles.active : ""}`}
              onClick={() => setActiveType("Video")}
            >
              Video Courses
            </button>
            <button 
              className={`${styles.filterBtn} ${activeType === "Ebook" ? styles.active : ""}`}
              onClick={() => setActiveType("Ebook")}
            >
              Ebooks
            </button>
            <button 
              className={`${styles.filterBtn} ${activeType === "Voice" ? styles.active : ""}`}
              onClick={() => setActiveType("Voice")}
            >
              Voice SFX
            </button>
          </div>
        </div>

        <div className={styles.assetGrid}>
          {filteredAssets.map(asset => (
            <Link 
              href={asset.type === "Video" ? "/my-courses/demo-course" : "#"} 
              key={asset.id} 
              className={styles.assetCard}
            >
              <div className={styles.assetThumbnail}>
                {asset.type === "Video" ? "🎬" : asset.type === "Ebook" ? "📚" : "🎵"}
              </div>
              <div className={styles.assetInfo}>
                <div className={styles.assetType}>{asset.type}</div>
                <div className={styles.assetName}>{asset.title}</div>
                <div className={styles.assetMeta}>
                  <span>{asset.category}</span>
                  <span>{asset.meta}</span>
                </div>
              </div>
            </Link>
          ))}
          {filteredAssets.length === 0 && (
            <div style={{ padding: "4rem 0", color: "var(--text-muted)", gridColumn: "1/-1", textAlign: "center" }}>
              No assets found matching your filters.
            </div>
          )}
        </div>
      </main>

      {/* Right Sidebar - Webinars */}
      <aside className={styles.rightSidebar}>
        <h3 className={styles.sidebarTitle}>Upcoming Webinars</h3>
        <div className={styles.webinarList}>
          {webinars.map(webinar => (
            <div key={webinar.id} className={styles.webinarCard}>
              <div className={styles.webinarDate}>{webinar.date}</div>
              <div className={styles.webinarTitle}>{webinar.title}</div>
              <div className={styles.webinarSpeaker}>by {webinar.speaker}</div>
              <button className={styles.webinarBtn}>RSVP / Set Reminder</button>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
