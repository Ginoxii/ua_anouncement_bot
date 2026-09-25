import { useState } from "react";
import { useRouter } from "next/router";

export default function Login() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function submit(e) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.push("/dashboard");
    } else {
      setError("Mot de passe incorrect");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={submit} className="card rounded-2xl p-8 w-full max-w-sm shadow-xl">
        <h1 className="text-2xl font-semibold mb-1 text-white">📡 Broadcast Telegram</h1>
        <p className="text-sm text-white/50 mb-6">Connecte-toi pour accéder au tableau de bord</p>
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-white/30 outline-none focus:border-brand-400 mb-3"
        />
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        <button className="w-full bg-brand-500 hover:bg-brand-600 transition rounded-lg py-3 font-medium text-white">
          Se connecter
        </button>
      </form>
    </div>
  );
}
