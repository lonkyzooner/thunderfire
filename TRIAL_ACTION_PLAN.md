# LARK Trial-Ready Action Plan  
_Aim: deliver a minimal yet complete field-trial build for a rural-Louisiana solo-officer pilot._

---

## Sprint Cadence
* **Sprint Length:** 1 week  
* **Daily Stand-Up:** 09:00 CST (15 min)  
* **Demo & Retro:** Fridays 15:00 CST  

---

## Week 1 – Realtime & Compliance Foundations

| # | Task | Linked Files / Location | Definition of Done |
|---|------|------------------------|--------------------|
| 1 | Design Supabase channel schemas (`officer_locations`, `threat_events`) | `/supabase/sql/2025-trial-schema.sql` | SQL migration merged & visible in Supabase dashboard |
| 2 | Extend geo publisher ‑ 5 s heartbeat | `src/utils/locationTracker.ts` | Emits correct JSON validated via Supabase console |
| 3 | Publish threat alerts | `src/services/safety/ThreatDetectionService.ts` | Simulated gunshot triggers message in `threat_events` |
| 4 | Realtime subscriptions in UI | `src/components/OfficerMap.tsx`, `src/components/IncidentTimeline.tsx` | Toast + map marker appear <200 ms on local LAN |
| 5 | Basic compliance checks (Miranda, camera, gunshot) | `src/database/models/UsageLog.js`, `src/components/MirandaWorkflow.tsx` | Unit tests verify row insertions |
| 6 | Service-worker precache statutes & Miranda | `public/service-worker.js` | Chrome DevTools offline shows cache hits |
| 7 | CI gate on Jest + Playwright (>75 % cov.) | `.github/workflows/ci.yml` | PR blocked if tests fail or coverage <75 % |

---

## Week 2 – Multilingual & Dispatch Automation

| # | Task | Linked Files / Location | Definition of Done |
|---|------|------------------------|--------------------|
| 8 | Add multilingual Miranda JSON (en/es/zh/fr) | `src/data/miranda-rights.json` | JSON lint passes & reviewed by counsel |
| 9 | Hook: `useMiranda` (local → translate fallback) | `src/hooks/useMiranda.ts` | Returns correct language string in unit tests |
|10 | Quick-action buttons (Miranda, Statute, Backup) | `src/components/NewDashboard.tsx` | Buttons visible & functional in dev build |
|11 | CAD dispatch webhook integration | `server/routes/usage.js` | cURL to mock endpoint receives JSON |
|12 | “Trial Mode” ribbon + status indicators | `src/components/NewDashboard.tsx` | UI matches design spec |
|13 | Playwright flows for multilingual & dispatch | `tests/` | All new tests pass locally & CI |

---

## Week 3 – Security, Polish & Field Test

| # | Task | Linked Files / Location | Definition of Done |
|---|------|------------------------|--------------------|
|14 | Enable RLS for new tables | `SUPABASE_INTEGRATION_PLAN.md`, SQL | Policies applied; select/insert tests succeed |
|15 | Rate-limit OpenAI & translate routes | `src/lib/openai-service.ts`, `server/routes/translate.js` | Burst test returns 429 after limits exceeded |
|16 | Offline banner via `useOfflineSupport` | `src/hooks/useOfflineSupport.ts` | Banner toggles when Wi-Fi disabled |
|17 | Telemetry funnel (`usage_events`) | `src/services/OrchestratorService.ts` | Table populated during smoke test |
|18 | Field-test protocol doc | `docs/field-test-protocol.md` | Pilot officers briefed & sign-off obtained |
|19 | Bug triage & tag `v1.0-trial` | Release checklist | Git tag pushed; CHANGELOG updated |

---

## Cross-Cutting Acceptance Criteria
1. **Latency:** Threat → UI alert < 200 ms (local network).  
2. **Coverage:** ≥ 80 % Jest + Playwright.  
3. **Security:** All secrets via Doppler/Vercel; no hard-coded keys.  
4. **Offline:** Statute & Miranda lookups work with Wi-Fi disabled.  
5. **Demo Script:** “Domestic disturbance” scenario runs end-to-end without DB hacks.

---

## Helpful Commands
```bash
# Start backend and Supabase listener
npm run dev:server

# Start Vite + PWA
npm run dev

# Seed local Supabase with demo officer
npm run seed:demo-officer
```

---

_Update this file each stand-up: tick checkboxes, link PRs, and note blockers._
