with open('static/js/compete.js', 'r', encoding='utf-8') as f:
    text = f.read()

render_attack = """async function renderAttackArsenal() {
    const sc = window.currentScenario || 'sqli_login';
    
    try {
        const res = await fetch(`/api/tools/red/${sc}`);
        const data = await res.json();
        if (!data.success || !data.tools) return;
        
        const label = document.getElementById('red-scenario-label');
        if (label) label.textContent = `🎯 Target: ${sc}`;

        const panel = document.getElementById('panel-payloads');
        panel.innerHTML = `
        <div class="text-[10px] text-red-400 mono uppercase tracking-widest mb-2">
            🎯 Target: <span class="text-orange-400 font-bold">${sc}</span>
            <span class="text-slate-500 ml-2">Exploit tools loaded from database</span>
        </div>`;

        data.tools.forEach(p => {
            const card = document.createElement('div');
            card.className = 'payload-card';
            card.innerHTML = `
            <div class="flex items-center justify-between mb-1">
                <span class="text-red-300 text-xs font-bold mono">${p.label}</span>
                <span class="text-slate-600 text-[10px]">${p.tip}</span>
            </div>
            <button class="payload-btn" onclick="firePayload(this, \`${p.payload.replace(/`/g,'\\\\`')}\`)">▶ ${p.payload}</button>`;
            panel.appendChild(card);
        });
    } catch(e) {
        console.error('Failed to load attack arsenal', e);
    }
}"""

render_defense = """async function renderDefenseArsenal() {
    const sc = window.currentScenario || 'sqli_login';

    try {
        const res = await fetch(`/api/tools/blue/${sc}`);
        const data = await res.json();
        if (!data.success || !data.tools) return;

        const label = document.getElementById('blue-scenario-label');
        if (label) label.textContent = `🛡 Defending Against ${sc}`;

        const arsenal = document.getElementById('defense-arsenal');
        arsenal.innerHTML = '';

        data.tools.forEach(d => {
            const btn = document.createElement('button');
            btn.className = 'defense-btn';
            if (_deployedRules.has(d.rule)) btn.classList.add('deployed');
            btn.dataset.rule = d.rule;
            btn.innerHTML = `<span class="font-bold">${d.label}</span><br><span class="text-[10px] text-slate-500">${d.tip}</span>`;
            btn.onclick = () => deployDefenseRule(btn, d.rule, d.label);
            arsenal.appendChild(btn);
        });
    } catch(e) {
        console.error('Failed to load defense arsenal', e);
    }
}"""

# We need to replace the old sync functions with our new async ones
lines = text.split('\n')
def replace_func(lines, func_name, new_code):
    start = -1
    end = -1
    for i, line in enumerate(lines):
        if f'function {func_name}()' in line:
            start = i
            break
    if start == -1: return lines
    
    brace_count = 0
    for i in range(start, len(lines)):
        brace_count += lines[i].count('{')
        brace_count -= lines[i].count('}')
        if brace_count == 0 and i > start:
            end = i
            break
            
    if end != -1:
        return lines[:start] + new_code.split('\n') + lines[end+1:]
    return lines

lines = replace_func(lines, 'renderAttackArsenal', render_attack)
lines = replace_func(lines, 'renderDefenseArsenal', render_defense)

new_text = '\n'.join(lines)
with open('static/js/compete.js', 'w', encoding='utf-8') as f:
    f.write(new_text)

print("Patched renderAttackArsenal and renderDefenseArsenal successfully.")
