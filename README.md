# XanaScript para VS Code

Extensao oficial do XanaScript (.xs) para Visual Studio Code.

## Features

- **Syntax Highlight** - codigo colorido com todas as keywords
- **Formatter** - formata `.xs` automaticamente
- **Snippets** - atalhos para estruturas comuns
- **Auto-close** - brackets, aspas e backticks
- **Bracket matching** - destaca pares

## Instalacao

```bash
git clone https://github.com/xanascr/xs-vscode.git
cd xs-vscode
npm install -g vsce
vsce package
code --install-extension xanascript-*.vsix
```

Ou abra a pasta no VS Code e pressione `F5`.

## Comandos

| Comando | Descricao |
|---|---|
| `XanaScript: Executar arquivo` | Executa .xs atual |
| `XanaScript: Build (JS otimizado)` | Compila para JS |
| `XanaScript: Rodar testes` | Executa testes |
| `XanaScript: Format arquivo` | Formata codigo |
| `Formatar documento` | Shift+Alt+F |

## Snippets

| Atalho | Expande |
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

[Ver todos os snippets](https://github.com/xanascr/xs-vscode/blob/main/snippets/xs.json)

## Reportar bugs

https://github.com/xanascr/xs-vscode/issues
