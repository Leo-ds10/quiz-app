import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth, type User } from "./server";
import { API_SCOPES, ALL_API_SCOPES, type ApiScope } from "./scopes";

// Re-export for convenience
export { API_SCOPES, ALL_API_SCOPES, type ApiScope } from "./scopes";

/**
 * Context returned from API authentication
 */
export interface ApiContext {
  user: User;
  permissions: ApiScope[];
  isApiKey: boolean;
}

/**
 * Error response helper
 */
export function errorResponse(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Authenticate an API request via API key or session
 * Returns user context with permissions, or null if unauthorized
 */
export async function getApiContext(): Promise<ApiContext | null> {
  const headersList = await headers();
  const apiKey = headersList.get("x-api-key");

  // Try API key authentication first
  if (apiKey) {
    try {
      const result = await auth.api.verifyApiKey({
        body: { key: apiKey },
      });

      if (!result?.valid || !result.key) {
        return null;
      }

      // Get user associated with the API key
      const session = await auth.api.getSession({
        headers: headersList,
      });

      // If enableSessionForAPIKey is working, we should have a session
      // Otherwise, we need to fetch the user manually
      if (session?.user) {
        const permissions = parsePermissions(result.key.permissions);
        return {
          user: session.user,
          permissions,
          isApiKey: true,
        };
      }

      // Fallback: API key is valid but no session mock available
      // This shouldn't happen with enableSessionForAPIKey: true
      return null;
    } catch (error) {
      console.error("API key verification error:", error);
      return null;
    }
  }

  // Fall back to session authentication (for browser-based API calls)
  const session = await auth.api.getSession({
    headers: headersList,
  });

  if (!session?.user) {
    return null;
  }

  // Session-based auth gets full permissions based on user role
  // Check if user is admin to determine permissions
  const isAdmin = checkIsAdmin(session.user);

  return {
    user: session.user,
    permissions: isAdmin
      ? ALL_API_SCOPES
      : [API_SCOPES.QUIZZES_READ, API_SCOPES.ATTEMPTS_READ, API_SCOPES.ATTEMPTS_WRITE],
    isApiKey: false,
  };
}

/**
 * Check if user belongs to admin group (based on OIDC groups claim)
 */
function checkIsAdmin(user: User): boolean {
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
 * Parse permissions from API key
 */
function parsePermissions(permissions: unknown): ApiScope[] {
  if (!permissions) return [];

  // BetterAuth stores permissions as an object like { "quizzes": ["read", "write"] }
  // or as an array of strings like ["quizzes:read", "quizzes:write"]
  if (Array.isArray(permissions)) {
    return permissions.filter(
      (p): p is ApiScope => typeof p === "string" && ALL_API_SCOPES.includes(p as ApiScope),
    );
  }

  if (typeof permissions === "object" && permissions !== null) {
    const perms: ApiScope[] = [];
    const permObj = permissions as Record<string, string[]>;

    for (const [resource, actions] of Object.entries(permObj)) {
      if (Array.isArray(actions)) {
        for (const action of actions) {
          const scope = `${resource}:${action}` as ApiScope;
          if (ALL_API_SCOPES.includes(scope)) {
            perms.push(scope);
          }
        }
      }
    }
    return perms;
  }

  return [];
}

/**
 * Check if context has required permission
 */
export function hasPermission(ctx: ApiContext, scope: ApiScope): boolean {
  return ctx.permissions.includes(scope);
}

/**
 * Require a specific permission, returns error response if not authorized
 */
export function requirePermission(ctx: ApiContext | null, scope: ApiScope): NextResponse | null {
  if (!ctx) {
    return errorResponse("Unauthorized", 401);
  }

  if (!hasPermission(ctx, scope)) {
    return errorResponse(`Missing required permission: ${scope}`, 403);
  }

  return null;
}

/**
 * Check if user can edit a specific quiz (author or admin)
 */
export function canEditQuizApi(ctx: ApiContext, authorId: string): boolean {
  return ctx.user.id === authorId || checkIsAdmin(ctx.user);
}
