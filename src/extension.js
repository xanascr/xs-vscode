// ⚡ XanaScript VS Code Extension — v2.0 com LSP
// Fornece: syntax highlight, formatter, LSP client (autocomplete, erros, hover, go-to-def)

const vscode = require("vscode");
const path = require("path");
const { spawn } = require("child_process");

let lspClient = null;

function activate(context) {
  console.log("XanaScript extension v2.2.8 ativada!");

  // ═══════════════════════════════════════════
  // LSP Client
  // ═══════════════════════════════════════════

  startLSPClient(context);

  // ═══════════════════════════════════════════
  // Formatter
  // ═══════════════════════════════════════════

  const formatProvider = vscode.languages.registerDocumentFormattingEditProvider("xs", {
    provideDocumentFormattingEdits(document) {
      const text = document.getText();
      const formatted = formatXS(text);
      const range = new vscode.Range(0, 0, document.lineCount, 0);
      return [vscode.TextEdit.replace(range, formatted)];
    }
  });

  // ═══════════════════════════════════════════
  // Commands
  // ═══════════════════════════════════════════

  const runCmd = vscode.commands.registerCommand("xs.run", async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== "xs") {
      vscode.window.showInformationMessage("Abra um arquivo .xs para executar");
      return;
    }

    const filePath = editor.document.uri.fsPath;
    const terminal = vscode.window.createTerminal("XanaScript");
    terminal.show();
    terminal.sendText(`xs run "${filePath}"`);
  });

  const buildCmd = vscode.commands.registerCommand("xs.build", async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== "xs") {
      vscode.window.showInformationMessage("Abra um arquivo .xs para buildar");
      return;
    }

    const filePath = editor.document.uri.fsPath;
    const terminal = vscode.window.createTerminal("XanaScript Build");
    terminal.show();
    terminal.sendText(`xs build --opt "${filePath}"`);
  });

  const testCmd = vscode.commands.registerCommand("xs.test", async () => {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      vscode.window.showInformationMessage("Abra uma pasta com arquivos .xs de teste");
      return;
    }
    const terminal = vscode.window.createTerminal("XanaScript Test");
    terminal.show();
    terminal.sendText(`xs test "${workspaceFolders[0].uri.fsPath}"`);
  });

  const formatCmd = vscode.commands.registerCommand("xs.format", () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== "xs") {
      vscode.window.showInformationMessage("Abra um arquivo .xs para formatar");
      return;
    }
    vscode.commands.executeCommand("editor.action.formatDocument");
  });

  // ═══════════════════════════════════════════
  // Diagnostics (fallback sem LSP)
  // ═══════════════════════════════════════════

  const diagnosticCollection = vscode.languages.createDiagnosticCollection("xs");
  context.subscriptions.push(diagnosticCollection);

  const diagnosticListener = vscode.workspace.onDidChangeTextDocument(event => {
    if (event.document.languageId !== "xs") return;
  });

  context.subscriptions.push(formatProvider, runCmd, buildCmd, testCmd, formatCmd, diagnosticListener);
}

function deactivate() {
  if (lspClient) {
    lspClient.kill();
    lspClient = null;
  }
}

// ═══════════════════════════════════════════
// LSP Client — conecta com xs lsp
// ═══════════════════════════════════════════

function startLSPClient(context) {
  try {
    // Tenta encontrar o binário xs
    const xsPath = findXSBinary();
    if (!xsPath) {
      console.log("⚠ xs CLI não encontrado. LSP desativado.");
      return;
    }

    console.log(`🔌 Conectando LSP: ${xsPath}`);

    lspClient = spawn(xsPath, ["lsp"], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    lspClient.stdout.on("data", (data) => {
      // Processa mensagens do LSP
      handleLSPMessage(data.toString());
    });

    lspClient.stderr.on("data", (data) => {
      console.error("LSP stderr:", data.toString());
    });

    lspClient.on("error", (err) => {
      console.log("⚠ LSP error:", err.message);
      lspClient = null;
    });

    lspClient.on("close", (code) => {
      console.log(`LSP fechado (código ${code})`);
      lspClient = null;
    });

    // Envia initialize
    sendLSP({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        processId: process.pid,
        capabilities: {
          textDocument: {
            completion: { dynamicRegistration: true },
            hover: { dynamicRegistration: true },
            definition: { dynamicRegistration: true },
            diagnostic: { dynamicRegistration: true },
          },
        },
      },
    });

    // Envia initialized
    sendLSP({
      jsonrpc: "2.0",
      method: "initialized",
    });

    // Escuta mudanças de documento
    context.subscriptions.push(
      vscode.workspace.onDidOpenTextDocument(doc => {
        if (doc.languageId !== "xs") return;
        sendLSP({
          jsonrpc: "2.0",
          method: "textDocument/didOpen",
          params: {
            textDocument: {
              uri: doc.uri.toString(),
              languageId: "xs",
              version: 1,
              text: doc.getText(),
            },
          },
        });
      }),
      vscode.workspace.onDidChangeTextDocument(event => {
        if (event.document.languageId !== "xs" || !lspClient) return;
        sendLSP({
          jsonrpc: "2.0",
          method: "textDocument/didChange",
          params: {
            textDocument: {
              uri: event.document.uri.toString(),
              version: event.document.version,
            },
            contentChanges: [
              { text: event.document.getText() },
            ],
          },
        });
      })
    );

    // Registra completion provider como fallback
    context.subscriptions.push(
      vscode.languages.registerCompletionItemProvider("xs", {
        provideCompletionItems(document, position) {
          return getXSLanguageCompletions(document, position);
        },
      }, ".", "(")
    );
  } catch (e) {
    console.log("⚠ LSP init error:", e.message);
  }
}

