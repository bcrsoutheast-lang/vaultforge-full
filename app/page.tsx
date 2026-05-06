// SAFE HOMEPAGE WORDING PATCH
// Replace ONLY the homepage CTA wording sections inside your current app/page.tsx

// CHANGE:
{/* OLD */}
{/* Build Your Profile */}

// TO:
{/* Create Member Access */}


// CHANGE:
{/* OLD */}
{/* View Member Command Center */}

// TO:
{/* Preview Member Command Center */}


// CHANGE ANY COPY THAT SAYS:
{/* "Build your profile now" */}

// TO:
{/* "Create your member access account first. Then train your profile and AI routing preferences inside the command center." */}


// ADD THIS PUBLIC FLOW SECTION TO THE HOMEPAGE:

<section
  style={{
    marginTop: 26,
    border: "1px solid rgba(255,255,255,.13)",
    background: "rgba(255,255,255,.04)",
    borderRadius: 30,
    padding: 24,
  }}
>
  <div
    style={{
      color: "#e8c46b",
      letterSpacing: 5,
      fontWeight: 900,
      fontSize: 13,
      marginBottom: 14,
      textTransform: "uppercase",
    }}
  >
    HOW ACCESS WORKS
  </div>

  <h2
    style={{
      fontSize: "clamp(38px,8vw,72px)",
      lineHeight: 0.95,
      margin: "0 0 14px",
      letterSpacing: -2,
    }}
  >
    Create access. Train your profile. Unlock the network.
  </h2>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
      gap: 18,
      marginTop: 22,
    }}
  >
    <div
      style={{
        border: "1px solid rgba(255,255,255,.13)",
        borderRadius: 24,
        padding: 22,
        background: "rgba(255,255,255,.03)",
      }}
    >
      <div style={{ color: "#9df3bf", fontWeight: 900 }}>STEP 1</div>
      <h3 style={{ fontSize: 26 }}>Create Member Access</h3>
      <p style={{ color: "rgba(255,255,255,.7)", lineHeight: 1.5 }}>
        Create your account to enter the VaultForge ecosystem and access the preview command center.
      </p>
    </div>

    <div
      style={{
        border: "1px solid rgba(255,255,255,.13)",
        borderRadius: 24,
        padding: 22,
        background: "rgba(255,255,255,.03)",
      }}
    >
      <div style={{ color: "#9df3bf", fontWeight: 900 }}>STEP 2</div>
      <h3 style={{ fontSize: 26 }}>Train Your AI Profile</h3>
      <p style={{ color: "rgba(255,255,255,.7)", lineHeight: 1.5 }}>
        Define your markets, buy box, strategy, roles, project types, needs, and what you can provide.
      </p>
    </div>

    <div
      style={{
        border: "1px solid rgba(255,255,255,.13)",
        borderRadius: 24,
        padding: 22,
        background: "rgba(255,255,255,.03)",
      }}
    >
      <div style={{ color: "#9df3bf", fontWeight: 900 }}>STEP 3</div>
      <h3 style={{ fontSize: 26 }}>Unlock Full Access</h3>
      <p style={{ color: "rgba(255,255,255,.7)", lineHeight: 1.5 }}>
        Founding members unlock the full Member Command Center, smart alerts, network routing, deal rooms, and messaging.
      </p>
    </div>
  </div>
</section>
