#!/usr/bin/env node
import net from "net";
import { spawn, ChildProcess } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

// ESモジュールで__dirnameを取得
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ClientConnection {
  socket: net.Socket;
  mcpProcess: ChildProcess;
  clientId: string;
}

class MCPTCPBridge {
  private port: number;
  private mcpExecutable: string;
  private server: net.Server;
  private connections: Map<string, ClientConnection> = new Map();

  constructor(port: number = 3000, mcpExecutable: string = "server.js") {
    this.port = port;
    this.mcpExecutable = mcpExecutable;
    this.server = net.createServer();
    this.setupServer();
  }

  private setupServer(): void {
    this.server.on("connection", this.handleConnection.bind(this));
    this.server.on("error", this.handleServerError.bind(this));
  }

  private handleConnection(socket: net.Socket): void {
    const clientId = `${socket.remoteAddress}:${socket.remotePort}`;
    console.log(
      `[${new Date().toISOString()}] Client connected from ${clientId}`
    );

    const mcpPath = path.join(__dirname, this.mcpExecutable);
    console.log(`Spawning MCP process: ${mcpPath}`);

    const mcpProcess = spawn("node", [mcpPath], {
      stdio: ["pipe", "pipe", "inherit"],
      cwd: __dirname,
    });

    // エラーハンドリング
    mcpProcess.on("error", (err) => {
      console.error(`Failed to start MCP process for ${clientId}:`, err);
      const errorResponse = {
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal error: Failed to start MCP server",
        },
      };
      socket.write(JSON.stringify(errorResponse) + "\n");
      socket.end();
    });

    // 接続を保存
    this.connections.set(clientId, { socket, mcpProcess, clientId });

    // 双方向パイプ設定
    socket.pipe(mcpProcess.stdin);
    mcpProcess.stdout.pipe(socket);

    // ソケットイベントハンドラ
    socket.on("error", (err) => {
      console.error(
        `[${new Date().toISOString()}] Socket error for ${clientId}:`,
        err
      );
      this.cleanupConnection(clientId);
    });

    socket.on("end", () => {
      console.log(
        `[${new Date().toISOString()}] Client ${clientId} disconnected`
      );
      this.cleanupConnection(clientId);
    });

    // プロセスイベントハンドラ
    mcpProcess.on("exit", (code) => {
      console.log(
        `[${new Date().toISOString()}] MCP process for ${clientId} exited with code ${code}`
      );
      const connection = this.connections.get(clientId);
      if (connection) {
        connection.socket.end();
        this.connections.delete(clientId);
      }
    });
  }

  private cleanupConnection(clientId: string): void {
    const connection = this.connections.get(clientId);
    if (connection) {
      connection.mcpProcess.kill();
      this.connections.delete(clientId);
    }
  }

  private handleServerError(err: Error): void {
    console.error("Server error:", err);
    process.exit(1);
  }

  public start(): void {
    this.server.listen(this.port, "0.0.0.0", () => {
      console.log(`MCP TCP Bridge listening on 0.0.0.0:${this.port}`);
      console.log(`MCP executable: ${this.mcpExecutable}`);
      console.log(`Working directory: ${__dirname}`);
      console.log("Waiting for connections...");
    });
  }

  public stop(): void {
    console.log("\nShutting down TCP bridge...");

    // すべての接続をクリーンアップ
    for (const [clientId] of this.connections) {
      this.cleanupConnection(clientId);
    }

    this.server.close(() => {
      console.log("TCP bridge stopped");
      process.exit(0);
    });
  }
}

// メイン実行
const port = parseInt(process.env.MCP_TCP_PORT || "3000", 10);
const mcpExecutable = process.env.MCP_EXECUTABLE || "server.js";

const bridge = new MCPTCPBridge(port, mcpExecutable);
bridge.start();

// Graceful shutdown
process.on("SIGINT", () => bridge.stop());
process.on("SIGTERM", () => bridge.stop());
