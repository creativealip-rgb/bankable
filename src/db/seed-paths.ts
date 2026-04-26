import { db } from "./index";
import { learningPaths, learningPathCourses, courses } from "./schema";
import { eq } from "drizzle-orm";

async function seedLearningPaths() {
  console.log("Seeding learning paths...");

  // 1. Get some courses
  const allCourses = await db.query.courses.findMany();
  if (allCourses.length < 3) {
    console.log("Not enough courses to create paths.");
    return;
  }

  // 2. Create "Web Development Mastery" path
  const [path1] = await db.insert(learningPaths).values({
    title: "Web Development Mastery",
    slug: "web-dev-mastery",
    description: "Alur belajar lengkap dari nol sampai mahir membangun aplikasi web modern.",
    thumbnail: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=600",
    order: 1,
  }).returning();

  // Add courses to path 1
  const webCourses = allCourses.filter(c => 
    c.title.toLowerCase().includes('react') || 
    c.title.toLowerCase().includes('javascript') || 
    c.title.toLowerCase().includes('next.js')
  ).slice(0, 3);

  for (let i = 0; i < webCourses.length; i++) {
    await db.insert(learningPathCourses).values({
      learningPathId: path1.id,
      courseId: webCourses[i].id,
      order: i + 1,
    });
  }

  // 3. Create "Digital Entrepreneur" path
  const [path2] = await db.insert(learningPaths).values({
    title: "Digital Entrepreneur",
    slug: "digital-entrepreneur",
    description: "Bangun bisnis digital Anda sendiri dengan strategi marketing dan finansial yang tepat.",
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=600",
    order: 2,
  }).returning();

  // Add courses to path 2
  const bizCourses = allCourses.filter(c => 
    c.title.toLowerCase().includes('marketing') || 
    c.title.toLowerCase().includes('planning') || 
    c.title.toLowerCase().includes('business')
  ).slice(0, 2);

  for (let i = 0; i < bizCourses.length; i++) {
    await db.insert(learningPathCourses).values({
      learningPathId: path2.id,
      courseId: bizCourses[i].id,
      order: i + 1,
    });
  }

  console.log("Successfully seeded 2 learning paths!");
}

seedLearningPaths().catch(console.error);
