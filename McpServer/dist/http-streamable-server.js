import express from "express";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import cors from "cors";
// 既存のモジュールをインポート
import { loadMarkdownFiles } from "./metadata.js";
import { registerResourcesNew, addResourcesForFilesNew, } from "./resources.js";
import { registerPromptsNew } from "./prompts.js";
import { registerToolsNew } from "./tools.js";
/**
 * MCPサーバーを作成
 */
function createMcpServer() {
    const server = new McpServer({
        name: "markdown-prompts-server",
        version: "1.0.0",
    }, {
        capabilities: {
            resources: {},
            prompts: {},
            tools: {},
        },
    });
    // 機能を登録
    registerResourcesNew(server);
    addResourcesForFilesNew(server);
    registerPromptsNew(server);
    registerToolsNew(server);
    return server;
}
/**
 * Streamable HTTP transportサーバーを起動
 */
async function runStreamableHttpServer() {
    try {
        // マークダウンファイルの読み込み
        await loadMarkdownFiles();
        // Express アプリケーションを作成
        const app = express();
        // ミドルウェア設定
        app.use(cors({
            origin: "*",
            methods: ["GET", "POST", "DELETE", "OPTIONS"],
            allowedHeaders: [
                "Content-Type",
                "Authorization",
                "Accept",
                "mcp-session-id",
                "last-event-id",
            ],
            exposedHeaders: ["mcp-session-id"],
            credentials: true,
        }));
        app.use(express.json());
        // ヘルスチェックエンドポイント
        app.get("/health", (req, res) => {
            res.json({
                status: "ok",
                timestamp: new Date().toISOString(),
                transport: "streamable-http",
                server: "markdown-prompts-server",
            });
        });
        // ルートエンドポイント
        app.get("/", (req, res) => {
            res.json({
                name: "markdown-prompts-server",
                version: "1.0.0",
                description: "MCP server for serving markdown prompt files",
                transport: "streamable-http",
                endpoint: "/mcp",
                capabilities: {
                    resources: true,
                    prompts: true,
                    tools: true,
                },
            });
        });
        // デバッグ用: すべてのリクエストをログ（MCPエンドポイント以外）
        app.use((req, res, next) => {
            if (req.path !== "/mcp") {
                console.error(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
            }
            next();
        });
        // セッション管理用のマップ
        const transports = new Map();
        const sseTransports = new Map();
        const servers = new Map();
        // MCPリクエストハンドラ - POST
        app.post("/mcp", async (req, res) => {
            console.error("[MCP] Received POST request");
            try {
                // 既存のセッションIDをチェック
                const sessionId = req.headers["mcp-session-id"];
                let transport;
                let server;
                if (sessionId && transports.has(sessionId)) {
                    // 既存のトランスポートとサーバーを再利用
                    console.error(`[MCP] Reusing transport for session: ${sessionId}`);
                    transport = transports.get(sessionId);
                    server = servers.get(sessionId);
                }
                else if (!sessionId && req.body.method === "initialize") {
                    // 新しい初期化リクエスト
                    const newSessionId = randomUUID();
                    console.error(`[MCP] Creating new session: ${newSessionId}`);
                    server = createMcpServer();
                    transport = new StreamableHTTPServerTransport({
                        sessionIdGenerator: () => newSessionId,
                        onsessioninitialized: (sessionId) => {
                            // セッションが初期化されたときにトランスポートを保存
                            console.error(`[MCP] Session initialized with ID: ${sessionId}`);
                            transports.set(sessionId, transport);
                            servers.set(sessionId, server);
                        },
                    });
                    // クリーンアップハンドラを設定
                    transport.onclose = () => {
                        const sid = transport.sessionId;
                        if (sid && transports.has(sid)) {
                            console.error(`[MCP] Transport closed for session ${sid}`);
                            transports.delete(sid);
                            servers.delete(sid);
                        }
                    };
                    // サーバーに接続
                    await server.connect(transport);
                    console.error("[MCP] Server connected to new transport");
                }
                else {
                    // セッションIDはあるが、トランスポートが見つからない、または初期化リクエストでない
                    res.status(400).json({
                        jsonrpc: "2.0",
                        error: {
                            code: -32000,
                            message: sessionId
                                ? "Bad Request: Invalid session ID"
                                : "Bad Request: Server not initialized",
                        },
                        id: req.body.id || null,
                    });
                    return;
                }
                // リクエストを処理
                await transport.handleRequest(req, res, req.body);
            }
            catch (error) {
                console.error("[MCP Error]", error);
                if (!res.headersSent) {
                    res.status(500).json({
                        jsonrpc: "2.0",
                        error: {
                            code: -32603,
                            message: "Internal server error",
                            data: error instanceof Error ? error.message : String(error),
                        },
                        id: req?.body?.id || null,
                    });
                }
            }
        });
        // MCPリクエストハンドラ - GET (SSEストリーム用)
        app.get("/mcp", async (req, res) => {
            console.error("[MCP] Received GET request");
            console.error("[MCP] Headers:", JSON.stringify(req.headers, null, 2));
            try {
                const sessionId = req.headers["mcp-session-id"];
                // Claude CodeがSSEで初回接続する場合、セッションIDがないことがある
                if (!sessionId) {
                    // 新しいセッションを作成
                    const newSessionId = randomUUID();
                    console.error(`[MCP] Creating new session for SSE: ${newSessionId}`);
                    const server = createMcpServer();
                    const transport = new StreamableHTTPServerTransport({
                        sessionIdGenerator: () => newSessionId,
                        onsessioninitialized: (sessionId) => {
                            console.error(`[MCP] SSE session initialized with ID: ${sessionId}`);
                            transports.set(sessionId, transport);
                            servers.set(sessionId, server);
                        },
                    });
                    // クリーンアップハンドラを設定
                    transport.onclose = () => {
                        const sid = transport.sessionId;
                        if (sid && transports.has(sid)) {
                            console.error(`[MCP] Transport closed for session ${sid}`);
                            transports.delete(sid);
                            servers.delete(sid);
                        }
                    };
                    // サーバーに接続
                    await server.connect(transport);
                    console.error("[MCP] Server connected to new SSE transport");
                    // セッションIDヘッダーを設定
                    res.setHeader("mcp-session-id", newSessionId);
                    // SSEストリームを開始
                    console.error("[MCP] About to call handleRequest");
                    try {
                        await transport.handleRequest(req, res);
                    }
                    catch (handleError) {
                        console.error("[MCP] handleRequest error:", handleError);
                        throw handleError;
                    }
                    return;
                }
                // 既存のセッションIDがある場合
                if (!transports.has(sessionId)) {
                    console.error(`[MCP] Session ID not found: ${sessionId}`);
                    res.status(400).json({
                        jsonrpc: "2.0",
                        error: {
                            code: -32000,
                            message: "Bad Request: Invalid session ID",
                        },
                        id: null,
                    });
                    return;
                }
                // Last-Event-IDヘッダーをチェック（再接続用）
                const lastEventId = req.headers["last-event-id"];
                if (lastEventId) {
                    console.error(`[MCP] Client reconnecting with Last-Event-ID: ${lastEventId}`);
                }
                else {
                    console.error(`[MCP] Continuing SSE stream for session ${sessionId}`);
                }
                const transport = transports.get(sessionId);
                await transport.handleRequest(req, res);
            }
            catch (error) {
                console.error("[MCP GET Error]", error);
                if (!res.headersSent) {
                    res.status(500).json({
                        jsonrpc: "2.0",
                        error: {
                            code: -32603,
                            message: "Internal server error",
                            data: error instanceof Error ? error.message : String(error),
                        },
                        id: null,
                    });
                }
            }
        });
        // MCPリクエストハンドラ - DELETE (セッション終了用)
        app.delete("/mcp", async (req, res) => {
            console.error("[MCP] Received DELETE request");
            const sessionId = req.headers["mcp-session-id"];
            if (!sessionId || !transports.has(sessionId)) {
                res.status(400).json({
                    jsonrpc: "2.0",
                    error: {
                        code: -32000,
                        message: "Bad Request: No valid session ID provided",
                    },
                    id: null,
                });
                return;
            }
            const transport = transports.get(sessionId);
            const server = servers.get(sessionId);
            await transport.close();
            await server.close();
            transports.delete(sessionId);
            servers.delete(sessionId);
            res.status(204).send();
        });
        // URLエンコードされたリクエストをリダイレクト
        app.use((req, res, next) => {
            // URLエンコードされたJSONがパスに含まれている場合
            if (req.path.includes("%7B") && req.path.includes("%7D")) {
                console.error("[Redirect] Encoded path detected:", req.path);
                try {
                    const decodedPath = decodeURIComponent(req.path);
                    const jsonMatch = decodedPath.match(/\{.*\}/);
                    if (jsonMatch) {
                        const jsonData = JSON.parse(jsonMatch[0]);
                        console.error("[Redirect] Decoded JSON:", jsonData);
                        // /messagesエンドポイントにリダイレクト
                        if (jsonData.endpoint === "/messages" && jsonData.sessionId) {
                            req.url = "/messages";
                            req.headers["x-mcp-session-id"] = jsonData.sessionId;
                        }
                    }
                }
                catch (e) {
                    console.error("[Redirect] Error decoding path:", e);
                }
            }
            next();
        });
        // SSE専用エンドポイント（公式実装に基づく）
        app.get("/sse", async (req, res) => {
            console.error("[SSE] Received connection request");
            try {
                // SSEServerTransportを作成（ヘッダーはtransportが管理）
                const transport = new SSEServerTransport("/messages", res);
                const sessionId = transport.sessionId;
                console.error(`[SSE] Created transport with session ID: ${sessionId}`);
                // transportsマップに登録
                sseTransports.set(sessionId, transport);
                // 新しいサーバーインスタンスを作成
                const server = createMcpServer();
                servers.set(sessionId, server);
                // クライアントが切断した場合のクリーンアップ
                res.on("close", () => {
                    console.error(`[SSE] Client disconnected: ${sessionId}`);
                    sseTransports.delete(sessionId);
                    servers.delete(sessionId);
                    server.close();
                });
                // サーバーに接続（これがSSEストリームを開始する）
                await server.connect(transport);
                console.error("[SSE] Server connected via SSEServerTransport");
            }
            catch (error) {
                console.error("[SSE Error]", error);
                if (!res.headersSent) {
                    res.status(500).json({
                        error: "Internal server error",
                        message: error instanceof Error ? error.message : String(error),
                    });
                }
            }
        });
        // SSE用のメッセージエンドポイント（公式実装に基づく）
        app.post("/messages", async (req, res) => {
            console.error("[SSE Messages] Received POST request");
            // クエリパラメータからセッションIDを取得
            const sessionId = req.query.sessionId;
            console.error("[SSE Messages] Session ID from query:", sessionId);
            if (!sessionId || !sseTransports.has(sessionId)) {
                console.error("[SSE Messages] Invalid session ID:", sessionId);
                console.error("[SSE Messages] Available sessions:", Array.from(sseTransports.keys()));
                res.status(400).send("No transport found for sessionId");
                return;
            }
            const transport = sseTransports.get(sessionId);
            await transport.handlePostMessage(req, res, req.body);
        });
        // SSE専用エンドポイント（後方互換性のため）
        app.get("/sse", async (req, res) => {
            console.error("[SSE] Received connection request");
            console.error("[SSE] Headers:", JSON.stringify(req.headers, null, 2));
            try {
                // 新しいセッションを作成
                const newSessionId = randomUUID();
                console.error(`[SSE] Creating new session: ${newSessionId}`);
                const server = createMcpServer();
                const transport = new StreamableHTTPServerTransport({
                    sessionIdGenerator: () => newSessionId,
                    onsessioninitialized: (sessionId) => {
                        console.error(`[SSE] Session initialized with ID: ${sessionId}`);
                        transports.set(sessionId, transport);
                        servers.set(sessionId, server);
                    },
                });
                // クリーンアップハンドラを設定
                transport.onclose = () => {
                    const sid = transport.sessionId;
                    if (sid && transports.has(sid)) {
                        console.error(`[SSE] Transport closed for session ${sid}`);
                        transports.delete(sid);
                        servers.delete(sid);
                    }
                };
                // サーバーに接続
                await server.connect(transport);
                console.error("[SSE] Server connected to transport");
                // SSEストリームを開始
                res.writeHead(200, {
                    "Content-Type": "text/event-stream",
                    "Cache-Control": "no-cache",
                    Connection: "keep-alive",
                    "Access-Control-Allow-Origin": "*",
                    "X-MCP-Session-Id": newSessionId,
                });
                // 初期イベントを送信
                res.write(`event: open\n`);
                res.write(`data: {"sessionId":"${newSessionId}","type":"connection","status":"connected"}\n\n`);
                // transportのハンドラーを呼び出す
                await transport.handleRequest(req, res);
            }
            catch (error) {
                console.error("[SSE Error]", error);
                if (!res.headersSent) {
                    res.status(500).json({
                        error: "Internal server error",
                        message: error instanceof Error ? error.message : String(error),
                    });
                }
            }
        });
        // 404ハンドラー
        app.use((req, res) => {
            console.error(`[404] ${req.method} ${req.url}`);
            res.status(404).json({
                error: "Not Found",
                message: `Cannot ${req.method} ${req.url}`,
            });
        });
        // ポート設定
        const port = parseInt(process.env.HTTP_PORT || process.env.PORT || "3002", 10);
        // HTTPサーバーを開始
        const httpServer = app.listen(port, "0.0.0.0", () => {
            console.error(`\n=== MCP Streamable HTTP Server Started ===`);
            console.error(`Port: ${port}`);
            console.error(`Health check: http://localhost:${port}/health`);
            console.error(`MCP endpoint: http://localhost:${port}/mcp`);
            console.error(`SSE endpoint: http://localhost:${port}/sse`);
            console.error(`Working directory: ${process.cwd()}`);
            console.error(`\nFor Claude Code, use one of:`);
            console.error(`claude mcp add --transport http prompt-server http://localhost:${port}/mcp`);
            console.error(`claude mcp add --transport sse prompt-server http://localhost:${port}/sse`);
            console.error(`claude mcp add --transport sse prompt-server http://localhost:${port}/mcp`);
            console.error(`==========================================\n`);
        });
        // グレースフルシャットダウン
        process.on("SIGINT", async () => {
            console.error("\nShutting down server...");
            httpServer.close();
            // すべてのトランスポートとサーバーをクリーンアップ
            for (const [sessionId, transport] of transports) {
                console.error(`Closing session ${sessionId}...`);
                await transport.close();
                const server = servers.get(sessionId);
                if (server) {
                    await server.close();
                }
            }
            console.error("Server stopped");
            process.exit(0);
        });
        process.on("SIGTERM", async () => {
            console.error("\nReceived SIGTERM, shutting down...");
            httpServer.close();
            for (const [sessionId, transport] of transports) {
                await transport.close();
                const server = servers.get(sessionId);
                if (server) {
                    await server.close();
                }
            }
            process.exit(0);
        });
    }
    catch (error) {
        console.error("Failed to start MCP HTTP Streamable server:", error);
        process.exit(1);
    }
}
// サーバーを起動
runStreamableHttpServer().catch(console.error);
