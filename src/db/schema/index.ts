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
