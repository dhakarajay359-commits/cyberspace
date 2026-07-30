function showHowToPlayModal() {
            const container = document.getElementById('dynamic-map-content');
            let content = '';
            
            if (window.currentScenario === 'custom_ctf') {
                content = `
                    <div class="mb-8">
                        <h3 class="text-red-500 font-bold mb-4 flex items-center gap-2"><span class="mi">swords</span> RED TEAM STRATEGY (ATTACK)</h3>
                        <div class="flex items-center justify-between mono text-xs">
                            <div class="map-node border-red-900/50 text-red-400 w-1/4">
                                <div class="font-bold text-sm mb-1 text-white">1. Attacker</div>
                                Injects custom keyword<br>e.g. 'hack_me_123'
                            </div>
                            <div class="map-line"><div class="payload-dot bg-red-500 text-red-500 animate-travel"></div></div>
                            <div class="map-node border-blue-900/50 text-blue-400 w-1/4 opacity-50">
                                <div class="font-bold text-sm mb-1 text-white">2. WAF</div>
                                No Rule Matches
                            </div>
                            <div class="map-line"><div class="payload-dot bg-red-500 text-red-500 animate-travel" style="animation-delay: 1s"></div></div>
                            <div class="map-node border-emerald-900/50 text-emerald-400 w-1/4 glow-red">
                                <div class="font-bold text-sm mb-1 text-white">3. Target Server</div>
                                Exploit Keyword Found!<br><span class="text-red-500 font-black text-sm">RED WINS</span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h3 class="text-blue-400 font-bold mb-4 flex items-center gap-2"><span class="mi">shield</span> BLUE TEAM STRATEGY (DEFENSE)</h3>
                        <div class="flex items-center justify-between mono text-xs">
                            <div class="map-node border-red-900/50 text-red-400 w-1/4 opacity-50"><div class="font-bold text-sm mb-1 text-white">1. Attacker</div>Injects custom keyword</div>
                            <div class="map-line"><div class="payload-dot bg-red-500 text-red-500 animate-block"></div></div>
                            <div class="map-node border-blue-500 glow-blue text-blue-400 w-1/4 relative">
                                <div class="font-bold text-sm mb-1 text-white">2. WAF Defense</div>
                                Rule Blocks Keyword!<br>Payload Blocked
                                <div class="absolute -top-3 -right-3 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center font-bold text-lg animate-ping">✕</div>
                            </div>
                            <div class="map-line opacity-20"></div>
                            <div class="map-node border-emerald-900/50 text-emerald-400 w-1/4"><div class="font-bold text-sm mb-1 text-white">3. Target Server</div>Safe.<br><span class="text-blue-400 font-black text-sm">BLUE DEFENDS</span></div>
                        </div>
                    </div>
                    <div class="mt-8 text-slate-400 text-sm border-t border-slate-800 pt-4"><strong class="text-indigo-400">Sandbox Rules:</strong> In a Custom Scenario, the Red Team must use the specific Exploit Keyword chosen by the Host. The Blue Team must write a regex to block that specific keyword.</div>
                `;
            } 