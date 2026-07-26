const USERNAME_DOMAIN = "badboysgym.com";

export function usernameToEmail(username: string): string {
  const trimmed = username.trim().toLowerCase();
  return trimmed.includes("@") ? trimmed : `${trimmed}@${USERNAME_DOMAIN}`;
}
