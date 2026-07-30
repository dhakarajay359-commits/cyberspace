const fs = require('fs');
const acorn = require('acorn');

const html = fs.readFileSync('rendered.html', 'utf8');
const start = html.indexOf('<script>') + 8;
const end = html.lastIndexOf('</script>');
const code = html.substring(start, end);

fs.writeFileSync('rendered.js', code);

try {
    acorn.parse(code, { ecmaVersion: 2020 });
    console.log("No syntax errors found in rendered JS!");
} catch (e) {
    console.error("SyntaxError in rendered JS:", e.message);
    const lines = code.split('\n');
    console.log("Error line:", lines[e.loc.line - 1]);
    console.log("Line number:", e.loc.line);
}
