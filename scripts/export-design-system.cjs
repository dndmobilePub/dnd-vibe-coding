// Artifact generation only; does not run the application or tests.
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const tokens = JSON.parse(fs.readFileSync(path.join(root, "design-system/tokens.json"), "utf8"));
const declarations = [
  ...Object.entries(tokens.colors).map(([key, value]) => `  --${key}: ${value};`),
  ...Object.entries(tokens.numbers).map(([key, value]) => `  --${key}: ${value}px;`),
  ...Object.entries(tokens.aliases).map(([key, value]) => `  --${key}: var(--${value});`),
  '  --font: "Noto Sans KR", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;',
  '  --shadow-card: 0 6px 24px #18395a0a;'
];
fs.writeFileSync(path.join(root, "design-system/tokens.css"), `/* Generated from tokens.json. */\n:root {\n${declarations.join("\n")}\n}\n`);
const source = fs.readFileSync(path.join(root, "design-system/figma-plugin/source.js"), "utf8");
fs.writeFileSync(path.join(root, "design-system/figma-plugin/code.js"), source.replace("/* TOKEN_DATA */", JSON.stringify(tokens)));
