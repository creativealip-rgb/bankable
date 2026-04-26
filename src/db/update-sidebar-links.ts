import { db } from './index';
import { sidebarItems } from './schema/sidebar-content';
import { eq } from 'drizzle-orm';
import 'dotenv/config';

async function updateLinks() {
  try {
    // Update Masterclass
    await db.update(sidebarItems)
      .set({ href: '/courses/financial-planning-masterclass' })
      .where(eq(sidebarItems.title, 'Live Masterclass: Strategi Scale-Up Bisnis'));

    // Update Q&A
    await db.update(sidebarItems)
      .set({ href: '/courses/dasar-investasi-saham' })
      .where(eq(sidebarItems.title, 'Q&A: Membangun Personal Brand di LinkedIn'));

    // Update TikTok Ads
    await db.update(sidebarItems)
      .set({ href: '/courses/advanced-react-patterns' })
      .where(eq(sidebarItems.title, 'Mastering TikTok Ads 2026'));

    // Update Copywriting
    await db.update(sidebarItems)
      .set({ href: '/courses/video-course-growth-sprint-1' })
      .where(eq(sidebarItems.title, 'Bongkar Rahasia Copywriting'));

    console.log('Sidebar links updated successfully!');
  } catch (error) {
    console.error('Failed to update sidebar links:', error);
  }
}

updateLinks();
