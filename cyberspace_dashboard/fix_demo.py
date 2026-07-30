import re

with open('templates/compete.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace the broken demoDiv.innerHTML block
bad_block = """            if (demoDiv) {
                demoDiv.innerHTML = `
                await fetch('/api/lobby/start', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ lobby_id: demoLobby })
                });

                // Step 3: Fetch lobby status to get the scenario
                const statusRes = await fetch(`/api/lobby/status/${demoLobby}`);
                const statusData = await statusRes.json();
                if (statusData.scenario) window.currentScenario = statusData.scenario;
                if (statusData.custom_desc) window.customDesc = statusData.custom_desc;

                // Step 4: Load the game UI
                document.getElementById('lobby-modal').classList.add('hidden');
                await startMatch();

            } catch(e) {
                console.error('Demo auto-join error', e);
            }
        })();"""

good_block = """            if (demoDiv) {
                demoDiv.innerHTML = `
                    <div class="bg-slate-900/80 border border-slate-700 rounded-xl p-6 mt-6 text-center">
                        <p class="text-emerald-400 font-black text-sm uppercase tracking-widest mb-1">🎮 Solo Demo Mode — Two Tab Setup</p>
                        <p class="text-slate-400 text-xs mb-5">Click a team button below. You will be asked to enter a verification code to ensure the tab opens securely.</p>
                        <div class="flex gap-4 justify-center">
                            <button onclick="verifyAndOpenTab('${redCode}', 'red')" class="bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/50 py-2 px-6 rounded text-sm font-bold transition flex items-center gap-2">
                                <span class="mi">swords</span> Open Red Team Tab
                            </button>
                            <button onclick="verifyAndOpenTab('${blueCode}', 'blue')" class="bg-blue-600/20 hover:bg-blue-600 text-blue-500 hover:text-white border border-blue-500/50 py-2 px-6 rounded text-sm font-bold transition flex items-center gap-2">
                                <span class="mi">shield</span> Open Blue Team Tab
                            </button>
                        </div>
                    </div>`;
            }
        }
        
        // --- REAL AUTO JOIN DEMO LOGIC ---
        (async function autoJoinFromUrl() {
            const urlParams = new URLSearchParams(window.location.search);
            const demoLobby = urlParams.get('demo');
            const demoTeam = urlParams.get('team');
            if (!demoLobby || !demoTeam) return;

            try {
                // Step 1: Join the lobby
                const joinRes = await fetch('/api/lobby/demo-join', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ lobby_id: demoLobby, team: demoTeam })
                });
                const joinData = await joinRes.json();
                if (!joinData.success) {
                    console.error('Demo join failed:', joinData.error);
                    return;
                }

                window.currentLobbyId = demoLobby;
                window.currentTeam = demoTeam;

                // Step 2: Auto-start the lobby (if not already started)
                await fetch('/api/lobby/start', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ lobby_id: demoLobby })
                });

                // Step 3: Fetch lobby status to get the scenario
                const statusRes = await fetch(`/api/lobby/status/${demoLobby}`);
                const statusData = await statusRes.json();
                if (statusData.scenario) window.currentScenario = statusData.scenario;
                if (statusData.custom_desc) window.customDesc = statusData.custom_desc;

                // Step 4: Load the game UI
                document.getElementById('lobby-modal').classList.add('hidden');
                await startMatch();

            } catch(e) {
                console.error('Demo auto-join error', e);
            }
        })();"""

if bad_block in text:
    text = text.replace(bad_block, good_block)
    with open('templates/compete.html', 'w', encoding='utf-8') as f:
        f.write(text)
    print("Fixed bad block!")
else:
    # Try more robust replacement
    idx = text.find('demoDiv.innerHTML = `')
    end_idx = text.find('})();', idx) + 5
    if idx != -1 and end_idx != -1:
        text = text[:idx] + 'demoDiv.innerHTML = `\n' + good_block.split('demoDiv.innerHTML = `')[1] + text[end_idx:]
        with open('templates/compete.html', 'w', encoding='utf-8') as f:
            f.write(text)
        print("Fixed bad block robustly!")
    else:
        print("Could not find block!")
