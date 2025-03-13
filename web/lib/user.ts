import { parse } from "cookie";

export async function fetchAuthURL(apiOrigin: string) {
  return fetch(new URL("/api/auth_url", apiOrigin)).then(async (res) => {
    const json = await res.json();

    if (!res.ok) {
      console.error(json);
      return;
    }

    return json.data.url;
  });
}

export async function fetchAuthedUser(apiOrigin: string) {
  const token = parse(document.cookie)["token"] ?? null;
  if (token == null) return null;

  return fetch(new URL("/api/me", apiOrigin), {
    headers: { Authorization: `Bearer: ${token}` },
  }).then(async (res) => {
    const json = await res.json();

    if (!res.ok) {
      return null;
    }

    console.log(json.data);

    return json.data;
  });
}
