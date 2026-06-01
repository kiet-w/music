# Diagram Patterns

Keep this file short. It is a reference for the `svg-diagrams` skill.

## General

- Prefer a single visual idea per SVG.
- Keep the canvas wide and the title explicit.
- Use short labels.
- Keep arrows simple and consistent.
- Validate XML before delivering the file.

## Use Case

- Put the actor on the outside.
- Draw one system boundary.
- Place use cases as ovals inside the boundary.
- Use a different accent color for external actors or systems.

## ERD

- Render entities as cards.
- Put the primary key at the top of the field list.
- Mark foreign keys clearly.
- Draw one relation per connection and label cardinality if needed.

## Lifecycle

- Use a clear start state.
- Place states in reading order.
- Show transitions with arrows.
- Prefer one path per branch and annotate failures separately.

## Sequence

- Put participants across the top.
- Keep lifelines vertical.
- Use solid arrows for calls and dashed arrows for returns.

## Data Flow

- Separate browser, backend, and infrastructure into zones.
- Keep trust boundaries visible.
- Show real sources of truth and notification paths separately.

## Component

- Group related modules.
- Show controllers, services, repositories, and infrastructure in layers.
- Keep dependencies directional and sparse.
