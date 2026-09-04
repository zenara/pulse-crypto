# AI-Assisted Development

## Overview

Cursor was used as an AI-assisted development tool throughout the implementation of PulseCrypto.

AI was used primarily for:

- Code scaffolding
- Test generation
- Refactoring suggestions
- Code review
- Edge-case identification
- Documentation assistance
- Performance review
- Architecture challenge

The architecture and major technical decisions were reviewed and validated by the developer.

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
