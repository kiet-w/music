---
name: svg-diagrams
description: Create and edit simple, readable SVG diagrams for docs, especially use case, ERD, lifecycle, sequence, data flow, and component diagrams.
---

# SVG Diagrams

Use this skill when the user asks to create, convert, or refine an SVG diagram for documentation that lives in or is embedded from a Markdown file.

This skill is Markdown-first:

- Work on `.md` files and SVG assets that are embedded in `.md` files.
- Do not target HTML, slides, or raster export unless the user explicitly asks later.
- Preserve the full information content from the source material. Do not omit nodes, sections, labels, relationships, or constraints just to make the diagram smaller.
- If one SVG becomes too dense, split the content into multiple SVGs instead of dropping detail.

## Workflow

1. Identify the diagram type and where it will be used.
2. Keep the layout simple, readable, and single-purpose.
3. Prefer ASCII labels and short text.
4. Use a small palette, thin strokes, clear arrows, and enough whitespace.
5. Render as SVG only unless the user asks for another format.

## Default Canvas

- Use a wide canvas, usually `1500x900` or similar.
- Keep titles at the top left.
- Leave margins so labels do not hit the edges.
- Prefer rounded rectangles, ellipses, and simple connectors.

## Diagram Patterns

- Use case: actor on the side, system boundary box, oval use cases.
- ERD: entity cards, PK/FK labels, straight relation lines.
- Lifecycle: left-to-right or top-to-bottom state boxes with arrows.
- Sequence: vertical lifelines with message arrows.
- Data flow: boundary boxes for browser/backend/infra.
- Component: grouped modules with dependency arrows.

## Style Rules

- Keep text short and aligned to shapes.
- Avoid decorative gradients, blobs, or visual noise.
- Reuse the workspace's existing diagram style when present.
- If the repo contains `docs/backend-frontend-deep-dive.md` and `docs/diagrams/`, mirror that visual language.

## Validation

- Ensure the SVG is valid XML.
- Check that labels fit inside the canvas.
- Check that arrows and containers are legible at normal browser zoom.
- If the diagram will be embedded in Markdown, verify the relative path is correct.
- Verify that the diagram still reflects the complete source content from the Markdown.
- Prefer multiple diagrams over a simplified one when simplification would remove important meaning.

## Output

- Save SVGs as standalone files.
- Name files by diagram intent, for example `usecase-overview.svg` or `database-erd.svg`.
