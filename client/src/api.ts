const API = import.meta.env.VITE_API_URL;

export async function login(email: string, password: string) {
  const res = await fetch(`${API}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ошибка входа");
  localStorage.setItem("token", data.token);
  return data;
}

export async function register(email: string, password: string) {
  const res = await fetch(`${API}/api/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ошибка регистрации");
  localStorage.setItem("token", data.token);
  return data;
}

export async function getMe() {
  const token = localStorage.getItem("token");
  if (!token) return null;

  const res = await fetch(`${API}/api/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) return null;

  const data = await res.json();
  // сервер возвращает { user: {...}, hasProAccess: true }
  return {
    email: data.user?.email,
    hasProAccess: data.hasProAccess === true
  };
}
