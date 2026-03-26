
// js/auth.js
export const BASE_URL = "https://exam-backend-cu62.onrender.com";
export let currentToken = localStorage.getItem("token");

export function setToken(token) {
  currentToken = token;
  if (token) localStorage.setItem("token", token);
  else localStorage.removeItem("token");
}

export function showError(container, message) {
  container.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
  container.style.display = "block";
}
export function hideError(container) {
  container.style.display = "none";
  container.innerHTML = "";
}

export async function register(school, email, password, confirm) {
  if (!school || !email || !password) return { ok: false, message: "All fields required" };
  if (password !== confirm) return { ok: false, message: "Passwords do not match" };
  if (password.length < 6) return { ok: false, message: "Password min 6 chars" };

  try {
    const res = await fetch(`${BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schoolName: school, email, password })
    });
    const data = await res.json();
    if (res.ok) {
      return { ok: true, message: data.message };
    } else {
      return { ok: false, message: data.message || "Registration failed" };
    }
  } catch (err) {
    return { ok: false, message: "Network error" };
  }
}

export async function login(email, password) {
  if (!email || !password) return { ok: false, message: "Email and password required" };

  try {
    const res = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.token) {
      setToken(data.token);
      return { ok: true, token: data.token };
    } else {
      return { ok: false, message: data.message || "Invalid credentials" };
    }
  } catch (err) {
    return { ok: false, message: "Server error" };
  }
}

export function logout() {
  setToken(null);
  // Refresh page or call UI reset
}
