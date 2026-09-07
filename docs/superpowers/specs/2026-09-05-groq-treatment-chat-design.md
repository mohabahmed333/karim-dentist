# Workspace Groq AI treatment chat

Date: 2026-09-05

## Goal
Chat assistant on the clinical workspace that drafts required-treatment fields from dentist free-text, using Groq (free API key).

## Behavior
- Header button **AI assist** opens a side drawer chat.
- Context: selected tooth FDI/name + clinic menu CDT codes/fees from Settings.
- Model returns a short reply plus optional structured draft (`cdt_code`, `fee_amount`, `severity`, clinical fields).
- **Apply to wizard** opens/pre-fills the treatment wizard for the selected tooth.
- API: `POST /api/v1/ai/treatment-chat` with `GROQ_API_KEY` server-side only.
- Prompt versioned at `prompts/treatment-assistant.md`.

## Non-goals
Auto-save without dentist review; replacing Clinic prices editor.
