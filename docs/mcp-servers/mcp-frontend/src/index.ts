import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to frontend src
const frontendPath = path.resolve(__dirname, "../../../frontend");
const frontendSrcPath = path.resolve(frontendPath, "src");

const server = new Server(
  {
    name: "mcp-frontend",
    version: "1.0.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

/**
 * Helper to recursively list files with a specific pattern
 */
async function getFiles(dir: string, pattern?: RegExp): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((res) => {
      const resPath = path.resolve(dir, res.name);
      return res.isDirectory() ? getFiles(resPath, pattern) : resPath;
    })
  );
  const flattened = files.flat();
  return pattern ? flattened.filter((f) => pattern.test(f)) : flattened;
}

// Resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "frontend://store",
        name: "Frontend State Stores",
        description: "Aggregate of all Zustand stores across FSD features and entities",
        mimeType: "text/typescript",
      },
      {
        uri: "frontend://conventions",
        name: "Frontend Conventions",
        description: "The frontend's GEMINI.md file containing coding standards",
        mimeType: "text/markdown",
      },
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  if (uri === "frontend://conventions") {
    const geminiPath = path.resolve(frontendPath, "GEMINI.md");
    try {
      const content = await fs.readFile(geminiPath, "utf-8");
      return {
        contents: [{ uri, mimeType: "text/markdown", text: content }],
      };
    } catch (error) {
      throw new Error(`Could not read frontend/GEMINI.md: ${error}`);
    }
  }

  if (uri === "frontend://store") {
    try {
      // Scan features/*/model and entities/*/model for store files
      const layers = ["features", "entities"];
      let aggregateContent = "";

      for (const layer of layers) {
        const layerPath = path.resolve(frontendSrcPath, layer);
        try {
          const items = await fs.readdir(layerPath, { withFileTypes: true });
          for (const item of items) {
            if (item.isDirectory()) {
              const modelPath = path.resolve(layerPath, item.name, "model");
              try {
                const stat = await fs.stat(modelPath);
                if (stat.isDirectory()) {
                  const files = await fs.readdir(modelPath);
                  for (const file of files) {
                    if (file.includes("store") || file.endsWith(".ts")) {
                      const filePath = path.resolve(modelPath, file);
                      const content = await fs.readFile(filePath, "utf-8");
                      aggregateContent += `\n// --- ${layer}/${item.name}/model/${file} ---\n${content}\n`;
                    }
                  }
                }
              } catch (e) {
                // model directory might not exist in some features/entities
              }
            }
          }
        } catch (e) {
          // layer directory might not exist
        }
      }

      return {
        contents: [{ uri, mimeType: "text/typescript", text: aggregateContent || "// No stores found" }],
      };
    } catch (error) {
      throw new Error(`Error scanning stores: ${error}`);
    }
  }

  throw new Error("Resource not found");
});

// Tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "list_fsd_layers",
        description: "List core FSD layers and their top-level contents",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "list_components",
        description: "List all React components across shared, features, and widgets layers",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "read_component",
        description: "Read the source code of a specific component",
        inputSchema: {
          type: "object",
          properties: {
            path: { type: "string", description: "Relative path to component from src/" },
          },
          required: ["path"],
        },
      },
      {
        name: "list_routes",
        description: "List all Next.js App Router routes",
        inputSchema: { type: "object", properties: {} },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "list_fsd_layers") {
    const layers = ["app", "pages", "widgets", "features", "entities", "shared"];
    const structure: Record<string, string[]> = {};
    for (const layer of layers) {
      const layerPath = path.resolve(frontendSrcPath, layer);
      try {
        const items = await fs.readdir(layerPath);
        structure[layer] = items;
      } catch (e) {
        structure[layer] = ["(empty or not found)"];
      }
    }
    return {
      content: [{ type: "text", text: JSON.stringify(structure, null, 2) }],
    };
  }

  if (name === "list_components") {
    const componentLayers = ["shared/ui", "features", "widgets"];
    const components: string[] = [];
    for (const layer of componentLayers) {
      const layerPath = path.resolve(frontendSrcPath, layer);
      try {
        const files = await getFiles(layerPath, /\.(tsx|ts)$/);
        components.push(...files.map((f) => path.relative(frontendSrcPath, f)));
      } catch (e) {}
    }
    return {
      content: [{ type: "text", text: components.join("\n") }],
    };
  }

  if (name === "read_component") {
    const compPath = (args as any).path;
    const fullPath = path.resolve(frontendSrcPath, compPath);
    try {
      const content = await fs.readFile(fullPath, "utf-8");
      return {
        content: [{ type: "text", text: content }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error reading component: ${error}` }],
        isError: true,
      };
    }
  }

  if (name === "list_routes") {
    const appPath = path.resolve(frontendSrcPath, "app");
    try {
      const files = await getFiles(appPath, /page\.tsx$/);
      const routes = files.map((f) => {
        let route = path.relative(appPath, path.dirname(f));
        return route === "." ? "/" : `/${route}`;
      });
      return {
        content: [{ type: "text", text: routes.join("\n") }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error listing routes: ${error}` }],
        isError: true,
      };
    }
  }

  throw new Error("Tool not found");
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Frontend Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});