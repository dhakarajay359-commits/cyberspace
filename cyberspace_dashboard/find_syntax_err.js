const acorn = require('acorn');
const fs = require('fs');

const code = fs.readFileSync('syntax_check8.js', 'utf8');

try {
    acorn.parse(code, { ecmaVersion: 2020 });
    console.log("Syntax is valid!");
} catch (e) {
    console.error("Syntax Error:", e.message);
    // Print a few lines around the error
    if (e.loc) {
        const lines = code.split('\n');
        const start = Math.max(0, e.loc.line - 5);
        const end = Math.min(lines.length, e.loc.line + 5);
        for (let i = start; i < end; i++) {
            console.log(`${i + 1}: ${lines[i]}`);
        }
    }
}
