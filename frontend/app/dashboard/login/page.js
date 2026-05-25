"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { api } from "../../../lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "owner@lomwong.local", password: "owner1234" });
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      const data = await api("/api/auth/login", { method: "POST", token: "", body: JSON.stringify(form) });
      localStorage.setItem("lomwong_token", data.token);
      localStorage.setItem("lomwong_user", JSON.stringify(data.user));
      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-md place-items-center px-4">
      <form onSubmit={submit} className="surface w-full rounded-3xl p-6">
        <p className="text-gold-light">Owner / Staff</p>
        <h1 className="mb-6 font-display text-4xl">Dashboard Login</h1>
        <div className="grid gap-4">
          <input className="field" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email" />
          <input className="field" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="password" />
          <button className="btn btn-primary"><LogIn size={18} />เข้าสู่ระบบ</button>
          {error && <p className="rounded-xl bg-red-500/15 p-3 text-red-200">{error}</p>}
        </div>
      </form>
    </div>
  );
}
