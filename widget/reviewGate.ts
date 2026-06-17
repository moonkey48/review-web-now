export interface ReviewInvite {
  name: string;
}

export function parseReviewInvite(href: string): ReviewInvite | null {
  try {
    const url = new URL(href);
    if (!url.searchParams.has("review")) return null;

    return {
      name: (url.searchParams.get("review") ?? "").trim(),
    };
  } catch {
    return null;
  }
}
