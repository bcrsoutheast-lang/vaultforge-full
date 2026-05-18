"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";

type Profile = {
  photo: string;
  fullName: string;
  company: string;
  email: string;
  phone: string;
  role: string;
  memberType: string;
  primaryMarket: string;
  contactStates: string;
  routingStates: string;
  counties: string;
  cities: string;
  assetTypes: string;
  dealTypes: string;
  painTypes: string;
  buyBox: string;
  capitalRange: string;
  lendingCapacity: string;
  operatorCapacity: string;
  contractorCapacity: string;
  services: string;
  preferredContact: string;
  responseTime: string;
  proofNotes: string;
  aiNotes: string;
};

const STORAGE_KEY = "vaultforge_clean_profile_v1";

const emptyProfile: Profile = {
  photo: "",
  fullName: "",
  company: "",
  email: "",
  phone: "",
  role: "",
  memberType: "",
  primaryMarket: "",
  contactStates: "",
  routingStates: "",
  counties: "",
  cities: "",
  assetTypes: "",
  dealTypes: "",
  painTypes: "",
  buyBox: "",
  capitalRange: "",
  lendingCapacity: "",
  operatorCapacity: "",
  contractorCapacity: "",
  services: "",
  preferredContact: "",
  responseTime: "",
  proofNotes: "",
  aiNotes: "",
};

function loadProfile(): Profile {
  if (typeof window === "undefined") return emptyProfile;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? { ...emptyProfile, ...JSON.parse(raw) } : emptyProfile;
  } catch {
    return emptyProfile;
  }
}

function saveProfile(profile: Profile) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

function countFilled(profile: Profile) {
  return Object.entries(profile).filter(([key, value]) => key !== "photo" && String(value || "").trim()).length;
}

function Field({
  label,
  name,
  value,
  onChange,
  placeholder,
  textarea = false,
}: {
  label: string;
  name: keyof Profile;
  value: string;
  onChange: (name: keyof Profile, value: string) => void;
  placeholder?: string;
  textarea?: boolean;
}) {
  return (
    <label className="vf-field">
      <span>{label}</span>
      {textarea ? (
        <textarea
          value={value}
          rows={4}
          placeholder={placeholder}
          onChange={(event) => onChange(name, event.target.value)}
        />
      ) : (
        <input
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(name, event.target.value)}
        />
      )}
    </label>
  );
}

