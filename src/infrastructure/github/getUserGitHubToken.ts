import { clerkClient } from "@clerk/nextjs/server";

export async function getUserGitHubToken(
  userId: string,
): Promise<string | null> {
  try {
    const client = await clerkClient();
    const tokens = await client.users.getUserOauthAccessToken(userId, "github");
    return tokens.data[0]?.token ?? null;
  } catch (err) {
    console.error("Error fetching GitHub token:", err);
    return null;
  }
}
