import sys

try:
    with open('templates/compete.html', 'r', encoding='utf-8') as f:
        content = f.read()

    # Add HTML
    decoder_html = """                        <!-- Payload Decoder Tool -->
                        <div class="mt-2 pt-3 border-t border-slate-800">
                            <p class="text-[10px] text-fuchsia-400 mb-1 mono uppercase flex items-center gap-1"><span class="mi mi-sm">vpn_key</span> Traffic Decoder</p>
                            <div class="flex gap-2 mb-1">
                                <input type="text" id="blue-decoder-input" 
                                    class="flex-1 bg-black border border-slate-700 p-2 rounded text-white mono text-xs outline-none focus:border-fuchsia-500 transition" 
                                    placeholder="Paste base64 payload here...">
                                <button onclick="decodeTraffic()" class="bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-3 rounded text-xs font-bold transition">DECODE</button>
                            </div>
                            <div id="blue-decoder-output" class="bg-slate-900 border border-slate-800 rounded p-2 text-emerald-400 mono text-[10px] min-h-[34px] break-all">
                                <!-- Decoded output appears here -->
                            </div>
                        </div>
"""
    # Insert it right after the custom rule block
    target_block = """                                <button onclick="deployCustomRule()" class="bg-blue-600 hover:bg-blue-500 text-white px-3 rounded text-xs font-bold transition">DEPLOY</button>
                            </div>
                        </div>"""
    
    if target_block in content:
        content = content.replace(target_block, target_block + '\n\n' + decoder_html)
    else:
        print("Error: Could not find target HTML block")
        
    # Add JS
    decoder_js = """
        // Decoder tool for Blue Team
        function decodeTraffic() {
            const input = document.getElementById('blue-decoder-input').value.trim();
            const output = document.getElementById('blue-decoder-output');
            if(!input) {
                output.innerHTML = '<span class="text-slate-500 italic">No input provided</span>';
                return;
            }
            try {
                const decoded = atob(input);
                output.innerHTML = decoded.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            } catch(e) {
                output.innerHTML = '<span class="text-red-500 font-bold">ERROR: Invalid Base64 payload</span>';
            }
        }
"""
    target_js = """function startMatch() {"""
    if target_js in content:
        content = content.replace(target_js, decoder_js + '\n        ' + target_js)
    else:
        print("Error: Could not find target JS block")

    with open('templates/compete.html', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Decoder added successfully")
except Exception as e:
    print("Exception:", e)
