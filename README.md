# FailureTrace

## Agentic AI Failure Investigation & Root-Cause Analysis

FailureTrace is an agentic debugging system that investigates software failures by combining error messages, stack traces, application logs, recent changes, and expected behavior.

Instead of simply explaining an error, FailureTrace builds an evidence-backed investigation:

**Failure → Evidence → Specialist Analysis → Root Cause → Failure Chain → Recommended Fix → Verification**

---

## Why FailureTrace?

When a production failure occurs, developers often have to manually inspect:

- Error messages
- Stack traces
- Application logs
- Recent deployments or code changes
- Expected system behavior

This investigation is time-consuming and information is often scattered across multiple sources.

FailureTrace brings these signals together and turns them into a structured investigation.

---

## How It Works

FailureTrace uses an orchestrated investigation pipeline.

```text
                    ┌─────────────────────┐
                    │   Failure Report    │
                    │                     │
                    │ Error + Stack Trace │
                    │ Logs + Changes      │
                    │ Expected Behavior   │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │    Orchestrator     │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
       ┌────────────┐   ┌────────────┐   ┌────────────┐
       │ Stack      │   │ Log        │   │ Change     │
       │ Trace      │   │ Analysis   │   │ Analysis   │
       │ Agent      │   │ Agent      │   │ Agent      │
       └──────┬─────┘   └──────┬─────┘   └──────┬─────┘
              │                │                │
              └────────────────┼────────────────┘
                               ▼
                    ┌─────────────────────┐
                    │ Root Cause          │
                    │ Synthesizer         │
                    └──────────┬──────────┘
                               │
                               ▼
              ┌────────────────────────────────┐
              │ Evidence-backed Investigation │
              │                                │
              │ • Root Cause                   │
              │ • Confidence                   │
              │ • Evidence                     │
              │ • Failure Chain                │
              │ • Recommended Fixes            │
              │ • Verification Plan            │
              └────────────────────────────────┘
---

## Key Features

### Evidence-Based Investigation

FailureTrace analyzes multiple evidence sources together:

- Error message
- Stack trace
- Application logs
- Recent changes
- Expected behavior
- Optional code context

### Specialist Agents

The investigation pipeline includes focused specialist analysis:

- **Stack Trace Agent** — extracts failing locations and exceptions.
- **Log Analysis Agent** — identifies relevant errors and warnings.
- **Change Analysis Agent** — analyzes recent deployment or configuration changes.

These specialist agents run locally and extract structured evidence.

### Root Cause Synthesizer

The Root Cause Synthesizer combines the original evidence and specialist findings to produce:

- Most likely root cause
- Confidence score
- Supporting evidence
- Failure chain
- Recommended fixes
- Verification plan

Gemini can be used for higher-level synthesis when available.

### Local Fallback Engine

FailureTrace does not depend completely on an external LLM.

If Gemini is unavailable, the system automatically switches to a deterministic local root-cause engine.

This allows the prototype to continue producing structured investigations even when the Gemini API is unavailable.

---

## Investigation Output

Each investigation produces a structured result containing:

```text
Failure
   ↓
Failure Location
   ↓
Failure Chain
   ↓
Root Cause
   ├── Confidence
   └── Evidence
   ↓
Recommended Fix
   ↓
Verification Plan