export const VAULTFORGE_CANONICAL_PRODUCT = {
  memberNav: ["Dashboard", "Deal Rooms", "Pain", "Pain Rooms", "Messages", "Profile"],
  retiredRoutes: {
    "/opportunity-rooms": "/deal-rooms",
    "/projects": "/deal-rooms",
    "/deal": "/deal-rooms",
    "/pain-feed": "/pain-rooms",
    "/pressure-rooms": "/pain-rooms",
  },
  rule: "Deal Rooms and Pain Rooms are the only room lanes. Pain is intake. Alerts, routing, intelligence, messages, profiles, scores, and signals attach inside rooms.",
};
