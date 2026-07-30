const fs = require('fs');
const acorn = require('acorn');

const html = fs.readFileSync('rendered_dummy.html', 'utf8');

// Find all script tags
const scriptRegex = /<script.*?>([\s\S]*?)<\/script>/g;
let match;
let i = 0;
while ((match = scriptRegex.exec(html)) !== null) {
    i++;
    const code = match[1];
    if (code.length < 100) continue; // skip small scripts
    
    fs.writeFileSync(`rendered_dummy_${i}.js`, code);
    console.log(`Checking script block ${i} (length ${code.length})...`);
    
    try {
        acorn.parse(code, { ecmaVersion: 2020 });
        console.log(`Script block ${i} parsed successfully!`);
    } catch (e) {
        console.error(`SyntaxError in script block ${i}:`, e.message);
        const lines = code.split('\n');
        console.log("Error line:", lines[e.loc.line - 1]);
        console.log("Line number:", e.loc.line);
    }
}
