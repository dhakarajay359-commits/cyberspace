const fs = require('fs');
const acorn = require('acorn');

const code = fs.readFileSync('syntax_check.js', 'utf8');
try {
    acorn.parse(code, { ecmaVersion: 2020 });
    console.log("No syntax errors found by acorn!");
} catch (e) {
    console.error("SyntaxError:", e.message);
    const lines = code.split('\n');
    console.log("Error line:", lines[e.loc.line - 1]);
    console.log("Line number:", e.loc.line);
}
