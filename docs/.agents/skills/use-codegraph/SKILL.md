---
name: use-codegraph
description: Use when Gemini CLI needs to understand code structure, find definitions, or analyze cross-module dependencies using the existing .codegraph/codegraph.db SQLite databases. ALWAYS use this skill when starting a new task to get high-level context from the project's knowledge graph.
---

# Use Codegraph

## Overview
This skill allows Gemini CLI to query and utilize the project's knowledge graph stored in `.codegraph/codegraph.db` files. These databases contain pre-indexed information about files, functions, classes, and their relationships (imports, calls, etc.).

## Core Principle
**Graph-First Context**: Before reading individual files, query the codegraph to understand the landscape. This is faster and uses fewer tokens than recursive file reading.

## How to Use
1. **Identify Databases**: Look for `.codegraph/codegraph.db` in the root, `backend/`, or `frontend/`.
2. **Query for Symbols**: Use the bundled script to find where a specific class or function is defined or used.
3. **Analyze Dependencies**: Trace imports and calls across boundaries (e.g., from frontend API calls to backend controllers).

## Bundled Script: `query_codegraph.py`
Use this script to query the SQLite databases. It returns formatted tables.

**Usage:**
\`\`\`bash
python3 .gemini/skills/use-codegraph/scripts/query_codegraph.py <db_path> "<SQL_QUERY>"
\`\`\`

### Common Queries

#### List Tables
\`\`\`sql
SELECT name FROM sqlite_master WHERE type='table';
\`\`\`

#### Search for a Node (Function/Class/File)
\`\`\`sql
SELECT id, kind, name, file_path, start_line 
FROM nodes 
WHERE name LIKE '%MySymbolName%' 
LIMIT 10;
\`\`\`

#### Find Callers or Callees (Edges)
\`\`\`sql
SELECT source, target, type 
FROM edges 
WHERE source LIKE '%SymbolID%' OR target LIKE '%SymbolID%' 
LIMIT 20;
\`\`\`

#### List All Exported Symbols in a Module
\`\`\`sql
SELECT name, kind, file_path 
FROM nodes 
WHERE file_path LIKE 'src/auth/%' AND is_exported = 1;
\`\`\`

## Common Mistakes
- **Assuming One DB**: Check all relevant subdirectories (backend, frontend) as they often have independent graphs.
- **Raw File Reading Only**: Don't rely solely on `read_file` when the graph can provide a faster overview of dependencies.
- **Complex Joins**: Keep SQL queries simple to ensure reliable output from the script.

## Red Flags
- You find yourself `grep`-ing for a function name across the whole project when you could have queried the graph in one turn.
- You are confused about where a type is coming from in a large codebase.
- You are trying to map out a module structure manually.

**STOP and query the codegraph instead.**
