import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['info', 'warn', 'error']
});

async function main() {
  console.log('Start seeding...');

  // Create a mock user
  const user = await prisma.user.upsert({
    where: { email: 'creator@bankable.local' },
    update: {},
    create: {
      name: 'Test Creator',
      email: 'creator@bankable.local',
      role: 'ADMIN',
    },
  });

  console.log(`Created user with id: ${user.id}`);

  // Create mock assets
  const assetsData = [
    { type: "Video", title: "Video Editing Masterclass", category: "Audio/Video", meta: "15 Modules" },
    { type: "Ebook", title: "Cinematic Lighting Guide", category: "Audio/Video", meta: "120 Pages" },
    { type: "Voice", title: "Cinematic Whoosh Pack", category: "Audio/Video", meta: "50 Files" },
    { type: "Video", title: "Advanced React Patterns", category: "Programming", meta: "10 Modules" },
    { type: "Ebook", title: "UI/UX Foundations", category: "Design", meta: "85 Pages" },
    { type: "Voice", title: "Sci-Fi User Interface SFX", category: "Design", meta: "200 Files" },
    { type: "Video", title: "Freelance Business Setup", category: "Business", meta: "8 Modules" },
    { type: "Ebook", title: "The Art of Negotiation", category: "Business", meta: "60 Pages" },
    { type: "Voice", title: "Nature Ambience Loops", category: "Audio/Video", meta: "25 Files" },
    { type: "Video", title: "Figma Prototyping", category: "Design", meta: "12 Modules" },
    { type: "Ebook", title: "Python Data Science", category: "Programming", meta: "210 Pages" },
    { type: "Voice", title: "Footsteps Foley Bundle", category: "Audio/Video", meta: "150 Files" },
  ];

  await prisma.asset.deleteMany({}); // clear existing
  
  for (const asset of assetsData) {
    const created = await prisma.asset.create({
      data: {
        type: asset.type,
        title: asset.title,
        category: asset.category,
        meta: asset.meta,
        published: true
      }
    });
    console.log(`Created asset: ${created.title}`);
  }

  console.log('Seeding finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