export default function VaultForgeProfileClient() {
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [saved, setSaved] = useState("");

  useEffect(() => {
    setProfile(loadProfile());
  }, []);

  const filled = useMemo(() => countFilled(profile), [profile]);
  const routingScore = Math.min(100, Math.round((filled / 24) * 100));

  function update(name: keyof Profile, value: string) {
    setProfile((current) => ({ ...current, [name]: value }));
    setSaved("");
  }

  function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      setProfile((current) => ({
        ...current,
        photo: typeof reader.result === "string" ? reader.result : "",
      }));
      setSaved("");
    };

    reader.readAsDataURL(file);
  }

  function submit() {
    saveProfile(profile);
    setSaved("Profile saved locally. Next build can wire this same shape to Supabase.");
  }

  const aiRoutingText = [
    profile.memberType ? `Member type: ${profile.memberType}` : "",
    profile.routingStates ? `Can be routed by deal/pain location in: ${profile.routingStates}` : "",
    profile.contactStates ? `Can contact members/owners for: ${profile.contactStates}` : "",
    profile.assetTypes ? `Asset fit: ${profile.assetTypes}` : "",
    profile.dealTypes ? `Deal fit: ${profile.dealTypes}` : "",
    profile.painTypes ? `Pain fit: ${profile.painTypes}` : "",
    profile.capitalRange ? `Capital range: ${profile.capitalRange}` : "",
    profile.services ? `Services: ${profile.services}` : "",
  ].filter(Boolean);

  return (
    <section className="vf-profile">
      <style>{`
        .vf-profile {
          display: grid;
          gap: 16px;
        }

        .vf-profile-grid {
          display: grid;
          grid-template-columns: 320px minmax(0, 1fr);
          gap: 16px;
        }

        .vf-profile-photo {
          border: 1px solid rgba(245, 200, 76, .22);
          background: rgba(255,255,255,.045);
          border-radius: 24px;
          padding: 16px;
        }

        .vf-photo-box {
          height: 260px;
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,.14);
          background:
            radial-gradient(circle at top left, rgba(245,200,76,.18), transparent 34%),
            linear-gradient(135deg, #111827, #020617);
          display: grid;
          place-items: center;
          overflow: hidden;
          color: #94a3b8;
          font-weight: 900;
          text-align: center;
          padding: 16px;
        }

        .vf-photo-box img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .vf-upload {
          margin-top: 12px;
          width: 100%;
          box-sizing: border-box;
          color: #cbd5e1;
        }

        .vf-form-card {
          border: 1px solid rgba(245, 200, 76, .22);
          background: linear-gradient(145deg, rgba(16, 24, 36, .94), rgba(2, 6, 23, .98));
          border-radius: 24px;
          padding: 18px;
        }

        .vf-section-title {
          color: #f5c84c;
          font-size: 12px;
          font-weight: 950;
          letter-spacing: .18em;
          text-transform: uppercase;
          margin-bottom: 12px;
        }

        .vf-fields {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
          gap: 12px;
        }

        .vf-field {
          display: grid;
          gap: 7px;
        }

        .vf-field span {
          color: #cbd5e1;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: .08em;
          text-transform: uppercase;
        }

        .vf-field input,
        .vf-field textarea,
        .vf-field select {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid rgba(148,163,184,.22);
          background: rgba(2,6,23,.55);
          color: #fff;
          border-radius: 15px;
          padding: 13px 14px;
          font-size: 15px;
          outline: none;
        }

        .vf-field textarea {
          resize: vertical;
        }

        .vf-score-line {
          border: 1px solid rgba(148,163,184,.18);
          background: rgba(255,255,255,.045);
          border-radius: 18px;
          padding: 14px;
          color: #cbd5e1;
          line-height: 1.5;
        }

        .vf-score-line strong {
          color: #f5c84c;
          font-size: 28px;
          letter-spacing: -.04em;
        }

        .vf-ai-list {
          display: grid;
          gap: 8px;
          margin: 12px 0 0;
        }

        .vf-ai-list div {
          border: 1px solid rgba(148,163,184,.16);
          background: rgba(255,255,255,.045);
          border-radius: 14px;
          padding: 10px;
          color: #dbeafe;
          font-size: 14px;
          line-height: 1.4;
        }

        .vf-profile-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 14px;
        }

        .vf-profile-actions button {
          border-radius: 999px;
          padding: 12px 15px;
          font-weight: 950;
          cursor: pointer;
          border: 0;
          color: #111827;
          background: linear-gradient(135deg,#fde68a,#e8c46b);
        }

        .vf-note {
          color: #86efac;
          font-size: 14px;
          line-height: 1.4;
          margin-top: 10px;
        }

        @media (max-width: 820px) {
          .vf-profile-grid {
            grid-template-columns: 1fr;
          }

          .vf-photo-box {
            height: 220px;
          }
        }
      `}</style>

      <div className="vf-profile-grid">
        <aside className="vf-profile-photo">
          <div className="vf-section-title">Profile Picture</div>

          <div className="vf-photo-box">
            {profile.photo ? <img src={profile.photo} alt="Profile preview" /> : "Upload profile photo / company logo"}
          </div>

          <input className="vf-upload" type="file" accept="image/*" onChange={handlePhoto} />

          <div className="vf-score-line" style={{ marginTop: 14 }}>
            <div>AI routing profile completeness</div>
            <strong>{routingScore}%</strong>
            <p style={{ margin: "8px 0 0" }}>
              More complete profiles improve routing, alerts, matches, and member contact quality.
            </p>
          </div>
        </aside>

        <div className="vf-profile">
          <section className="vf-form-card">
            <div className="vf-section-title">Identity + Contact</div>

            <div className="vf-fields">
              <Field label="Full Name" name="fullName" value={profile.fullName} onChange={update} />
              <Field label="Company" name="company" value={profile.company} onChange={update} />
              <Field label="Email" name="email" value={profile.email} onChange={update} />
              <Field label="Phone" name="phone" value={profile.phone} onChange={update} />
              <Field label="Role / Title" name="role" value={profile.role} onChange={update} placeholder="Owner, lender, buyer, operator, contractor..." />
              <Field label="Member Type" name="memberType" value={profile.memberType} onChange={update} placeholder="Investor, lender, operator, wholesaler, contractor..." />
            </div>
          </section>

          <section className="vf-form-card">
            <div className="vf-section-title">AI Routing + Alerts</div>

            <p className="vf-copy" style={{ marginTop: 0 }}>
              Routing and alerts should be based on where the deal/pain/info is located and what the member can actually solve,
              not just “states operated in.”
            </p>

            <div className="vf-fields">
              <Field label="Primary Market" name="primaryMarket" value={profile.primaryMarket} onChange={update} placeholder="Atlanta, North GA, Tampa..." />
              <Field label="Alert / Routing States" name="routingStates" value={profile.routingStates} onChange={update} placeholder="GA, TN, AL, FL, NC, SC, TX..." />
              <Field label="Contact States" name="contactStates" value={profile.contactStates} onChange={update} placeholder="States where this member should be contacted for relevant info" />
              <Field label="Counties" name="counties" value={profile.counties} onChange={update} placeholder="Bartow, Cobb, Fulton, Hillsborough..." />
              <Field label="Cities" name="cities" value={profile.cities} onChange={update} placeholder="Atlanta, Rome, Tampa, Charlotte..." />
              <Field label="Preferred Contact" name="preferredContact" value={profile.preferredContact} onChange={update} placeholder="Text, call, email, in-app message" />
              <Field label="Response Time" name="responseTime" value={profile.responseTime} onChange={update} placeholder="Immediate, same day, 24 hours..." />
            </div>
          </section>

          <section className="vf-form-card">
            <div className="vf-section-title">Deal + Pain Fit</div>

            <div className="vf-fields">
              <Field label="Asset Types" name="assetTypes" value={profile.assetTypes} onChange={update} placeholder="SFR, multifamily, land, commercial..." />
              <Field label="Deal Types" name="dealTypes" value={profile.dealTypes} onChange={update} placeholder="Flip, buy hold, wholesale, JV, lending..." />
              <Field label="Pain Types They Can Solve" name="painTypes" value={profile.painTypes} onChange={update} placeholder="Funding gap, stalled construction, operator needed..." />
              <Field label="Buy Box" name="buyBox" value={profile.buyBox} onChange={update} textarea placeholder="Price, ARV, location, asset, timing, condition..." />
              <Field label="Capital Range" name="capitalRange" value={profile.capitalRange} onChange={update} placeholder="$50K-$500K, $1M+, debt/equity/JV..." />
              <Field label="Lending Capacity" name="lendingCapacity" value={profile.lendingCapacity} onChange={update} placeholder="Hard money, bridge, DSCR, private capital..." />
              <Field label="Operator Capacity" name="operatorCapacity" value={profile.operatorCapacity} onChange={update} placeholder="GC, PM, boots on ground, asset management..." />
              <Field label="Contractor Capacity" name="contractorCapacity" value={profile.contractorCapacity} onChange={update} placeholder="Roofing, HVAC, full rehab, emergency work..." />
              <Field label="Services / Value Provided" name="services" value={profile.services} onChange={update} textarea placeholder="What can this member actually do when routed a room?" />
            </div>
          </section>

          <section className="vf-form-card">
            <div className="vf-section-title">Proof + AI Notes</div>

            <div className="vf-fields">
              <Field label="Proof / Credentials" name="proofNotes" value={profile.proofNotes} onChange={update} textarea placeholder="Track record, capital proof, references, license, lender terms..." />
              <Field label="Private AI Matching Notes" name="aiNotes" value={profile.aiNotes} onChange={update} textarea placeholder="Anything AI should know when routing deals, pain rooms, alerts, and contact opportunities." />
            </div>

            <div className="vf-score-line" style={{ marginTop: 14 }}>
              <strong>AI Routing Read</strong>
              {aiRoutingText.length ? (
                <div className="vf-ai-list">
                  {aiRoutingText.map((item) => (
                    <div key={item}>{item}</div>
                  ))}
                </div>
              ) : (
                <p style={{ margin: "8px 0 0" }}>
                  Fill profile fields to generate the AI routing read.
                </p>
              )}
            </div>

            <div className="vf-profile-actions">
              <button type="button" onClick={submit}>Save Profile</button>
            </div>

            {saved ? <div className="vf-note">{saved}</div> : null}
          </section>
        </div>
      </div>
    </section>
  );
}