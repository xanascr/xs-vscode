# XanaScript for VS Code

Official XanaScript (.xs) extension for Visual Studio Code.

## Features

- **Syntax Highlight** — colorized code with full keyword support
- **Formatter** — auto-format `.xs` files
- **Snippets** — shortcuts for common structures
- **Auto-close** — brackets, quotes, and backticks
- **Bracket matching** — highlight matching pairs

## Installation

```bash
git clone https://github.com/xanascr/xs-vscode.git
cd xs-vscode
npm install -g vsce
vsce package
code --install-extension xanascript-*.vsix
```

Or open the folder in VS Code and press `F5`.

## Commands

| Command | Description |
|---|---|
| `XanaScript: Run file` | Execute current .xs file |
| `XanaScript: Build (optimized JS)` | Compile to JavaScript |
| `XanaScript: Run tests` | Execute tests |
| `XanaScript: Format file` | Format code |
| `Format Document` | Shift+Alt+F |

## Snippets

| Shortcut | Expands to |
|---|---|
| `partiu` | `PARTIU()` / `ACABOU()` |
| `cria` | `CRIA nome = valor` |
| `se` | `SE LIGA SO (cond) { }` |
| `funcao` | `CHAMA ESSE CARA nome(params) { }` |
| `repete` | `REPETE NA MORAL (init; test; upd) { }` |
| `enquanto` | `REPETE AI (cond) { }` |
| `solta` | `SOLTA O GRITO(expr)` |
| `importa` | `IMPORTA "path"` |
| `tenta` | `TENTA { } PEGA(err) { }` |

[View all snippets](https://github.com/xanascr/xs-vscode/blob/main/snippets/xs.json)

## Report bugs

https://github.com/xanascr/xs-vscode/issues
