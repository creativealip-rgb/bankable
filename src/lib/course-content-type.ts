export const CATALOG_CONTENT_TYPES = ["EBOOK", "VIDEO", "VOICE"] as const;
export type CatalogContentType = (typeof CATALOG_CONTENT_TYPES)[number];

type CourseLike = {
  title: string;
  category: string;
  type: string;
  totalVideos?: number;
};

export function inferCourseContentType(course: CourseLike): CatalogContentType {
  const raw = `${course.category} ${course.title}`.toLowerCase();

  if (raw.includes("ebook") || raw.includes("book")) return "EBOOK";
  if (raw.includes("voice") || raw.includes("audio") || raw.includes("sfx")) return "VOICE";
  if (raw.includes("video") || raw.includes("webinar") || raw.includes("course")) return "VIDEO";
  if (course.type === "SINGLE" || course.type === "MULTI") return "VIDEO";
  return (course.totalVideos || 0) > 0 ? "VIDEO" : "EBOOK";
}

