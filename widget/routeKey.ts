const INVITE_PARAM = "review";

function urlWithoutInvite(href: string): URL {
  const base =
    typeof location === "undefined" ? "https://reviewer.local" : location.origin;
  const url = new URL(href, base);
  url.searchParams.delete(INVITE_PARAM);
  return url;
}

export function pageKeyFromHref(href: string): string {
  try {
    const url = urlWithoutInvite(href);
    const search = url.searchParams.toString();
    return url.pathname + (search ? `?${search}` : "") + url.hash;
  } catch {
    return typeof location === "undefined" ? "/" : location.pathname;
  }
}

export function pageUrlFromHref(href: string): string {
  try {
    return urlWithoutInvite(href).href;
  } catch {
    return href;
  }
}

export function currentPageKey(): string {
  return pageKeyFromHref(location.href);
}

export function legacyPathFromKey(key: string): string {
  const q = key.indexOf("?");
  const h = key.indexOf("#");
  const cut = q < 0 ? h : h < 0 ? q : Math.min(q, h);
  return cut < 0 ? key : key.slice(0, cut);
}

export function samePageKey(a: string, b: string): boolean {
  return a === b || a === legacyPathFromKey(b) || b === legacyPathFromKey(a);
}
