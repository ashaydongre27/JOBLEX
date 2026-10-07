# Master Fix & Weakpoint Audit Plan (JOBLEX Platform)

This directory contains comprehensive, actionable technical fix plans addressing all potential weakpoints and edge cases discovered during the deep codebase audit.

---

## Index of Fix Plans

| Plan File | Area | Key Weakpoint Addressed | Priority |
| :--- | :--- | :--- | :---: |
| [01_RECOMMENDATIONS_ENGINE_FIX_PLAN.md](./01_RECOMMENDATIONS_ENGINE_FIX_PLAN.md) | **AI & Matching** | Hybrid ID matching, UUID vs string user ID handling, fallback score resilience. | **P1** |
| [02_DATABASE_SCHEMA_DRIFT_AND_APPLICATION_SYNC_PLAN.md](./02_DATABASE_SCHEMA_DRIFT_AND_APPLICATION_SYNC_PLAN.md) | **Database & API** | Postgres schema cache drift (`PGRST204`), column variance, payload auto-stripping. | **P0** |
| [03_PROFILE_AND_ONBOARDING_SYNC_PLAN.md](./03_PROFILE_AND_ONBOARDING_SYNC_PLAN.md) | **Student Portal** | Bidirectional synchronization between `public.profiles` and `student_profile` jsonb. | **P1** |
| [04_NOTIFICATION_ENGINE_AND_SSE_RELIABILITY_PLAN.md](./04_NOTIFICATION_ENGINE_AND_SSE_RELIABILITY_PLAN.md) | **Real-Time Stream** | Multi-identifier & case-insensitive notification delivery, auto-read clickthroughs. | **P1** |
| [05_AI_FAILOVER_TIMEOUTS_AND_OFFLINE_CONTINUITY_PLAN.md](./05_AI_FAILOVER_TIMEOUTS_AND_OFFLINE_CONTINUITY_PLAN.md) | **LLM Orchestration** | 12s per-provider abort controller timeout guards, rich contextual fallback. | **P1** |
| [06_ACADEMY_INDUSTRY_MOU_AND_CURRICULUM_SYNC_PLAN.md](./06_ACADEMY_INDUSTRY_MOU_AND_CURRICULUM_SYNC_PLAN.md) | **Bilateral Sync** | Institution name normalization, bilateral MoU lifecycle sync between Dean & Industry. | **P2** |
| [07_SESSION_AUTO_RECOVERY_AND_AUTH_INTERCEPTOR_PLAN.md](./07_SESSION_AUTO_RECOVERY_AND_AUTH_INTERCEPTOR_PLAN.md) | **Frontend Auth** | Global 401 interceptor in `api-client.js`, non-disruptive session renewal dialog. | **P1** |

---

## Architecture Summary
Each plan defines:
1. Root-cause vulnerability analysis and file locations.
2. Concrete potential failure scenarios.
3. Drop-in, step-by-step code implementations and validation guidelines.
