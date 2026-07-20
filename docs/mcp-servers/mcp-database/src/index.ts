import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend
const backendEnvPath = path.resolve(__dirname, "../../backend/.env");
config({ path: backendEnvPath });

const prisma = new PrismaClient();

const server = new Server(
  {
    name: "mcp-database",
    version: "1.0.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

// Resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "database://schema",
        name: "Prisma Schema",
        description: "The project's database schema (Prisma format)",
        mimeType: "text/x-prisma",
      },
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  if (request.params.uri === "database://schema") {
    const schemaPath = path.resolve(__dirname, "../prisma/schema.prisma");
    try {
      const content = await fs.readFile(schemaPath, "utf-8");
      return {
        contents: [
          {
            uri: "database://schema",
            mimeType: "text/x-prisma",
            text: content,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Could not read schema file: ${error}`);
    }
  }
  throw new Error("Resource not found");
});

// Tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "list_tables",
        description: "List all tables in the database",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "execute_query",
        description: "Execute a read-only SQL query (SELECT only)",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "The SQL query to execute",
            },
          },
          required: ["query"],
        },
      },
    ],
  };
});

const QuerySchema = z.object({
  query: z.string(),
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "list_tables") {
    try {
      // PostgreSQL specific query to list tables
      const tables = await prisma.$queryRawUnsafe(`
        SELECT tablename 
        FROM pg_catalog.pg_tables 
        WHERE schemaname != 'pg_catalog' 
        AND schemaname != 'information_schema';
      `);
      return {
        content: [{ type: "text", text: JSON.stringify(tables, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error listing tables: ${error}` }],
        isError: true,
      };
    }
  }

  if (name === "execute_query") {
    const parsed = QuerySchema.safeParse(args);
    if (!parsed.success) {
      return {
        content: [{ type: "text", text: "Invalid arguments" }],
        isError: true,
      };
    }

    const { query } = parsed.data;

    // Security Check: Only allow SELECT
    const forbiddenKeywords = ["INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "TRUNCATE", "RENAME", "GRANT", "REVOKE"];
    const normalizedQuery = query.trim().toUpperCase();
    
    const isReadOnly = normalizedQuery.startsWith("SELECT") || 
                       normalizedQuery.startsWith("WITH") ||
                       normalizedQuery.startsWith("SHOW") ||
                       normalizedQuery.startsWith("EXPLAIN");

    const hasForbidden = forbiddenKeywords.some(keyword => 
      new RegExp(`\\b${keyword}\\b`, "i").test(query)
    );

    if (!isReadOnly || hasForbidden) {
      return {
        content: [{ type: "text", text: "Security Error: Only read-only queries (SELECT) are allowed." }],
        isError: true,
      };
    }

    try {
      const result = await prisma.$queryRawUnsafe(query);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error executing query: ${error}` }],
        isError: true,
      };
    }
  }

  throw new Error("Tool not found");
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Database Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
