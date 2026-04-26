import { Metadata } from "next";
import { db } from "@/db";
import { courses } from "@/db/schema";
import { eq } from "drizzle-orm";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const course = await db.query.courses.findFirst({
    where: eq(courses.slug, slug),
  });

  if (!course) {
    return {
      title: "Course Not Found | BELAJARIA",
    };
  }

  const title = `${course.title} | BELAJARIA`;
  const description = course.description || `Pelajari ${course.title} di BELAJARIA. Tingkatkan skill kamu dengan kursus berkualitas.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: course.thumbnail ? [course.thumbnail] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: course.thumbnail ? [course.thumbnail] : [],
    },
  };
}

export default function CourseLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
