
VaultForge Visual Layer

File added:
app/components/VaultForgeVisualLayer.tsx

This is a shared visual layer only. It does not touch auth, APIs, RLS, middleware, payments, or existing page logic.

Available components:
- VaultForgePulseStrip
- VaultForgeCommandFooter
- VaultForgeSectionHeader
- VaultForgeSignalBar

Use later by importing:
import { VaultForgePulseStrip, VaultForgeCommandFooter, VaultForgeSignalBar } from "../components/VaultForgeVisualLayer";

Then place safely inside a page under VaultForgeMemberNav.
