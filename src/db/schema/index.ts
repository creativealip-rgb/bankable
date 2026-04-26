// User & Auth tables
export { users, usersRelations, sessions, sessionsRelations, accounts, accountsRelations, verifications } from "./users";

// Course tables
export { courses, coursesRelations, modules, modulesRelations, videos, videosRelations } from "./courses";

// Progress tables
export { videoProgress, videoProgressRelations } from "./progress";

// Quiz tables
export { quizzes, quizzesRelations, questions, questionsRelations, quizAttempts, quizAttemptsRelations } from "./quizzes";

// Certificate tables
export { certificates, certificatesRelations } from "./certificates";

// Membership tables
export { memberships, membershipsRelations } from "./memberships";

// Payment tables
export { payments, paymentsRelations } from "./payments";
export { paymentSettings } from "./payment-settings";
export { premiumCourseAccess, premiumCourseAccessRelations } from "./premium-course-access";

// Community and review tables
export {
  discussionThreads,
  discussionThreadsRelations,
  discussionPosts,
  discussionPostsRelations,
  courseReviews,
  courseReviewsRelations,
} from "./community";

// Sidebar content tables
export { sidebarItems } from "./sidebar-content";

// Audit log tables
export { adminAuditLogs, adminAuditLogsRelations } from "./admin-audit-logs";

// System settings
export { systemSettings } from "./settings";
 
// Learning Path tables
export { learningPaths, learningPathsRelations, learningPathCourses, learningPathCoursesRelations } from "./learning-paths";
 
// Notification tables
export { notifications, notificationsRelations } from "./notifications";
