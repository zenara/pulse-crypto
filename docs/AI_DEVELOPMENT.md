# AI-Assisted Development

## Overview

Cursor (agent chat in the IDE) was used throughout PulseCrypto. It accelerated implementation and review. It did not own the architecture.

Used for:

- Nx / Nest / Expo scaffolding
- Test generation (reviewed, not accepted blindly)
- Refactors
- Staff-style review prompts (slow consumers, disconnect-without-wipe, selector scope, details-view update depth)
- Edge-case identification
- README and `docs/` drafting
- Performance reasoning (no profiler run claimed)

Not used for:

- Inventing Binance combined-stream or ticker/depth behaviour
- Introducing Kafka, Redis, Socket.IO, or a database “because it is typical”
- Replacing ADRs with generated design

The developer remains responsible for architecture, correctness, and failure paths. The repository README summarises this for the assignment.

---

# Development Workflow

The workflow was:

```text
Define requirement
      ↓
Define architecture
      ↓
Document decision
      ↓
Ask AI to implement incrementally
      ↓
Review generated code
      ↓
Run tests/typecheck
      ↓
Manually validate behavior
      ↓
Ask AI to identify weaknesses
      ↓
Refine implementation
```

AI was not given unrestricted permission to redesign the entire system.

Implementation was performed incrementally by bounded feature areas.

---

# Architecture First

Before implementation, the following were defined:

- System architecture
- Data flow
- WebSocket protocol
- State ownership
- Real-time processing strategy
- Error handling
- Performance strategy
- Architectural trade-offs

This reduced the risk of AI-generated code driving the architecture without explicit engineering intent.

---

# AI Code Review

Cursor was also used as a reviewer.

Example review prompt:

```text
Act as a Staff Engineer reviewing this implementation.

Identify the most important architectural,
performance, reliability and maintainability weaknesses.

Do not rewrite the code.

Rank the issues by severity and explain:
1. Why it is a problem.
2. How it could fail.
3. What trade-off is involved.
4. The smallest reasonable fix.
```

---

# AI and Testing

AI was used to identify important test scenarios.

Particular focus was given to:

- WebSocket disconnections
- Reconnection
- Slow consumers
- Rapid updates
- State preservation
- Order-book limits
- Favourite persistence
- REST failures

Generated tests were reviewed rather than blindly accepted.

---

# AI and Performance

Cursor was used to review React Native rendering behavior under sustained updates.

The review focused on:

- Unnecessary renders
- Zustand subscriptions
- List rendering
- Object allocation
- Animation behavior
- WebSocket message processing

Optimizations were only applied when there was a clear reason.

---

# Human Responsibility

AI-generated code was treated as a proposal rather than an authoritative implementation.

The developer remains responsible for:

- Architecture
- Correctness
- Security
- Performance
- Testing
- API behavior
- Final code quality
- Technical decisions

The purpose of AI assistance was to accelerate implementation and improve review quality, not to replace engineering judgment.
