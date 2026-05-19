"use client";

export default function PainIntakePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#05070d",
        color: "#fff",
        padding: 24,
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          border: "1px solid rgba(255,215,0,.2)",
          borderRadius: 24,
          padding: 28,
          background:
            "linear-gradient(135deg, rgba(10,14,30,.96), rgba(5,7,13,.98))",
        }}
      >
        <div
          style={{
            color: "#f5d15f",
            letterSpacing: 6,
            fontWeight: 800,
            marginBottom: 12,
          }}
        >
          PAIN INTAKE
        </div>

        <h1
          style={{
            fontSize: 56,
            lineHeight: 1,
            margin: 0,
            fontWeight: 900,
          }}
        >
          Pain Intake Stable Compile Fix
        </h1>

        <p
          style={{
            marginTop: 20,
            color: "#c8d1e4",
            fontSize: 18,
            lineHeight: 1.7,
          }}
        >
          This file removes the CONTROL compile error and restores a safe compiling page.
        </p>
      </div>
    </main>
  );
}
