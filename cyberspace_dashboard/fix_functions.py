import re

with open('templates/compete.html', 'r', encoding='utf-8') as f:
    text = f.read()

start_idx = text.find('function showWaitingRoom')
end_idx = text.find('async function joinLobby()')

clean_code = """function showWaitingRoom(lobbyId, redCode, blueCode) {
            document.getElementById('lobby-setup').classList.add('hidden');
            document.getElementById('waiting-room').classList.remove('hidden');

            document.getElementById('display-lobby-id').textContent = lobbyId;
            document.getElementById('display-red-code').textContent = redCode;
            document.getElementById('display-blue-code').textContent = blueCode;

            window._redCode = redCode;
            window._blueCode = blueCode;
            window._demoLobbyId = lobbyId;

            const base = window.location.origin + window.location.pathname;

            const demoDiv = document.getElementById('solo-demo-links');
            if (demoDiv) {
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

            // Start polling for the other player
            startLobbyPoll(lobbyId);
        }

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
        })();

        async function createLobby() {
            const scenario = document.getElementById('create-scenario').value;
            const team = document.getElementById('create-team').value;
            const customDesc = document.getElementById('create-custom-desc').value;
            const customFlag = document.getElementById('create-custom-flag').value;
            
            if (scenario === 'custom_ctf' && (!customDesc || !customFlag)) {
                showError('Please provide both Target Details and Exploit Payload.');
                return;
            }
            
            try {
                const res = await fetch('/api/lobby/create', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ 
                        scenario: scenario, 
                        host_team: team, 
                        max_players: 2,
                        custom_desc: customDesc,
                        custom_flag: customFlag
                    })
                });
                
                // If the user's session expired, the backend redirects to the login page (HTML)
                if (res.redirected && res.url.includes('login')) {
                    return showError('Session expired. Please refresh the page and log in again.');
                }
                
                const contentType = res.headers.get("content-type");
                if (!contentType || !contentType.includes("application/json")) {
                    return showError('Server returned an invalid response. Please refresh the page.');
                }
                
                const data = await res.json();
                if (data.success) {
                    currentLobbyId = data.lobby_id;
                    myTeam = team; 
                    isHost = true;
                    showWaitingRoom(currentLobbyId, data.red_invite_code, data.blue_invite_code);
                } else {
                    showError(data.error);
                }
            } catch (err) { console.error(err); showError('Failed to create lobby. Check console.'); }
        }

        """

text = text[:start_idx] + clean_code + text[end_idx:]

with open('templates/compete.html', 'w', encoding='utf-8') as f:
    f.write(text)
