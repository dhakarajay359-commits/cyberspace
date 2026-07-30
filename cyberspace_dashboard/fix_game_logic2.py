import sys
import re

try:
    with open('templates/compete.html', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Clean up double spacing completely
    while '\n\n' in content:
        content = content.replace('\n\n', '\n')
    
    # 2. Add Decoder HTML
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
                        </div>
                    </div>"""
    
    content = re.sub(r'(<button onclick="deployCustomRule\(\)".*?</button>\s*</div>\s*</div>\s*</div>)', r'\1' + decoder_html, content)

    # 3. Add Javascript functions
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
    
    content = content.replace('function startMatch() {', js_funcs + '\n        function startMatch() {')

    with open('templates/compete.html', 'w', encoding='utf-8') as f:
        f.write(content)
        
    print("UI Fixed and Decoder Added!")

except Exception as e:
    print("Error:", e)