function findXSBinary() {
  // Procura em ordem: path, node_modules/.bin, diretório da extensão
  const candidates = [
    "xs",
    path.join(__dirname, "..", "..", "src", "cli.js"),
    path.join(__dirname, "..", "..", "node_modules", ".bin", "xs"),
    path.join(__dirname, "..", "..", "dist", process.platform === "win32" ? "xs.exe" : "xs"),
  ];

  const fs = require("fs");
  for (const c of candidates) {
    try {
      if (fs.existsSync(c) || c === "xs") {
        // "xs" pode estar no PATH
        return c;
      }
    } catch {}
  }
  return null;
}

let lspBuffer = "";

function sendLSP(msg) {
  if (!lspClient || !lspClient.stdin.writable) return;
  const body = JSON.stringify(msg);
  const header = `Content-Length: ${Buffer.byteLength(body, "utf-8")}\r\n\r\n`;
  lspClient.stdin.write(header + body);
}

function handleLSPMessage(data) {
  lspBuffer += data;
  const parts = lspBuffer.split("\r\n\r\n");
  if (parts.length < 2) return;

  const header = parts[0];
  const contentLength = parseInt(header.match(/Content-Length: (\d+)/)?.[1] || "0");
  const bodyOffset = header.length + 4;

  if (lspBuffer.length < bodyOffset + contentLength) return;

  const bodyStr = lspBuffer.slice(bodyOffset, bodyOffset + contentLength);
  lspBuffer = lspBuffer.slice(bodyOffset + contentLength);

  try {
    const msg = JSON.parse(bodyStr);

    // Handle diagnostics
    if (msg.method === "textDocument/publishDiagnostics") {
      const uri = vscode.Uri.parse(msg.params.uri);
      const diagnostics = msg.params.diagnostics.map(d => {
        return new vscode.Diagnostic(
          new vscode.Range(
            d.range.start.line, d.range.start.character,
            d.range.end.line, d.range.end.character
          ),
          d.message,
          d.severity === 1 ? vscode.DiagnosticSeverity.Error : vscode.DiagnosticSeverity.Warning
        );
      });

      diagnosticCollection.set(uri, diagnostics);
    }
  } catch (e) {
    console.error("LSP parse error:", e.message);
  }
}

// ═══════════════════════════════════════════
// Completion Provider (fallback)
// ═══════════════════════════════════════════

function getXSLanguageCompletions(document, position) {
  const items = [];

  const KEYWORDS = [
    "PARTIU", "ACABOU", "CRIA", "SE", "LIGA", "SO", "SENAO",
    "REPETE", "NA", "MORAL", "CHAMA", "ESSE", "CARA", "VOLTA",
    "IMPORTA", "EXPORTA", "SOLTA", "O", "GRITO", "FALA", "BAIXO",
    "AGORA", "VAI", "ESPERA", "AI", "SORTEIA", "PARSEIA", "OUVE",
    "AQUI", "VERDADEIRO", "FALSO", "NULO", "TENTA", "PEGA", "ERRO",
    "VOA", "CONTINUA", "CLASSE", "HERDA", "CONSTRUTOR", "ISTO",
    "NOVA", "METODO", "ESCOLHE", "CASO", "PADRAO", "COMBINA",
    "CRIA_SERVIDOR", "PARA_SERVIDOR", "TAMANHO", "DIVIDE_TEXTO",
    "TESTE", "AFIRMA", "ASSUNTO", "TAREFA", "MACRO", "TABELA",
  ];

  for (const kw of KEYWORDS) {
    const item = new vscode.CompletionItem(kw, vscode.CompletionItemKind.Keyword);
    item.insertText = kw;
    items.push(item);
  }

  const BUILTINS = [
    { name: "SOLTA_O_GRITO", detail: "console.log(...)", doc: "Imprime no console" },
    { name: "FALA_BAIXO", detail: "console.warn(...)", doc: "Aviso no console" },
    { name: "AGORA_VAI", detail: "HTTP GET(url)", doc: "Requisição HTTP" },
    { name: "ESPERA_AI", detail: "sleep(ms)", doc: "Aguardar milissegundos" },
    { name: "SORTEIA", detail: "randInt(min, max)", doc: "Número aleatório" },
    { name: "PARSEIA", detail: "JSON.parse(json)", doc: "Parse de JSON" },
    { name: "TAMANHO", detail: "length(valor)", doc: "Tamanho de array/string" },
    { name: "DIVIDE_TEXTO", detail: "split(texto, sep)", doc: "Dividir string" },
  ];

  for (const fn of BUILTINS) {
    const item = new vscode.CompletionItem(fn.name, vscode.CompletionItemKind.Function);
    item.detail = fn.detail;
    item.documentation = fn.doc;
    item.insertText = fn.name + "($1)";
    item.insertTextFormat = vscode.InsertTextFormat.Snippet;
    items.push(item);
  }

  return items;
}

// ═══════════════════════════════════════════
// Formatter
// ═══════════════════════════════════════════

function formatXS(code) {
  const lines = code.split("\n");
  const out = [];
  let indent = 0;

  for (let raw of lines) {
    let line = raw.trim();
    if (!line) { out.push(""); continue; }

    const dedent = /^\}/.test(line) || /^\)/.test(line);
    if (dedent && indent > 0) indent--;

    const spaces = "  ".repeat(indent);
    out.push(spaces + line);

    const openCount = (line.match(/\{/g) || []).length;
    const closeCount = (line.match(/\}/g) || []).length;
    indent += openCount - closeCount;
  }

  return out.join("\n");
}

module.exports = { activate, deactivate };
