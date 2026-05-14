// PATCH NOTES
// Stronger dedupe + richest row preference
// Replace your existing canonicalKey logic with a stronger fingerprint:
// title + market + price + first photo + owner
//
// IMPORTANT:
// Keep vf_deals as highest priority source.
// Prevent weak routing/activity rows from surfacing standalone.
// Existing normalizeDeal() structure should remain intact.
