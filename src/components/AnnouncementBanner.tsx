"use client";

import { useState, useEffect } from "react";
import styles from "./AnnouncementBanner.module.css";

export default function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    async function fetchAnnouncement() {
      try {
        const res = await fetch("/api/settings?key=announcement_banner");
        if (res.ok) {
          const data = await res.json();
          if (data.value) {
            setAnnouncement(data.value);
          }
        }
      } catch (err) {
        console.error("Failed to fetch announcement:", err);
      }
    }
    fetchAnnouncement();
  }, []);

  if (!announcement || !visible) return null;

  return (
    <div className={styles.banner}>
      <div className={styles.content}>
        <span className={styles.icon}>📢</span>
        <span className={styles.text}>{announcement}</span>
      </div>
      <button className={styles.close} onClick={() => setVisible(false)}>×</button>
    </div>
  );
}
