# MCP Database Server

This is a Model Context Protocol (MCP) server that provides access to the project's database schema and data.

## Features

- **Resource `database://schema`**: Returns the current Prisma schema file.
- **Tool `list_tables`**: Lists all tables in the database.
- **Tool `execute_query`**: Executes a read-only SQL query (SELECT).

## Security

The `execute_query` tool is restricted to read-only operations. It blocks any query that starts with or contains destructive keywords like `INSERT`, `UPDATE`, `DELETE`, `DROP`, etc.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Generate Prisma client:
   ```bash
   npm run prisma:generate
   ```

3. Build the server:
   ```bash
   npm run build
   ```

## Usage

This server is designed to be used by an AI Agent. Add it to your agent's MCP configuration pointing to `dist/index.js`.
It automatically loads the database connection string from `../../backend/.env`.
