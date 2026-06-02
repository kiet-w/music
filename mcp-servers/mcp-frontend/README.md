# MCP Frontend Server

This is a Model Context Protocol (MCP) server that provides the AI with deep structural knowledge of the Next.js frontend, specifically tailored for **Feature-Sliced Design (FSD)**.

## Features

### Resources
- **`frontend://store`**: Aggregate of all Zustand stores found in `features/*/model/` and `entities/*/model/`.
- **`frontend://conventions`**: Reads the `frontend/GEMINI.md` file for project-specific rules.

### Tools
- **`list_fsd_layers`**: Lists core FSD layers (`app`, `pages`, `widgets`, `features`, `entities`, `shared`) and their contents.
- **`list_components`**: Lists all React components in `shared/ui`, `features`, and `widgets`.
- **`read_component`**: Reads the source code of a specific component (e.g., `features/auth/ui/LoginForm.tsx`).
- **`list_routes`**: Scans the `app/` directory and lists available Next.js routes.

## Setup

1. Install dependencies:
   ```bash
   cd mcp-servers/mcp-frontend
   npm install
   ```

2. Build the server:
   ```bash
   npm run build
   ```

## Usage

Add this to your AI Agent's MCP configuration:

```json
{
  "name": "mcp-frontend",
  "command": "node",
  "args": ["/home/baudui/Downloads/project/music/mcp-servers/mcp-frontend/dist/index.js"]
}
```
