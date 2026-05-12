# Planning Rules For ODG Tasks

Use this file only while planning. Do not turn it into a step-by-step execution log.

## Goal

Every plan should translate the request into a compact operational contract and name the official CLI command first.

## Read Before Planning

1. Read the local AGENTS.md if one exists — it defines the mandatory pre-action checklist and required package reads.
2. Read [node_modules/@odg/command/agents.md](node_modules/@odg/command/agents.md) before deciding flags or artifacts.

## Minimum Operational Contract

Before proposing a plan, identify:

1. Flow steps.
2. Shared state.
3. Success gate for each step.
4. Retry boundary.
5. Canonical CLI command per step.
6. Expected generated artifacts.
7. Secondary CLI calls that are still unavoidable.
8. Steps with no official command.
9. Validation strategy.

## Canonical Planning Rules

- If the central piece is a new page, the first command must be make:page, not make:event or make:selector.
- If the same step needs a page, selectors, and a listener, prefer one make:page command with flags
  instead of splitting it.
- Selectors discovered during planning are placeholders. Real selectors must be inspected manually
  during implementation.
- If naming, path, payload, gate, and retry are already clear, end the plan quickly and do not create
  fake investigation steps.

## Ask Vs Assume

Ask only when the answer changes the architecture:

- observed selectors
- event name
- handler responsibility
- retry boundary
- success destination
- credentials or sensitive config
- or any other unresolved detail that would change the scaffold command or generated artifact set

If the answer does not change architecture or wiring, proceed with the conservative assumption and state it.

If there is material doubt about CLI behavior itself, verify the local help output before prescribing a workaround.

## Plan Output Order

1. Summarized operational contract.
2. Canonical command per step.
3. Expected artifacts per step.
4. Justified exceptions.
5. Unavoidable manual adjustments.
6. Validation steps.
7. Relevant assumptions.

## Exception Rule

Deviate from the preferred CLI command only when:

1. The CLI does not cover the artifact.
2. The generated naming would violate the contract.
3. A local known limitation already documents a shorter safe alternative.
