export default function VaultForgeRoomDisclosure() {
  return (
    <section className="vf-room-disclosure">
      <style>{`
        .vf-room-disclosure {
          border: 1px solid rgba(245, 197, 91, 0.24);
          background: rgba(245, 197, 91, 0.06);
          border-radius: 18px;
          padding: 14px;
          color: #fef3c7;
          font-size: 13px;
          line-height: 1.5;
        }

        .vf-room-disclosure strong {
          color: #f5c55b;
        }
      `}</style>

      <strong>VaultForge 5S Matching Notice:</strong> Rooms may be routed to multiple qualified members,
      buyers, lenders, operators, capital partners, or execution specialists based on profile fit,
      geography, asset type, urgency, strategy, and execution capability. Matching is non-exclusive and
      designed to accelerate resolution, not guarantee outcome, ownership, funding, or deal rights.
      Keep rooms clean: Active means actionable now, Saved means intentionally monitored, Archived means
      reviewed/completed, and Hidden removes clutter from the command workflow.
    </section>
  );
}