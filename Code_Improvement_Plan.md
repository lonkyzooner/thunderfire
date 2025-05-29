# Code Improvement Plan

**Priorities:** Maintainability/Complexity & Performance/Responsiveness

**Analysis Summary:**

*   **OrchestratorService:** Central hub, high complexity, tight coupling, basic intent logic, hardcoded features, fragile tool invocation, duplicate state, sequential processing.
*   **WorkflowManager:** Skeleton implementation, potential future complexity, non-persistent state.
*   **ToolManager:** Clean registry pattern, but used fragilely by Orchestrator. Performance depends on tools.
*   **ContextManager:** Structured context, but non-persistent state.
*   **State Management:** Fragmented and non-persistent (in-memory).
*   **Performance:** Latency likely from sequential external calls (LLMs, Tools, Voice) in Orchestrator.

**Improvement Plan:**

**Phase 1: Refactoring & Simplification (Maintainability/Complexity)**

1.  **Consolidate State & Add Persistence:**
    *   **Goal:** Single source of truth for session state, persistent storage.
    *   **Action:**
        *   Make `ContextManager` sole owner of history, actions, data. Remove duplicates from `OrchestratorService`.
        *   Implement persistence for `ContextManager` and `WorkflowManager` state (backend API, browser storage, etc.).
    *   **Benefit:** Reduces duplication, improves consistency, enables scaling/persistence.

2.  **Refactor OrchestratorService:**
    *   **Goal:** Reduce coupling, improve clarity, separate concerns.
    *   **Action:**
        *   Replace basic intent/action classification with a robust mechanism.
        *   Move specific feature logic (Miranda, Statutes) out (e.g., into Tools or dedicated handlers).
        *   Improve tool invocation logic (explicit `toolId`/`params`).
        *   Clean up unused LLM clients.
    *   **Benefit:** Improves modularity, testability, clarifies orchestration.

3.  **Implement WorkflowManager Logic:**
    *   **Goal:** Clearly define and implement multi-step workflow logic.
    *   **Action:** Implement state transitions and suggestion logic in `WorkflowManager`, define clear interaction with `OrchestratorService`.
    *   **Benefit:** Encapsulates workflow complexity, potentially simplifies orchestrator.

**Phase 2: Performance Optimization**

1.  **Parallelize Orchestrator Operations:**
    *   **Goal:** Reduce sequential latency.
    *   **Action:** Identify and parallelize independent steps in `OrchestratorService.processInput` (`Promise.all`).
    *   **Benefit:** Reduces processing time.

2.  **Optimize Voice Synthesis Flow:**
    *   **Goal:** Reduce perceived voice output latency.
    *   **Action:** Explore streaming LLM responses for earlier TTS, optimize LiveKit, provide faster non-verbal feedback.
    *   **Benefit:** Improves voice interaction UX.

3.  **Analyze & Optimize Tool Performance:**
    *   **Goal:** Identify and speed up slow tools.
    *   **Action:** Add timing/logging for tool invocations. Optimize slow or frequently used tools.
    *   **Benefit:** Reduces tool execution latency.

4.  **Optimize Frontend Rendering:**
    *   **Goal:** Ensure smooth UI responsiveness.
    *   **Action:** Apply React optimizations (`memo`, `useCallback`), analyze renders, optimize data fetching, consider bundle size.
    *   **Benefit:** Improves UI responsiveness.

**Plan Visualization:**

```mermaid
graph TD
    A[Start Analysis] --> B{Priorities: Maintainability & Performance};
    B --> C[Analyze Services];
    C --> D[Synthesize Findings];

    D --> E[Phase 1: Refactoring & Simplification];
    E --> F[Consolidate State & Add Persistence];
    E --> G[Refactor Orchestrator];
    E --> H[Implement WorkflowManager Logic];

    D --> I[Phase 2: Performance Optimization];
    I --> J[Parallelize Orchestrator Steps];
    I --> K[Optimize Voice Synthesis Flow];
    I --> L[Optimize Tool Performance];
    I --> M[Optimize Frontend Rendering];

    H --> N[Plan Complete];
    M --> N;

    style E fill:#f9f,stroke:#333,stroke-width:2px
    style I fill:#ccf,stroke:#333,stroke-width:2px