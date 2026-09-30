export const EDITOR_COOKIE = "cms_editor";

const FOURTEEN_DAYS = 14 * 24 * 60 * 60 * 1000;

function editorSecret() {
  return process.env.CMS_ACCESS_PASSWORD ?? "";
}

async function hmac(value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(editorSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function createEditorToken() {
  const expires = String(Date.now() + FOURTEEN_DAYS);
  return `${expires}.${await hmac(expires)}`;
}

export async function editorTokenValid(token?: string) {
  if (!token || !editorSecret()) return false;
  const [expires, signature] = token.split(".");
  if (!expires || !signature || !/^\d+$/.test(expires) || Number(expires) < Date.now()) return false;
  const expected = await hmac(expires);
  if (expected.length !== signature.length) return false;
  let mismatch = 0;
  for (let index = 0; index < expected.length; index += 1) {
    mismatch |= expected.charCodeAt(index) ^ signature.charCodeAt(index);
  }
  return mismatch === 0;
}
