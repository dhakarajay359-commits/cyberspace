import sys

try:
    with open('templates/compete.html', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add HTML Decoder Tool
    decoder_html = """
                        <!-- Decoder Tool -->
                        <div class="mt-2 pt-3 border-t border-slate-800">
                            <p class="text-[10px] text-fuchsia-400 mb-1 mono uppercase flex items-center gap-1"><span class="mi mi-sm">vpn_key</span> Traffic Decoder</p>
                            <div class="flex gap-2 mb-1">
                                <input type="text" id="blue-decoder-input" 
                                    class="flex-1 bg-black border border-slate-700 p-2 rounded text-white mono text-xs outline-none focus:border-fuchsia-500 transition" 
                                    placeholder="Paste base64 payload here...">
                                <button onclick="decodeTraffic()" class="bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-3 rounded text-xs font-bold transition">DECODE</button>
                            </div>
                            <div id="blue-decoder-output" class="bg-slate-900 border border-slate-800 rounded p-2 text-emerald-400 mono text-[10px] min-h-[34px] break-all"></div>
                        </div>"""

    target_block = """                                <button onclick="deployCustomRule()" class="bg-blue-600 hover:bg-blue-500 text-white px-3 rounded text-xs font-bold transition">DEPLOY</button>
                            </div>
                        </div>"""
    
    if target_block in content:
        content = content.replace(target_block, target_block + decoder_html)
    else:
        print("Could not find HTML insertion point")

    # 2. Add Javascript for Custom Rule and Decoder Tool
    js_funcs = """
        function deployCustomRule() {
            const input = document.getElementById('blue-custom-rule');
            const rule = input.value.trim();
            if (!rule) return;
            input.value = '';
            deployDefense(rule);
        }

        function decodeTraffic() {
            const input = document.getElementById('blue-decoder-input').value.trim();
            const output = document.getElementById('blue-decoder-output');
            if (!input) {
                output.textContent = '';
                return;
            }
            try {
                let b64 = input;
                if (b64.includes('?q=')) {
                    b64 = b64.split('?q=')[1];
                    if (b64.includes(' ')) b64 = b64.split(' ')[0];
                }
                const decoded = atob(b64);
                output.textContent = decoded;
                output.className = "bg-slate-900 border border-slate-800 rounded p-2 text-emerald-400 mono text-[10px] min-h-[34px] break-all";
            } catch (e) {
                output.textContent = 'ERROR: Invalid Base64 String';
                output.className = "bg-slate-900 border border-slate-800 rounded p-2 text-red-400 font-bold mono text-[10px] min-h-[34px] break-all";
            }
        }
"""
    # Insert JS functions right before startMatch()
    if 'function startMatch() {' in content:
        content = content.replace('function startMatch() {', js_funcs + '\n        function startMatch() {')
    else:
        print("Could not find JS insertion point")

    with open('templates/compete.html', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixes applied successfully")

except Exception as e:
    print("Error:", e)
