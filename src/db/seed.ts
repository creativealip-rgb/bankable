import { db } from "./index";
import { users, accounts, courses, modules, videos, quizzes, questions, memberships, paymentSettings } from "./schema";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { eq } from "drizzle-orm";

// Load env
import "dotenv/config";

async function main() {
  console.log("🌱 Seeding Bankable database...\n");

  // --- Users ---
  let adminId: string = crypto.randomUUID();
  let memberId: string = crypto.randomUUID();
  const adminPasswordHash = await bcrypt.hash("admin123", 12);
  const memberPasswordHash = await bcrypt.hash("member123", 12);

  console.log("Creating users...");

  await db.insert(users).values([
    {
      id: adminId,
      name: "Admin Bankable",
      email: "admin@bankable.local",
      emailVerified: true,
      role: "ADMIN",
    },
    {
      id: memberId,
      name: "Member Demo",
      email: "member@bankable.local",
      emailVerified: true,
      role: "MEMBER",
    },
  ]).onConflictDoNothing();

  const [adminUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, "admin@bankable.local"))
    .limit(1);
  const [memberUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, "member@bankable.local"))
    .limit(1);
  if (!adminUser || !memberUser) {
    throw new Error("Seed users not found after insert");
  }
  adminId = adminUser.id;
  memberId = memberUser.id;

  // Create credential accounts for Better Auth
  await db.insert(accounts).values([
    {
      id: crypto.randomUUID(),
      accountId: adminId,
      providerId: "credential",
      userId: adminId,
      password: adminPasswordHash,
    },
    {
      id: crypto.randomUUID(),
      accountId: memberId,
      providerId: "credential",
      userId: memberId,
      password: memberPasswordHash,
    },
  ]).onConflictDoNothing();

  console.log("  ✅ Admin: admin@bankable.local / admin123");
  console.log("  ✅ Member: member@bankable.local / member123\n");

  // --- Memberships ---
  console.log("Creating memberships...");
  await db.insert(memberships).values([
    {
      id: crypto.randomUUID(),
      userId: adminId,
      tier: "LIFETIME",
      status: "ACTIVE",
    },
    {
      id: crypto.randomUUID(),
      userId: memberId,
      tier: "FREE",
      status: "ACTIVE",
    },
  ]).onConflictDoNothing();
  console.log("  ✅ Memberships created\n");

  await db.insert(paymentSettings).values({
    id: "global",
    paymentMode: "GATEWAY",
    paymentProvider: "MIDTRANS",
    manualInstructions: "Silakan transfer manual dan kirim bukti pembayaran ke admin.",
  }).onConflictDoNothing();

  // --- Course 1: Single Video ---
  console.log("Creating courses...");
  const course1Id = crypto.randomUUID();
  const course1ModuleId = crypto.randomUUID();

  await db.insert(courses).values({
    id: course1Id,
    title: "Dasar Investasi Saham",
    slug: "dasar-investasi-saham",
    description: "Pelajari dasar-dasar investasi saham dari nol. Workshop recording lengkap yang membahas cara membuka akun broker, analisis fundamental, hingga strategi entry pertama Anda.",
    type: "SINGLE",
    category: "Business",
    level: "BEGINNER",
    price: "0",
    status: "PUBLISHED",
    minWatchPct: 90,
    createdById: adminId,
  }).onConflictDoNothing();

  await db.insert(modules).values({
    id: course1ModuleId,
    courseId: course1Id,
    title: "Full Workshop",
    order: 0,
  }).onConflictDoNothing();

  await db.insert(videos).values({
    id: crypto.randomUUID(),
    moduleId: course1ModuleId,
    title: "Dasar Investasi Saham - Full Workshop (2 Jam)",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    duration: 7200,
    order: 0,
  }).onConflictDoNothing();

  console.log("  ✅ Course 1: Dasar Investasi Saham (Single Video)");

  // --- Course 2: Multi Video ---
  const course2Id = crypto.randomUUID();
  const mod2aId = crypto.randomUUID();
  const mod2bId = crypto.randomUUID();
  const mod2cId = crypto.randomUUID();

  await db.insert(courses).values({
    id: course2Id,
    title: "Financial Planning Masterclass",
    slug: "financial-planning-masterclass",
    description: "Masterclass lengkap tentang perencanaan keuangan pribadi. Dari budgeting, dana darurat, asuransi, hingga investasi jangka panjang. Dilengkapi quiz dan sertifikat.",
    type: "MULTI",
    category: "Business",
    level: "INTERMEDIATE",
    price: "0",
    status: "PUBLISHED",
    minWatchPct: 90,
    createdById: adminId,
  }).onConflictDoNothing();

  // Modules
  await db.insert(modules).values([
    { id: mod2aId, courseId: course2Id, title: "Modul 1: Pengenalan", order: 0 },
    { id: mod2bId, courseId: course2Id, title: "Modul 2: Budgeting", order: 1 },
    { id: mod2cId, courseId: course2Id, title: "Modul 3: Investasi", order: 2 },
  ]).onConflictDoNothing();

  // Videos
  await db.insert(videos).values([
    { id: crypto.randomUUID(), moduleId: mod2aId, title: "Apa itu Financial Planning", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", duration: 900, order: 0 },
    { id: crypto.randomUUID(), moduleId: mod2aId, title: "Mengapa Financial Planning Penting", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", duration: 600, order: 1 },
    { id: crypto.randomUUID(), moduleId: mod2bId, title: "Cara Membuat Budget", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", duration: 1200, order: 0 },
    { id: crypto.randomUUID(), moduleId: mod2bId, title: "Tools Budgeting Terbaik", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", duration: 900, order: 1 },
    { id: crypto.randomUUID(), moduleId: mod2bId, title: "Studi Kasus Budget Keluarga", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", duration: 1500, order: 2 },
    { id: crypto.randomUUID(), moduleId: mod2cId, title: "Jenis-Jenis Investasi", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", duration: 1200, order: 0 },
    { id: crypto.randomUUID(), moduleId: mod2cId, title: "Strategi Investasi Pemula", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", duration: 1800, order: 1 },
  ]).onConflictDoNothing();

  console.log("  ✅ Course 2: Financial Planning Masterclass (Multi Video, 3 Modules, 7 Videos)");

  // --- Course 3: Multi Video (Programming) ---
  const course3Id = crypto.randomUUID();
  const mod3aId = crypto.randomUUID();
  const mod3bId = crypto.randomUUID();

  await db.insert(courses).values({
    id: course3Id,
    title: "Advanced React Patterns",
    slug: "advanced-react-patterns",
    description: "Kuasai advanced patterns di React: compound components, render props, custom hooks, state machines, dan performance optimization. Untuk developer yang sudah familiar dengan React dasar.",
    type: "MULTI",
    category: "Programming",
    level: "ADVANCED",
    price: "0",
    status: "PUBLISHED",
    minWatchPct: 90,
    createdById: adminId,
  }).onConflictDoNothing();

  await db.insert(modules).values([
    { id: mod3aId, courseId: course3Id, title: "Pattern Dasar", order: 0 },
    { id: mod3bId, courseId: course3Id, title: "Advanced Optimization", order: 1 },
  ]).onConflictDoNothing();

  await db.insert(videos).values([
    { id: crypto.randomUUID(), moduleId: mod3aId, title: "Compound Components Pattern", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", duration: 1500, order: 0 },
    { id: crypto.randomUUID(), moduleId: mod3aId, title: "Render Props & HOC", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", duration: 1200, order: 1 },
    { id: crypto.randomUUID(), moduleId: mod3aId, title: "Custom Hooks Deep Dive", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", duration: 1800, order: 2 },
    { id: crypto.randomUUID(), moduleId: mod3bId, title: "React.memo & useMemo", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", duration: 1200, order: 0 },
    { id: crypto.randomUUID(), moduleId: mod3bId, title: "Virtualization & Lazy Loading", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", duration: 1500, order: 1 },
  ]).onConflictDoNothing();

  console.log("  ✅ Course 3: Advanced React Patterns (Multi Video, 2 Modules, 5 Videos)\n");

  // --- Bulk content catalog for filters (10 per type) ---
  console.log("Creating bulk catalog courses (Ebook / Video / Voice)...");
  for (let i = 1; i <= 10; i++) {
    // Ebook
    await db.insert(courses).values({
      id: crypto.randomUUID(),
      title: `Ebook Finansial Practical Vol ${i}`,
      slug: `ebook-finansial-practical-vol-${i}`,
      description: `Koleksi ebook praktis volume ${i} untuk literasi finansial dan produktivitas.`,
      type: "SINGLE",
      category: "Personal Growth",
      level: i <= 4 ? "BEGINNER" : i <= 7 ? "INTERMEDIATE" : "ADVANCED",
      price: "0",
      status: "PUBLISHED",
      minWatchPct: 90,
      createdById: adminId,
    }).onConflictDoNothing();

    // Video
    const videoCourseId = crypto.randomUUID();
    const videoModuleId = crypto.randomUUID();
    await db.insert(courses).values({
      id: videoCourseId,
      title: `Video Course Growth Sprint ${i}`,
      slug: `video-course-growth-sprint-${i}`,
      description: `Serial video course batch ${i} untuk growth, marketing, dan execution.`,
      type: "MULTI",
      category: i % 2 === 0 ? "Marketing" : "Business",
      level: i <= 4 ? "BEGINNER" : i <= 7 ? "INTERMEDIATE" : "ADVANCED",
      price: "0",
      status: "PUBLISHED",
      minWatchPct: 90,
      createdById: adminId,
    }).onConflictDoNothing();
    await db.insert(modules).values({
      id: videoModuleId,
      courseId: videoCourseId,
      title: "Core Lessons",
      order: 0,
    }).onConflictDoNothing();
    await db.insert(videos).values([
      {
        id: crypto.randomUUID(),
        moduleId: videoModuleId,
        title: `Video Course ${i} - Lesson 1`,
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        duration: 900 + i * 30,
        order: 0,
      },
      {
        id: crypto.randomUUID(),
        moduleId: videoModuleId,
        title: `Video Course ${i} - Lesson 2`,
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        duration: 780 + i * 20,
        order: 1,
      },
    ]).onConflictDoNothing();

    // Voice
    await db.insert(courses).values({
      id: crypto.randomUUID(),
      title: `Voice SFX Creator Pack ${i}`,
      slug: `voice-sfx-creator-pack-${i}`,
      description: `Bundle voice and SFX pack volume ${i} untuk kebutuhan konten dan branding audio.`,
      type: "SINGLE",
      category: "Audio/Video",
      level: i <= 4 ? "BEGINNER" : i <= 7 ? "INTERMEDIATE" : "ADVANCED",
      price: "0",
      status: "PUBLISHED",
      minWatchPct: 90,
      createdById: adminId,
    }).onConflictDoNothing();
  }
  console.log("  ✅ Added 10 Ebook + 10 Video + 10 Voice courses\n");

  // --- Quizzes ---
  console.log("Creating quizzes...");

  // Quiz for Course 2
  const quiz2Id = crypto.randomUUID();
  await db.insert(quizzes).values({
    id: quiz2Id,
    courseId: course2Id,
    title: "Quiz Akhir: Financial Planning Masterclass",
    passingGrade: 70,
    timeLimit: 30,
    maxAttempts: 3,
    shuffleQuestions: true,
    shuffleOptions: true,
    showAnswers: true,
  }).onConflictDoNothing();

  await db.insert(questions).values([
    {
      id: crypto.randomUUID(),
      quizId: quiz2Id,
      type: "MULTIPLE_CHOICE",
      questionText: "Apa langkah pertama dalam membuat rencana keuangan?",
      options: [
        { text: "Langsung investasi", isCorrect: false },
        { text: "Evaluasi kondisi keuangan saat ini", isCorrect: true },
        { text: "Pinjam uang", isCorrect: false },
        { text: "Beli asuransi", isCorrect: false },
      ],
      points: 1,
      order: 0,
    },
    {
      id: crypto.randomUUID(),
      quizId: quiz2Id,
      type: "MULTIPLE_CHOICE",
      questionText: "Berapa persen ideal dana darurat dari pengeluaran bulanan?",
      options: [
        { text: "1-2 bulan", isCorrect: false },
        { text: "3-6 bulan", isCorrect: true },
        { text: "12 bulan", isCorrect: false },
        { text: "Tidak perlu dana darurat", isCorrect: false },
      ],
      points: 1,
      order: 1,
    },
    {
      id: crypto.randomUUID(),
      quizId: quiz2Id,
      type: "TRUE_FALSE",
      questionText: "Diversifikasi investasi mengurangi risiko portfolio.",
      options: [
        { text: "True", isCorrect: true },
        { text: "False", isCorrect: false },
      ],
      points: 1,
      order: 2,
    },
    {
      id: crypto.randomUUID(),
      quizId: quiz2Id,
      type: "MULTIPLE_CHOICE",
      questionText: "Metode budgeting 50/30/20 membagi pendapatan menjadi?",
      options: [
        { text: "Kebutuhan / Keinginan / Tabungan", isCorrect: true },
        { text: "Makan / Transport / Hiburan", isCorrect: false },
        { text: "Gaji / Bonus / Investasi", isCorrect: false },
        { text: "Harian / Mingguan / Bulanan", isCorrect: false },
      ],
      points: 1,
      order: 3,
    },
    {
      id: crypto.randomUUID(),
      quizId: quiz2Id,
      type: "MULTIPLE_CHOICE",
      questionText: "Investasi mana yang paling cocok untuk pemula dengan risiko rendah?",
      options: [
        { text: "Saham gorengan", isCorrect: false },
        { text: "Cryptocurrency", isCorrect: false },
        { text: "Reksa Dana Pasar Uang", isCorrect: true },
        { text: "Options Trading", isCorrect: false },
      ],
      points: 1,
      order: 4,
    },
  ]).onConflictDoNothing();

  console.log("  ✅ Quiz for Financial Planning (5 questions)");

  // Quiz for Course 3
  const quiz3Id = crypto.randomUUID();
  await db.insert(quizzes).values({
    id: quiz3Id,
    courseId: course3Id,
    title: "Quiz Akhir: Advanced React Patterns",
    passingGrade: 70,
    timeLimit: 20,
    maxAttempts: 3,
    shuffleQuestions: false,
    shuffleOptions: true,
    showAnswers: true,
  }).onConflictDoNothing();

  await db.insert(questions).values([
    {
      id: crypto.randomUUID(),
      quizId: quiz3Id,
      type: "MULTIPLE_CHOICE",
      questionText: "Compound Component pattern menggunakan API apa untuk share state?",
      options: [
        { text: "Redux", isCorrect: false },
        { text: "React Context", isCorrect: true },
        { text: "Local Storage", isCorrect: false },
        { text: "URL Params", isCorrect: false },
      ],
      points: 1,
      order: 0,
    },
    {
      id: crypto.randomUUID(),
      quizId: quiz3Id,
      type: "TRUE_FALSE",
      questionText: "React.memo melakukan deep comparison pada props secara default.",
      options: [
        { text: "True", isCorrect: false },
        { text: "False", isCorrect: true },
      ],
      points: 1,
      order: 1,
    },
    {
      id: crypto.randomUUID(),
      quizId: quiz3Id,
      type: "MULTIPLE_CHOICE",
      questionText: "Kapan sebaiknya menggunakan useMemo?",
      options: [
        { text: "Untuk setiap variable", isCorrect: false },
        { text: "Hanya untuk expensive computations", isCorrect: true },
        { text: "Untuk semua string", isCorrect: false },
        { text: "Tidak pernah", isCorrect: false },
      ],
      points: 1,
      order: 2,
    },
  ]).onConflictDoNothing();

  console.log("  ✅ Quiz for Advanced React (3 questions)\n");

  console.log("🎉 Seeding complete!");
  console.log("\nLogin credentials:");
  console.log("  Admin:  admin@bankable.local  / admin123");
  console.log("  Member: member@bankable.local / member123");
}

main().catch((e) => {
  console.error("❌ Seed failed:", e);
  process.exit(1);
});
