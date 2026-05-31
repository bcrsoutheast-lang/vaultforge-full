export function getAuctionTerms(state: string, deal: any) {
  const base = `
VAULTFORGE AUCTION TERMS - ${state.toUpperCase()}
This is a RESERVE online auction. Seller reserves right to reject any/all bids.
Property sold AS-IS, WHERE-IS with no warranties expressed or implied.
Buyer Premium: 2% added to winning bid. Platform fee.
Winning bidder must deposit 15% earnest money to designated title company within 24 hours of auction close.
Bids placed in final 2:00 of auction extend end time by 2:00.
No cooling-off period. All bids are binding and irrevocable.
`

  const stateTerms: Record<string, string> = {
    TX: `
TX-SPECIFIC TERMS - TX Occupations Code Chapter 1802
• Online Auction Exempt per TX Occ Code §1802.051. No auctioneer license required.
• Seller to provide TREC Seller's Disclosure Form T-64 per TX Prop Code §5.008.
• Property marketed by licensed TX broker. See broker details below.
• No right of redemption applies to private sales.
• Venue: ${deal.county || 'County'}, Texas.
`,
    GA: `
GA-SPECIFIC TERMS - GA Code Title 43 Chapter 6
• Auction conducted by GA licensed auctioneer. See license below.
• Seller to provide GA Seller's Property Disclosure per GA Code §44-14-162.
• 10-day right of rescission may apply if disclosure not provided prior to bidding.
`,
    CA: `
CA-SPECIFIC TERMS - CA Business & Professions Code
• Seller to provide Natural Hazard Disclosure + Transfer Disclosure Statement.
• 3-day right to cancel after receipt of disclosures per CA Civil Code §1102.3.
`,
    FL: `
FL-SPECIFIC TERMS - FL Statutes Chapter 475
• Seller to provide Seller's Disclosure + HOA/Condo docs if applicable.
• Buyer responsible for HOA estoppel fees.
`
  }

  const broker = `
BROKERAGE INFORMATION:
Marketed by: ${deal.broker_company || '[Pending]'}
Broker License #: ${deal.broker_license || '[Pending]'}
Agent: ${deal.agent_name || '[Pending]'} | Lic #${deal.agent_license || '[Pending]'}
Brokerage Address: ${deal.brokerage_address || '[Pending]'}
${deal.auctioneer_license? `Auctioneer License #: ${deal.auctioneer_license}` : ''}
`

  return base + (stateTerms[state] || '') + broker
}
