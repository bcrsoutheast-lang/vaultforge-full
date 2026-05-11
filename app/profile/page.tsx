"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import VaultForgeMemberNav from "../components/VaultForgeMemberNav";

const STATES = [
  "Georgia",
  "Florida",
  "North Carolina",
  "South Carolina",
  "Tennessee",
  "Alabama",
  "Texas",
];

function clean(value: unknown) {
  return String(value || "").trim();
}

function cleanEmail(value: unknown) {
  return clean(value).toLowerCase();
}

function readCookie(name: string) {
  if (typeof document === "undefined") return "";

  const match = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  if (!match) return "";

  try {
    return decodeURIComponent(match.slice(name.length + 1));
  } catch {
    return match.slice(name.length + 1);
  }
}

function getEmail() {
  if (typeof window === "undefined") return "";

  return cleanEmail(
    window.localStorage.getItem("vf_email") ||
      window.sessionStorage.getItem("vf_email") ||
      readCookie("vf_email")
  );
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.15), transparent 30%), linear-gradient(180deg,#020303,#071326 55%,#020303)",
  color: "white",
  padding: "20px 16px 100px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = {
  width: "min(1100px,100%)",
  margin: "0 auto",
};

const card: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.24)",
  borderRadius: 28,
  padding: 24,
  background: "rgba(255,255,255,.05)",
  marginBottom: 18,
};

const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,.16)",
  background: "rgba(255,255,255,.08)",
  color: "white",
  padding: 14,
  fontSize: 16,
};

const label: React.CSSProperties = {
  color: "#e8c46b",
  fontWeight: 900,
  fontSize: 12,
  letterSpacing: ".16em",
  marginBottom: 8,
  textTransform: "uppercase",
};

const button: React.CSSProperties = {
  borderRadius: 999,
  padding: "14px 20px",
  border: 0,
  background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
  color: "#06100a",
  fontWeight: 900,
  cursor: "pointer",
};

