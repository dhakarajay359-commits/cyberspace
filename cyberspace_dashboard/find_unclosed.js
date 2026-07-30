const acorn = require('acorn');
const walk = require('acorn-walk');
const fs = require('fs');

let code = fs.readFileSync('syntax_check8.js', 'utf8');
code += '\n}\n}\n)\n'; // Append closing braces to force a successful parse

try {
    const ast = acorn.parse(code, { ecmaVersion: 2020 });
    // Find the innermost block that contains the very end of the file
    let deepestNode = null;
    walk.simple(ast, {
        BlockStatement(node) {
            // Check if this block reaches the end of the file
            if (node.end >= code.length - 10) {
                deepestNode = node;
                console.log('Unclosed block starts at:', node.start, code.substring(node.start, node.start + 50));
            }
        },
        FunctionDeclaration(node) {
            if (node.end >= code.length - 10) {
                console.log('Unclosed function:', node.id.name);
            }
        }
    });
} catch (e) {
    console.error("Syntax Error:", e.message);
}
