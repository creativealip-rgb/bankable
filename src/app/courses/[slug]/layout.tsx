import { db } from "@/db";
import { courses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Metadata } from "next";

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

  return {
    title: `${course.title} | BELAJARIA`,
    description: course.description || `Pelajari ${course.title} di BELAJARIA. Akses selamanya hanya dengan sekali bayar.`,
    openGraph: {
      title: `${course.title} | BELAJARIA`,
      description: course.description || `Kuasai skill ${course.title} dengan materi terstruktur.`,
      type: "article",
      images: course.thumbnail ? [course.thumbnail] : [],
    },
  };
}

export default function CourseDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
