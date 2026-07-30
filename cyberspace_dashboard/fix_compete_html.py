with open('templates/compete.html', 'r', encoding='utf-8') as f:
    text = f.read()

start_marker = "<!-- ─── RED TEAM CONTROLS ─── -->"
end_marker = "<script src=\"{{ url_for('static', filename='js/compete.js') }}\"></script>"

start_idx = text.find(start_marker)
end_idx = text.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print("Could not find markers!")
    exit(1)

new_html = """<!-- ─── RED TEAM CONTROLS ─── -->
            <div id="red-controls" class="col-span-8 bg-[#0a0000] border border-red-900/50 rounded flex flex-col hidden shadow-[0_0_15px_rgba(220,38,38,0.1)]">
                <div class="bg-red-950/60 p-3 text-sm font-mono text-red-400 flex items-center justify-between gap-2 border-b border-red-900/40">
                    <div class="flex items-center gap-3"><span class="pulse-live"></span> OFFENSIVE CONSOLE — <span id="red-scenario-label" class="text-orange-400 font-bold tracking-wider">Loading...</span></div>
                    <span class="text-slate-500 text-xs">root@kali-linux ~</span>
                </div>

                <!-- Attack Arsenal Tabs -->
                <div class="flex gap-2 px-4 pt-3 border-b border-red-900/30 bg-black/40">
                    <button onclick="switchAttackTab('payloads')" id="tab-payloads" class="attack-tab active-tab px-4 py-2 text-xs mono rounded-t font-bold tracking-wider uppercase transition-colors">⚡ PAYLOADS</button>
                    <button onclick="switchAttackTab('terminal')" id="tab-terminal" class="attack-tab px-4 py-2 text-xs mono rounded-t font-bold tracking-wider uppercase transition-colors">💻 TERMINAL</button>
                </div>

                <!-- Payloads Panel -->
                <div id="panel-payloads" class="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    <!-- Dynamically filled by renderAttackArsenal() -->
                </div>

                <!-- Terminal Panel -->
                <div id="panel-terminal" class="flex-1 flex-col hidden bg-[#050000]">
                    <div id="red-terminal-output" class="flex-1 p-4 font-mono text-emerald-500 text-sm overflow-y-auto h-48 custom-scrollbar">
                        <div class="text-slate-500">> Establishing connection to target... OK</div>
                        <div class="text-slate-500">> Ready. Use payload buttons or type manually below.</div>
                    </div>
                </div>

                <!-- Input Bar (always visible) -->
                <div class="p-4 border-t border-red-900/50 flex items-center gap-3 bg-black/60">
                    <span class="text-red-500 font-mono text-sm font-bold">root@kali:~#</span>
                    <input type="text" id="red-payload" class="flex-1 bg-transparent border-none text-red-400 font-mono text-sm outline-none placeholder-red-900/50" placeholder="Type exploit payload or command...">
                    <button onclick="sendManualAttack()" class="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded text-xs font-bold tracking-wider transition shadow-lg shadow-red-900/50">EXECUTE</button>
                </div>
            </div>

            <!-- ─── BLUE TEAM CONTROLS ─── -->
            <div id="blue-controls" class="col-span-8 bg-[#000a14] border border-blue-900/50 rounded flex flex-col hidden shadow-[0_0_15px_rgba(37,99,235,0.1)]">
                <div class="bg-blue-950/60 p-3 text-sm font-mono text-blue-400 flex items-center justify-between gap-2 border-b border-blue-900/40">
                    <div class="flex items-center gap-3"><span class="pulse-live"></span> DEFENSIVE CONSOLE — <span id="blue-scenario-label" class="text-cyan-400 font-bold tracking-wider">Loading...</span></div>
                    <span class="text-slate-500 text-xs">SOC Analyst ~</span>
                </div>

                <div class="flex-1 grid grid-cols-2 min-h-0 divide-x divide-blue-900/30">
                    
                    <!-- Left: Traffic & Rules -->
                    <div class="flex flex-col bg-[#01050b]">
                        <div class="p-4 border-b border-blue-900/30 flex justify-between items-center bg-black/40">
                            <span class="text-xs text-blue-300 mono uppercase tracking-widest font-bold">Live Network Traffic</span>
                            <div class="flex items-center gap-2 text-xs">
                                <span class="text-slate-400">Threat Level:</span>
                                <span id="blue-threat-level" class="font-bold text-emerald-400">LOW</span>
                            </div>
                        </div>
                        <div class="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            <div id="blue-traffic" class="font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed"></div>
                        </div>
                        <div class="h-1/3 border-t border-blue-900/30 flex flex-col bg-black/60">
                            <div class="p-3 bg-blue-950/30 text-[10px] text-blue-300 mono uppercase tracking-widest border-b border-blue-900/30">Active Defense Rules</div>
                            <ul id="active-rules-list" class="p-3 text-xs mono text-cyan-400 overflow-y-auto flex-1 space-y-1">
                                <li class="text-slate-500 italic">No rules active. Target is exposed.</li>
                            </ul>
                        </div>
                    </div>

                    <!-- Right: Defense Arsenal -->
                    <div class="flex flex-col bg-[#01050b]">
                        <div class="p-4 border-b border-blue-900/30 bg-black/40">
                            <span class="text-xs text-blue-300 mono uppercase tracking-widest font-bold">Defense Arsenal</span>
                        </div>
                        
                        <!-- Dynamically filled by renderDefenseArsenal() -->
                        <div id="defense-arsenal" class="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            <!-- filled by JS -->
                        </div>

                        <!-- Custom Rule -->
                        <div class="p-4 border-t border-blue-900/30 bg-black/60">
                            <p class="text-[10px] text-blue-300 mb-2 mono uppercase tracking-widest">Custom Regex Rule</p>
                            <div class="flex gap-2">
                                <input type="text" id="blue-custom-rule" 
                                    class="flex-1 bg-black/50 border border-blue-800/50 p-2 rounded text-blue-100 mono text-xs outline-none focus:border-cyan-500 transition shadow-inner" 
                                    placeholder="e.g. .*UNION.*SELECT.*">
                                <button onclick="deployCustomRule()" class="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-xs font-bold tracking-wider transition shadow-lg shadow-blue-900/50">DEPLOY</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
"""

# Now we need to append the closing tags that we overwrite
closing_tags = """</div>
</main>

"""

with open('templates/compete.html', 'w', encoding='utf-8') as f:
    f.write(text[:start_idx] + new_html + closing_tags + text[end_idx:])

print("Successfully replaced the controls in compete.html")
