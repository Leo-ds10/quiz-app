import type { User } from "./server";

/**
 * Check if a user has permission to manage quizzes (create, edit, delete)
 * Based on OIDC groups claim
 */
export function canManageQuizzes(user: User | null | undefined): boolean {
  if (!user) return false;

  const groupsField = (user as { groups?: string | null }).groups;
  if (!groupsField) return false;

  try {
    const groups: string[] = JSON.parse(groupsField);
    const adminGroup = process.env.OIDC_ADMIN_GROUP ?? "admin";
    return groups.includes(adminGroup);
  } catch {
    return false;
  }
}

/**
 * Check if a user is the author of a quiz
 */
export function isQuizAuthor(userId: string, authorId: string): boolean {
  return userId === authorId;
}

/**
 * Check if a user can edit/delete a specific quiz
 * Either they're the author or they have admin permissions
 */
export function canEditQuiz(user: User | null | undefined, authorId: string): boolean {
  if (!user) return false;
  return isQuizAuthor(user.id, authorId) || canManageQuizzes(user);
}
