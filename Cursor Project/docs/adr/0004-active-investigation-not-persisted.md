# ADR 0004 — Do Not Persist Active Investigations

## Status

Accepted

## Decision

Persist user preferences and layout, but do not persist active investigation state.

## Rationale

A new application launch should begin with a clean investigation rather than silently restoring stale evidence, timers, timestamps, or results from an earlier session.

## Consequence

Users retain configuration between sessions while investigation state remains transient and explicit.
