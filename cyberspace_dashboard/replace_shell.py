import re

with open('vfs_shell.js', 'r', encoding='utf-8') as f:
    vfs_code = f.read()

with open('templates/academy.html', 'r', encoding='utf-8') as f:
    html = f.read()

# We need to replace `const TERM_RULES = [ ... ];` all the way down to `});` (line 1761).
# We can use regex to find this block.
pattern = re.compile(r'const TERM_RULES = \[.*?\n\s*\];\s*// ── Smart terminal dispatcher.*?\}\);\s*', re.DOTALL)
match = pattern.search(html)

if match:
    replacement = f"""
// ═══════════════════════════════════════════════════════════
//  DYNAMIC VFS & SHELL ENGINE
// ═══════════════════════════════════════════════════════════
{vfs_code}

const shell = new ShellEngine();

document.getElementById('term-input').addEventListener('keypress', function(e) {{
    if (e.key !== 'Enter') return;
    const raw = this.value.trim();
    if (!raw) return;
    
    const out = document.getElementById('term-output');
    const panel = document.getElementById('terminal-panel');

    // Echo command
    out.innerHTML += `<div class="mb-1">${{shell.getPrompt()}}<span class="text-white">${{raw.replace(/</g,'&lt;')}}</span></div>`;
    this.value = '';
    panel.scrollTop = panel.scrollHeight;

    const output = shell.execute(raw);

    // Simulate small execution delay for realism
    out.innerHTML += `<div class="text-gray-600 text-xs mb-1 loading-dots">▌</div>`;
    panel.scrollTop = panel.scrollHeight;
    
    setTimeout(() => {{
        const loading = out.querySelector('.loading-dots');
        if (loading) loading.remove();
        
        if (output && output !== 'CLEAR_SIG') {{
            out.innerHTML += `<div class="mb-3 text-xs leading-loose mono">${{output}}</div>`;
        }} else if (output === 'CLEAR_SIG') {{
            out.innerHTML = '';
        }}
        panel.scrollTop = panel.scrollHeight;
    }}, 150);
}});

// Initialize prompt
document.addEventListener("DOMContentLoaded", () => {{
    const promptElement = document.getElementById('term-prompt');
    if (promptElement) promptElement.innerHTML = shell.getPrompt();
}});
"""
    new_html = html[:match.start()] + replacement + html[match.end():]
    with open('templates/academy.html', 'w', encoding='utf-8') as out:
        out.write(new_html)
    print("Replaced successfully")
else:
    print("Could not find the target block")