export default function ProfilePage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("Loading profile...");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    company: "",
    phone: "",
    home_state: "Georgia",
    deal_states: ["Georgia"],
    network_accepted: true,
    profile_photo_url: "",
  });

  async function loadProfile() {
    const currentEmail = getEmail();
    setEmail(currentEmail);

    try {
      const res = await fetch(`/api/profile?email=${encodeURIComponent(currentEmail)}`, {
        cache: "no-store",
      });

      const data = await safeJson(res);

      const profile = data.profile || data.data || {};

      setForm({
        full_name: clean(profile.full_name),
        company: clean(profile.company),
        phone: clean(profile.phone),
        home_state: clean(profile.home_state || "Georgia"),
        deal_states: Array.isArray(profile.deal_states)
          ? profile.deal_states.filter((x: string) => STATES.includes(x))
          : ["Georgia"],
        network_accepted: profile.network_accepted !== false,
        profile_photo_url: clean(profile.profile_photo_url),
      });

      setStatus("Profile loaded.");
    } catch {
      setStatus("Could not load profile.");
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  async function uploadFile(file: File) {
    const body = new FormData();
    body.append("file", file);

    const res = await fetch("/api/uploads/pain", {
      method: "POST",
      body,
    });

    const data = await safeJson(res);

    return clean(
      data.publicUrl ||
        data.url ||
        data.photo_url ||
        data.image_url
    );
  }

  async function saveProfile() {
    setSaving(true);
    setStatus("Saving profile...");

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          full_name: form.full_name,
          company: form.company,
          phone: form.phone,
          home_state: form.home_state,
          deal_states: form.deal_states,
          network_accepted: form.network_accepted,
          profile_photo_url: form.profile_photo_url,
        }),
      });

      const data = await safeJson(res);

      if (!res.ok || data.ok === false) {
        throw new Error(
          clean(data.error || data.message || "Profile save failed.")
        );
      }

      setStatus("Profile saved.");
    } catch (error: any) {
      setStatus(
        clean(error?.message || "Could not save profile.")
      );
    } finally {
      setSaving(false);
    }
  }

  const routingScore = useMemo(() => {
    return 100;
  }, []);

  return (
    <main style={page}>
      <div style={wrap}>
        <VaultForgeMemberNav
          title="Profile"
          subtitle="Network identity, state intelligence, and execution profile."
          active="profile"
        />

        <section style={card}>
          <div style={{ color: "#e8c46b", fontWeight: 900, letterSpacing: ".16em", fontSize: 12 }}>
            MEMBER PROFILE
          </div>

          <h1 style={{ fontSize: "clamp(52px,9vw,96px)", lineHeight: .92, margin: "10px 0 18px", letterSpacing: "-.06em" }}>
            Network identity.
          </h1>

          <p style={{ color: "#cbd5e1", fontSize: 18, lineHeight: 1.5 }}>
            Upload a real profile photo, set your home state, select where you deal,
            and keep your routing profile clean.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 18 }}>
            <div style={{ border: "1px solid rgba(255,255,255,.14)", borderRadius: 999, padding: "8px 14px" }}>
              Email: {email || "unknown"}
            </div>

            <div style={{ border: "1px solid rgba(255,255,255,.14)", borderRadius: 999, padding: "8px 14px" }}>
              Routing score: {routingScore}
            </div>

            <div style={{ border: "1px solid rgba(157,243,191,.22)", color: "#9df3bf", borderRadius: 999, padding: "8px 14px" }}>
              Network: Accepted
            </div>
          </div>
        </section>

        <section style={card}>
          <h2 style={{ marginTop: 0 }}>{status}</h2>
        </section>

        <section style={card}>
          <div style={{ color: "#e8c46b", fontWeight: 900, letterSpacing: ".16em", fontSize: 12, marginBottom: 16 }}>
            PROFILE BASICS
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
            <div>
              <div style={label}>Name</div>
              <input
                style={input}
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              />
            </div>

            <div>
              <div style={label}>Company</div>
              <input
                style={input}
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
              />
            </div>

            <div>
              <div style={label}>Phone</div>
              <input
                style={input}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            <div>
              <div style={label}>Profile Photo</div>

              <input
                type="file"
                accept="image/*"
                style={input}
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;

                  setStatus("Uploading profile photo...");

                  try {
                    const url = await uploadFile(file);

                    if (!url) {
                      throw new Error("Upload failed.");
                    }

                    setForm({
                      ...form,
                      profile_photo_url: url,
                    });

                    setStatus("Photo uploaded.");
                  } catch (error: any) {
                    setStatus(error?.message || "Upload failed.");
                  }
                }}
              />

              <div style={{ color: "#cbd5e1", marginTop: 8 }}>
                Use phone pictures or upload a file. No URL needed.
              </div>
            </div>
          </div>

          {form.profile_photo_url ? (
            <div style={{ marginTop: 20 }}>
              <img
                src={form.profile_photo_url}
                alt="Profile"
                style={{
                  width: "100%",
                  maxHeight: 420,
                  objectFit: "cover",
                  borderRadius: 22,
                  border: "1px solid rgba(232,196,107,.20)",
                }}
              />
            </div>
          ) : null}
        </section>

        <section style={card}>
          <div style={{ color: "#e8c46b", fontWeight: 900, letterSpacing: ".16em", fontSize: 12, marginBottom: 16 }}>
            STATE INTELLIGENCE
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
            <div>
              <div style={label}>Where are you from?</div>

              <select
                style={input}
                value={form.home_state}
                onChange={(e) =>
                  setForm({
                    ...form,
                    home_state: e.target.value,
                  })
                }
              >
                {STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div style={label}>Where do you deal?</div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {STATES.map((state) => {
                  const selected = form.deal_states.includes(state);

                  return (
                    <button
                      key={state}
                      type="button"
                      onClick={() => {
                        setForm({
                          ...form,
                          deal_states: selected
                            ? form.deal_states.filter((x) => x !== state)
                            : [...form.deal_states, state],
                        });
                      }}
                      style={{
                        borderRadius: 999,
                        padding: "10px 14px",
                        border: selected
                          ? "1px solid rgba(157,243,191,.40)"
                          : "1px solid rgba(255,255,255,.16)",
                        background: selected
                          ? "rgba(157,243,191,.12)"
                          : "rgba(255,255,255,.06)",
                        color: selected ? "#9df3bf" : "white",
                        cursor: "pointer",
                        fontWeight: 800,
                      }}
                    >
                      {state}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section style={card}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <button
              type="button"
              style={button}
              disabled={saving}
              onClick={saveProfile}
            >
              {saving ? "Saving..." : "Save Profile"}
            </button>

            <Link href="/members" style={{
              borderRadius: 999,
              padding: "14px 20px",
              border: "1px solid rgba(255,255,255,.14)",
              background: "rgba(255,255,255,.06)",
              color: "white",
              textDecoration: "none",
              fontWeight: 900,
            }}>
              Back to Members
            </Link>

            <button
              type="button"
              style={{
                borderRadius: 999,
                padding: "14px 20px",
                border: "1px solid rgba(255,255,255,.14)",
                background: "rgba(255,255,255,.06)",
                color: "white",
                fontWeight: 900,
              }}
              onClick={loadProfile}
            >
              Reload Profile
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
