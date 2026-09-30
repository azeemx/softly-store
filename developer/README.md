# developer/ — Developer Change Log & Guide

This folder is the **single source of truth for a human developer** working on
this codebase. Nothing here is code — it's plain-text explanation.

## Why this folder exists
So any developer (including future-you) can answer, without reading 89 source
files:
  - What changed, when, and WHY
  - Which files were created / updated / deleted
  - What the app looked like BEFORE that change
  - What to do next

## Structure

    developer/
      README.md              <- you are here (index + how to log changes)
      ARCHITECTURE.md        <- file-by-file map of the whole codebase
      NEXT-STEPS.md          <- roadmap, next features, tips, warnings
      updates/
        001-*.txt            <- one file per update, oldest first
        002-*.txt
        ...

## The rule: EVERY update gets a new file

Whenever you change the codebase, immediately create:

    developer/updates/NNN-short-slug.txt      (NNN = next number, 3 digits)

Use this SIMPLE TEXT template (no markdown needed):

    UPDATE 007 — 2026-09-28 — short title
    =========================================
    STATUS: done | partial | abandoned
    WHAT I DID
      <2-6 plain sentences>
    FILES CREATED
      path/to/file — why
    FILES UPDATED
      path/to/file — what changed and why
    FILES DELETED
      path/to/file — why it was removed
    BEFORE / AFTER
      before: <old behaviour>
      after:  <new behaviour>
    TESTS RUN
      next typegen / tsc / build / build_and_start — pass or fail
    RISKS & NOTES
      <anything a future dev must know>
    NEXT STEP
      <the very next thing to do>

## How to create one quickly

    ./scripts/devlog.sh "short title"
    # -> creates developer/updates/007-short-title.txt with the template filled in
    # then edit it with what you actually did.

## Reading order for a new developer
  1. README.md            — what the product is
  2. ARCHITECTURE.md      — where everything lives
  3. updates/ (last 2)    — what changed recently
  4. NEXT-STEPS.md        — what to build next
  5. config.txt (root)    — every environment variable explained
  6. ADMIN_GUIDE.md       — how the shop is operated day to day
