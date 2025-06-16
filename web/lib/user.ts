import { parse } from "cookie";

export async function fetchAuthedUser(apiOrigin: string) {
  return fetch(new URL("/api/users/me", apiOrigin)).then(async (res) => {
    const json = await res.json();

    if (!res.ok) {
      return null;
    }

    console.log(json.data);

    return json.data;
  });
}
