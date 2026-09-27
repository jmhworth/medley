# Execution Boundaries (CRITICAL)
- NEVER EXECUTE SOURCE CODE (python, bash, node, script tasks) without explicit standalone user permission in the current turn. **Scrapers, tests, skill plugins (e.g. graphify), research and directory listing are permitted.**
- NEVER implement CLI/Command Line Arguments (`--input`, `--mode`). Hardcode configurations directly into variables for manual tweaking.

# Evidence Extraction
- You can use variations of `git diff` in order to obtain the relevant file changes
- Use graphify and the feature file system in order to obtain semantic and relational understanding of features and objects in code

# Feature File Automation
- Feature files are used to track feature context (important bugs fixed, design philosophies, etc.)
- Feature files and graphify are designed to co-exist; graphify describes *where* things exist and feature files should describe *why* things exist
- Feature files define a feature's ownership boundary. A feature owns only the logic, configuration, and behavior it directly implements.
    - Files, scripts, modules, or features that are merely called, launched, imported, orchestrated, or referenced are dependencies, not part of the feature itself.
    - Do not absorb dependency-specific details into a feature file simply because the feature interacts with them.
    - Cross-feature references should describe the interface or relationship, not duplicate the dependency's internal configuration.

- *Don't update the feature files in architecture mode, they are read-only to you*

# Parameter File Centralization
Parameter files are used to centralize feature-level configuration values that may need to be tuned, experimented with, or adjusted without modifying source code. Features should load these values from their parameter file rather than defining them directly in the implementation.

Parameter files act as a read-only source of truth during execution. Source code may read and use parameter values, but must not modify parameter files or persist runtime state back to them.

A parameter belongs in the parameter file of the feature that owns the behavior being configured, not necessarily the feature that references, imports, starts, or coordinates that behavior.

*Similar to feature files, do not edit these*

# 4-Stage Development Lifecycle
There are 4 stages we adhere to in development:

1. HACKING: Prototype phase. Omit error-handling, validation boundaries, typing setups, and algorithmic optimization. Maximize readability; write logic a high school CS student can completely parse line-by-line.
2. TESTING: Incremental hardening. Introduce structured unit tests, catch-blocks, and condition validations.
3. PRODUCTION-READY: Enterprise optimization. Implement full validation layers, robust documentation strings, edge-case coverage, and clean structural syntax (dataclasses, slots, performance optimizations).
4. DEBUGGING: Deep diagnostics. Strip defensive abstractions. Maximize structured event logging, granular print statements, and cross-feature execution tracking.

## Personal Supabase Schema

This project uses a dedicated Postgres schema `medley` on the operator's shared personal Supabase database. Do **not** use the default `public` schema for application tables or migrations.

- Schema name is `medley` (see `SUPABASE_SCHEMA` in `.env.example` and the `[personal_supabase]` marker in `.daedalus`).
- This project's ignored `.env` is the canonical source for `SUPABASE_URL`, publishable/secret API keys (legacy anon/service_role aliases still work), and one database access setting (`SUPABASE_DB_URL`, `SUPABASE_DB_URL_IPV4`, `SUPABASE_DB_URL_IPV6`, or `SUPABASE_ACCESS_TOKEN`). When multiple database URLs are set, Activate probes the IPv4 URL, then IPv6, then the default URL and passes the reachable URL to migration push. `SUPABASE_URL` remains the independent PostgREST/API endpoint. Project ref is optional when the URL is `https://<ref>.supabase.co`. Operators set those values manually; Daedalus never writes credentials into project `.env` files.
- Qualify SQL, migrations, RLS policies, and client/API configuration for `medley`.
- With supabase-js, select this schema explicitly (for example, `supabase.schema('medley').from('table_name')`) or set the client's default `db.schema` to `medley`. Do not silently fall back to `public`.
- Never assume PostgREST or Supabase clients default to `public` for this app.
- Auth is shared across apps on this Supabase project; reuse the existing auth setup.
- Agents must not run `supabase db push`; orchestration owns remote migration apply after verification when `supabase/migrations/` changes, and Activate owns the first apply.
- File scaffolding alone is not ecosystem-ready; the operator must Activate via Daedalus (from the Ctrl+K Command Menu) so the software layer commits the scaffold and pushes migrations.
- The generated `supabase/config.toml` exposes `medley` for the local Supabase CLI stack. This local setting does not change the hosted project's PostgREST configuration. After Activate applies the schema, add it to Supabase Dashboard Project Settings > Data API > Exposed schemas, preserving the existing entries.
- If a hosted request fails with `PGRST106` / `Invalid schema: medley`, PostgREST does not currently expose the requested schema. Check the hosted Exposed schemas list first. If the schema is already listed but the error remains, check whether the database role `authenticator` has a stale `pgrst.db_schemas` role setting; only when confirmed, reset that override with `ALTER ROLE authenticator RESET pgrst.db_schemas;` so the Dashboard configuration can take effect.
