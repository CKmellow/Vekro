---
name: Backend gap
about: A screen needs something api/openapi.json does not provide
title: "[backend-gap] P<rank>-<n>: "
labels: backend-gap
assignees: CKmellow
---

**Priority:** P<rank>-<n> · **Blocks:** <screens>

## Problem
<!-- What the UI needs and what the contract lacks. Quote api/openapi.json. -->

## Requested contract
<!-- Endpoint, auth, request and response shape. Do not assume it exists until the backend ships it. -->

## Frontend plan until it ships
Mock it with MSW behind `src/models/api/adapters/`, tag it `// backend-gap #<this issue>`, put it behind a `VITE_MOCK_*` flag and list it in `docs/BACKEND_GAPS.md`. When the backend ships, delete the mock and the flag.
