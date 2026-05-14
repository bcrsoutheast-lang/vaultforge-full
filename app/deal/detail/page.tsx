// PATCH NOTES
// Deal detail page issue:
// field rendering is correct, but many duplicate rows are partial rows.
// Use richer fallback chain:
//
// occupancy:
// occupancy -> occupancy_status -> tenant_status
//
// zoning:
// zoning -> zoning_type
//
// utilities:
// utilities -> utility_access
//
// road access:
// road_access -> access
//
// seller situation:
// seller_situation -> distress_signals -> private_notes -> access_notes
//
// Also:
// hide cards where ALL major fields are empty.
//
// Major fields:
// ask, arv, repairs, beds, baths, sqft, strategy
