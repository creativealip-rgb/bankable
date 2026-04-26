import { db } from './index';
import { courses } from './schema/courses';
import { sidebarItems } from './schema/sidebar-content';
import { eq } from 'drizzle-orm';
import 'dotenv/config';

async function updatePrices() {
  try {
    // Update Course Prices
    await db.update(courses).set({ price: '299000' }).where(eq(courses.slug, 'financial-planning-masterclass'));
    await db.update(courses).set({ price: '199000' }).where(eq(courses.slug, 'dasar-investasi-saham'));
    await db.update(courses).set({ price: '349000' }).where(eq(courses.slug, 'advanced-react-patterns'));
    await db.update(courses).set({ price: '149000' }).where(eq(courses.slug, 'video-course-growth-sprint-1'));

    // Update Sidebar Prices
    await db.update(sidebarItems).set({ priceLabel: 'Rp 299.000' }).where(eq(sidebarItems.title, 'Live Masterclass: Strategi Scale-Up Bisnis'));
    await db.update(sidebarItems).set({ priceLabel: 'Gratis (Member)' }).where(eq(sidebarItems.title, 'Q&A: Membangun Personal Brand di LinkedIn'));
    await db.update(sidebarItems).set({ priceLabel: 'Rp 249.000' }).where(eq(sidebarItems.title, 'Mastering TikTok Ads 2026'));
    await db.update(sidebarItems).set({ priceLabel: 'Rp 199.000' }).where(eq(sidebarItems.title, 'Bongkar Rahasia Copywriting'));

    console.log('Prices updated successfully!');
  } catch (error) {
    console.error('Failed to update prices:', error);
  }
}

updatePrices();
