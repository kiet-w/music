# Plan P1-1: Unify YouTube Download Pipeline & Disable music-ai-service

This plan outlines the steps taken to decommission the standalone Python-based `music-ai-service` and unify the YouTube audio download and conversion pipeline under the NestJS backend and BullMQ worker architecture.

## 1. Rationale

- **Architectural Simplicity**: Running two parallel downloader engines (Python FastAPI on port 8001 and NestJS on port 4000) increases maintenance overhead.
- **Resource Efficiency**: Removing the legacy Python service (API + Worker) saves container memory and CPU cycles.
- **Unified Pipeline**: Consolidating all background queue-based tasks (YouTube downloading, metadata fetching, and database storage) to NestJS + BullMQ ensures a single source of truth for conversions.

## 2. Implementation Steps

1. **Service Decommissioning**:
   - Comment out `music-ai-api` and `worker` services in `docker-compose.yml`.
   - Add comments explaining that these services are disabled in favor of NestJS + BullMQ.

2. **Frontend Migration Notice**:
   - Update `frontend/src/app/[locale]/youtube/page.tsx` to remove direct calls to port `8001` (Python API).
   - Display a beautifully designed notice notifying users that the downloader has been migrated to the unified NestJS downloader on the Music Page.
   - Provide an action button linking directly to the new downloader page at `/[locale]/music`.

3. **Documentation**:
   - Save the detailed plan in `docs/superpowers/plans/plan-p1-1.md`.
   - Record completion status in `docs/superpowers/plans/readme-p1-1.md`.

## 3. Verification Plan

- Check that `docker-compose.yml` does not spin up `music-ai-api` or `worker` containers.
- Verify that navigating to `/youtube` on the frontend shows the beautiful migration notice and provides a link to `/music`.
- Ensure no queries are sent to `http://localhost:8001` from the frontend.
