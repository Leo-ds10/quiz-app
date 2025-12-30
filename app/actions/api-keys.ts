"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth/server";
import { canManageQuizzes } from "@/lib/auth/permissions";
import { ALL_API_SCOPES, type ApiScope } from "@/lib/auth/scopes";

interface CreateApiKeyInput {
  name: string;
  expiresInSeconds?: number;
  permissions: Record<string, string[]>;
}

interface CreateApiKeyResult {
  success: boolean;
  key?: string;
  error?: string;
}

export async function createApiKey(input: CreateApiKeyInput): Promise<CreateApiKeyResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  if (!canManageQuizzes(session.user)) {
    return { success: false, error: "Only admins can create API keys" };
  }

  if (!input.name.trim()) {
    return { success: false, error: "Key name is required" };
  }

  // Validate permissions
  const scopeStrings: string[] = [];
  for (const [resource, actions] of Object.entries(input.permissions)) {
    for (const action of actions) {
      scopeStrings.push(`${resource}:${action}`);
    }
  }

  if (scopeStrings.length === 0) {
    return { success: false, error: "At least one permission is required" };
  }

  // Validate all scopes are valid
  for (const scope of scopeStrings) {
    if (!ALL_API_SCOPES.includes(scope as ApiScope)) {
      return { success: false, error: `Invalid permission: ${scope}` };
    }
  }

  try {
    // Call without headers and pass userId directly - this makes it a true server call
    // which allows setting server-only properties like permissions
    const result = await auth.api.createApiKey({
      body: {
        name: input.name.trim(),
        expiresIn: input.expiresInSeconds,
        permissions: input.permissions,
        userId: session.user.id,
      },
    });

    if (!result?.key) {
      return { success: false, error: "Failed to create API key" };
    }

    return { success: true, key: result.key };
  } catch (error) {
    console.error("Failed to create API key:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create API key",
    };
  }
}

interface DeleteApiKeyResult {
  success: boolean;
  error?: string;
}

export async function deleteApiKey(keyId: string): Promise<DeleteApiKeyResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  if (!canManageQuizzes(session.user)) {
    return { success: false, error: "Only admins can delete API keys" };
  }

  try {
    await auth.api.deleteApiKey({
      body: { keyId },
      headers: await headers(),
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to delete API key:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete API key",
    };
  }
}
