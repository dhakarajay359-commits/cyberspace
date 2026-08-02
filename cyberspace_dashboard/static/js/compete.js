let currentLobbyId = null;

        let myTeam = null;

        let isHost = false;

        let lobbyPollInterval = null;

        let gamePollInterval = null;

        window.breachTriggered = false;



        // ─── AUTO-JOIN FROM URL PARAMS (Solo Demo Mode) ───

        (async function autoJoinFromUrl() {

            const params = new URLSearchParams(window.location.search);

            const demoLobby = params.get('lobby');

            const demoTeam = params.get('team');

            if (!demoLobby || !demoTeam) return;



            try {

                // Step 1: Verify demo join

                const joinRes = await fetch('/api/lobby/demo-join', {

                    method: 'POST',

                    headers: {'Content-Type': 'application/json'},

                    body: JSON.stringify({ lobby_id: demoLobby, team: demoTeam })

                });

                const joinData = await joinRes.json();

                if (!joinData.success) {

                    console.warn('Demo join failed:', joinData.error);

                    return;

                }



                currentLobbyId = demoLobby;

                myTeam = demoTeam;

                isHost = false;



                // Step 2 removed: Don't auto-start the game on the server!



                // Step 3: Fetch lobby status to get the scenario

                const statusRes = await fetch(`/api/lobby/status/${demoLobby}`);

                const statusData = await statusRes.json();

                

                if (statusData.scenario) window.currentScenario = statusData.scenario;

                if (statusData.custom_desc) window.customDesc = statusData.custom_desc;



                // Step 4: Trigger battleground
                document.getElementById('lobby-modal').classList.add('hidden');
                document.getElementById('waiting-room').classList.add('hidden');
                document.getElementById('battleground-ui').classList.remove('hidden');
                startMatch();

                

            } catch(e) {

                console.error('Demo setup failed:', e);

            }

        
    // Send presence heartbeat every 1 second
    setInterval(() => {
        if (currentLobbyId && myTeam) {
            fetch('/api/game/ping', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({lobby_id: currentLobbyId, team: myTeam})
            }).catch(() => {});
        }
    }, 1000);
})();




function showWaitingRoom(lobbyId, redCode = '', blueCode = '') {
            document.getElementById('lobby-modal').classList.add('hidden');

            document.getElementById('waiting-room').classList.remove('hidden');

            document.getElementById('display-lobby-id').textContent = lobbyId;

            

            if (redCode) document.getElementById('display-red-code').textContent = redCode;

            if (blueCode) document.getElementById('display-blue-code').textContent = blueCode;

            // Hide opposing team's invite code for Solo Demo Mode focus
            if (isHost) {
                const redContainer = document.getElementById('display-red-code').parentElement;
                const blueContainer = document.getElementById('display-blue-code').parentElement;
                
                if (myTeam === 'red') {
                    if (blueContainer) blueContainer.style.display = 'none';
                    if (redContainer) redContainer.style.display = 'block';
                } else if (myTeam === 'blue') {
                    if (redContainer) redContainer.style.display = 'none';
                    if (blueContainer) blueContainer.style.display = 'block';
                }
            }



            // Store codes for verification

            window._redCode = redCode;

            window._blueCode = blueCode;

            window._demoLobbyId = lobbyId;



            const base = window.location.origin + window.location.pathname;



            const demoDiv = document.getElementById('solo-demo-links');
            if (demoDiv) {
                if (myTeam !== 'host') {
                    demoDiv.innerHTML = '';
                } else {
                    let buttonsHtml = `
                    <button onclick="verifyAndOpenTab('red')"
                       class="bg-red-900/40 border-2 border-red-500/70 text-red-400 font-black px-6 py-3 rounded-xl text-sm hover:bg-red-600 hover:text-white transition flex items-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                       <span class="mi">swords</span> Open RED TEAM Tab
                       <span class="text-xs font-normal text-red-300 ml-1">(Enter Red Code First)</span>
                    </button>
                    <button onclick="verifyAndOpenTab('blue')"
                       class="bg-blue-900/40 border-2 border-blue-500/70 text-blue-400 font-black px-6 py-3 rounded-xl text-sm hover:bg-blue-600 hover:text-white transition flex items-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                       <span class="mi">shield</span> Open BLUE TEAM Tab
                       <span class="text-xs font-normal text-blue-300 ml-1">(Enter Blue Code First)</span>
                    </button>`;

                demoDiv.innerHTML = `
                    <div class="bg-slate-900/80 border border-slate-700 rounded-xl p-6 mt-6 text-center">
                        <p class="text-emerald-400 font-black text-sm uppercase tracking-widest mb-1"> Solo Demo Mode  Two Tab Setup</p>
                        <p class="text-slate-400 text-xs mb-5">Click a team button below. You will be asked to enter that team's invite code before the tab opens.</p>
                        <div class="flex gap-4 justify-center flex-wrap">
                            ${buttonsHtml}
                        </div>
                    </div>

                    <!-- Team Code Verification Modal -->

                    <div id="tab-verify-modal" class="hidden fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm">

                        <div id="tab-verify-box" class="bg-slate-950 rounded-2xl p-8 w-full max-w-sm text-center shadow-2xl relative">

                            <div id="tab-verify-icon" class="text-5xl mb-4"><span class="mi mi-xl" style="font-size:56px">lock</span></div>

                            <h3 id="tab-verify-title" class="text-white font-black text-xl uppercase tracking-widest mb-1">Enter Team Code</h3>

                            <p id="tab-verify-subtitle" class="text-slate-400 text-xs mb-5">Only team members with the correct invite code can access this view.</p>

                            <input id="tab-verify-input" type="text"

                                class="w-full bg-black border-2 border-slate-700 focus:border-emerald-500 rounded-lg px-4 py-3 text-white mono text-center text-lg uppercase tracking-widest outline-none transition mb-2"

                                placeholder="e.g. R-abc123"

                                oninput="this.value = this.value.toUpperCase()">

                            <p id="tab-verify-error" class="text-red-400 text-xs mb-4 hidden">❌ Incorrect code. Try again.</p>

                            <div class="flex gap-3 mt-2">

                <button onclick="confirmTabOpen()" id="tab-verify-confirm"

                    class="flex-1 font-black py-3 rounded-lg text-sm uppercase tracking-widest transition bg-emerald-600 hover:bg-emerald-500 text-white">

                    <span class="mi mi-sm">check_circle</span> CONFIRM &amp; OPEN TAB

                </button>

                                <button onclick="closeTabVerify()"

                                    class="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 px-4 rounded-lg text-sm transition">

                                    Cancel

                                </button>

                            </div>

                        </div>

                    </div>`;
                }
            }

            

            pollLobbyStatus();

            lobbyPollInterval = setInterval(pollLobbyStatus, 2000);

        }



        let _pendingTabTeam = null;



        function verifyAndOpenTab(team) {

            _pendingTabTeam = team;

            const modal = document.getElementById('tab-verify-modal');

            const icon = document.getElementById('tab-verify-icon');

            const title = document.getElementById('tab-verify-title');

            const subtitle = document.getElementById('tab-verify-subtitle');

            const confirm = document.getElementById('tab-verify-confirm');

            const input = document.getElementById('tab-verify-input');

            const errMsg = document.getElementById('tab-verify-error');



            input.value = '';

            errMsg.classList.add('hidden');



            if (team === 'red') {

                icon.innerHTML = '<span class="mi" style="font-size:52px;color:#ef4444">swords</span>';

                title.textContent = 'Red Team Access';

                title.className = 'text-red-400 font-black text-xl uppercase tracking-widest mb-1';

                subtitle.textContent = 'Enter the Red Team invite code to open the Attacker tab.';

                confirm.className = 'flex-1 font-black py-3 rounded-lg text-sm uppercase tracking-widest transition bg-red-600 hover:bg-red-500 text-white';

                input.style.borderColor = 'rgba(239,68,68,0.6)';

                input.placeholder = 'e.g. R-abc123';

            } else {

                icon.innerHTML = '<span class="mi" style="font-size:52px;color:#60a5fa">shield</span>';

                title.textContent = 'Blue Team Access';

                title.className = 'text-blue-400 font-black text-xl uppercase tracking-widest mb-1';

                subtitle.textContent = 'Enter the Blue Team invite code to open the Defender tab.';

                confirm.className = 'flex-1 font-black py-3 rounded-lg text-sm uppercase tracking-widest transition bg-blue-600 hover:bg-blue-500 text-white';

                input.style.borderColor = 'rgba(59,130,246,0.6)';

                input.placeholder = 'e.g. B-abc123';

            }



            modal.classList.remove('hidden');

            setTimeout(() => input.focus(), 100);



            // Allow pressing Enter to confirm

            input.onkeypress = (e) => { if (e.key === 'Enter') confirmTabOpen(); };

        }



        function confirmTabOpen() {

            const input = document.getElementById('tab-verify-input');

            const errMsg = document.getElementById('tab-verify-error');

            const entered = input.value.trim().toUpperCase();



            const correctCode = (_pendingTabTeam === 'red'

                ? (window._redCode || '').toUpperCase()

                : (window._blueCode || '').toUpperCase());



            if (entered !== correctCode) {

                errMsg.classList.remove('hidden');

                input.style.borderColor = '#ef4444';

                input.focus();

                return;

            }



            // Code correct — open the tab

            const base = window.location.origin + window.location.pathname;

            const url = `${base}?lobby=${window._demoLobbyId}&team=${_pendingTabTeam}`;

            window.open(url, '_blank');

            closeTabVerify();

        }



        function closeTabVerify() {

            document.getElementById('tab-verify-modal').classList.add('hidden');

            _pendingTabTeam = null;

        }



        async function pollLobbyStatus() {
            if(!currentLobbyId) return;
            try {
                const res = await fetch(`/api/lobby/status/${currentLobbyId}`);
                const data = await res.json();
                if(data.success) {
                    if (data.red_invite_code) document.getElementById('display-red-code').textContent = data.red_invite_code;
                    if (data.blue_invite_code) document.getElementById('display-blue-code').textContent = data.blue_invite_code;
                    if (data.scenario) window.currentScenario = data.scenario;
                    if (data.custom_desc) window.customDesc = data.custom_desc;
                    
                    // Show only our team's invite code unless we are host (host can see both to give out initially)
                    if (isHost || (data.is_leader && myTeam === 'red')) {
                        document.getElementById('red-invite-container').classList.remove('hidden');
                    }
                    if (isHost || (data.is_leader && myTeam === 'blue')) {
                        document.getElementById('blue-invite-container').classList.remove('hidden');
                    }
                    
                    // Show force start button to leaders
                    if (data.is_leader) {
                        let hasOpponent = (myTeam === 'red' && data.members.blue && data.members.blue.length > 0) || 
                                          (myTeam === 'blue' && data.members.red && data.members.red.length > 0) ||
                                          (isHost && data.members.red && data.members.red.length > 0 && data.members.blue && data.members.blue.length > 0);
                        
                        let btn = document.getElementById('force-start-btn');
                        btn.classList.remove('hidden');
                        
                        if (hasOpponent) {
                            btn.disabled = false;
                            btn.classList.remove('opacity-50', 'cursor-not-allowed');
                            btn.textContent = 'FORCE DEPLOY';
                        } else {
                            btn.disabled = true;
                            btn.classList.add('opacity-50', 'cursor-not-allowed');
                            btn.textContent = 'WAITING FOR OPPONENT...';
                        }
                    } else {
                        document.getElementById('force-start-btn').classList.add('hidden');
                    }
                    
                    const getStatusBadge = (username) => (data.connected_users && data.connected_users.includes(username)) 
                        ? `<span class="text-xs font-bold bg-emerald-900/50 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded ml-2 shadow-[0_0_8px_rgba(52,211,153,0.4)]">[CONNECTED]</span>` 
                        : `<span class="text-xs bg-slate-800 text-slate-400 border border-slate-600 px-2 py-0.5 rounded ml-2">[WAITING]</span>`;

                    const getLeaderBadge = (username) => {
                        let isRedLeader = data.leaders && data.leaders.red === username;
                        let isBlueLeader = data.leaders && data.leaders.blue === username;
                        return (isRedLeader || isBlueLeader) ? `<span class="text-xs text-amber-400 ml-2 font-bold">[LEADER]</span>` : '';
                    };

                    const redList = document.getElementById('red-team-list');
                    redList.innerHTML = data.members.red.map(u => `<li><span class="text-slate-500">></span> ${u} ${getLeaderBadge(u)} ${getStatusBadge(u)}</li>`).join('');
                    
                    const blueList = document.getElementById('blue-team-list');
                    blueList.innerHTML = data.members.blue.map(u => `<li><span class="text-slate-500">></span> ${u} ${getLeaderBadge(u)} ${getStatusBadge(u)}</li>`).join('');

                    const indicator = document.getElementById('deploy-status-indicator');
                    if(indicator) {
                        if (data.presence?.red && data.presence?.blue) {
                            indicator.className = 'text-emerald-400 font-bold mono bg-emerald-900/30 border border-emerald-500/50 py-3 px-6 rounded-lg animate-pulse';
                            indicator.textContent = 'DEPLOYING...';
                        } else {
                            indicator.className = 'text-amber-400 font-bold mono bg-amber-900/30 border border-amber-500/50 py-3 px-6 rounded-lg animate-pulse';
                            indicator.textContent = 'AWAITING PLAYERS';
                        }
                    }

                    if (data.status === 'active' && !document.getElementById('countdown-overlay')) startMatch();
                }
            } catch(e) { 
                // Silently ignore polling errors so server restarts don't spam the console
            }
        }

        
        function goBackToLobbyModal() {
            if (lobbyPollInterval) clearInterval(lobbyPollInterval);
            document.getElementById('waiting-room').classList.add('hidden');
            document.getElementById('battleground-ui').classList.add('hidden');
            document.getElementById('lobby-modal').classList.remove('hidden');
            
            // Clear current active state locally so they can join/create a new lobby cleanly
            currentLobbyId = null;
            myTeam = null;
            isHost = false;
        }
        
        async function forceStartMatch() {

            try {
                await fetch('/api/lobby/start', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ lobby_id: currentLobbyId })
                });
            } catch(e) { console.error('Failed to force start', e); }
        }



        // ─── SCENARIO DATA: All attack payloads + defenses ───





        async function startMatch() {

            if (isHost) {
                try {
                    await fetch('/api/lobby/start', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ lobby_id: currentLobbyId })
                    });
                } catch(e) { console.error('Failed to start lobby', e); return; }
            }

            if(lobbyPollInterval) clearInterval(lobbyPollInterval);
            document.getElementById('waiting-room').classList.add('hidden');
            document.getElementById('battleground-ui').classList.remove('hidden');
            document.getElementById('bg-lobby-id').textContent = currentLobbyId;

            if (myTeam === 'red') {
                document.getElementById('red-controls').classList.remove('hidden');
                document.getElementById('blue-controls').classList.add('hidden');
                renderAttackArsenal();
            } else if (myTeam === 'blue' || myTeam === 'host') {
                document.getElementById('blue-controls').classList.remove('hidden');
                document.getElementById('red-controls').classList.add('hidden');
                renderDefenseArsenal();
            }
            renderTargetPreview();

            // 10 Second Deployment Countdown
            const countdownOverlay = document.createElement('div');
            countdownOverlay.id = 'countdown-overlay';
            countdownOverlay.className = 'fixed inset-0 bg-black/95 z-[100] flex flex-col items-center justify-center font-mono text-emerald-500';
            countdownOverlay.innerHTML = `
                <div class="text-3xl md:text-5xl font-black mb-6 tracking-[8px] animate-pulse">DEPLOYING TERMINALS</div>
                <div id="countdown-timer" class="text-7xl md:text-9xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]">10</div>
                <div class="mt-8 text-slate-400 text-sm md:text-base animate-pulse">Establishing secure connection to target infrastructure...</div>
                <div class="mt-2 text-slate-500 text-xs">Synchronizing Red and Blue team environments</div>
            `;
            document.body.appendChild(countdownOverlay);

            let timeLeft = 10;
            const timerInterval = setInterval(() => {
                timeLeft--;
                const timerEl = document.getElementById('countdown-timer');
                if(timerEl) timerEl.textContent = timeLeft;
                if (timeLeft <= 0) {
                    clearInterval(timerInterval);
                    if(countdownOverlay.parentNode) countdownOverlay.remove();
                    // START REAL-TIME POLLING (300ms for instant updates)
                    gamePollInterval = setInterval(pollGameState, 300);
                }
            }, 1000);
        }



async function renderAttackArsenal() {
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
            let levelColor = "text-emerald-400 border-emerald-900/50";
            if (p.level === "Intermediate") levelColor = "text-amber-400 border-amber-900/50";
            if (p.level === "Advanced") levelColor = "text-purple-400 border-purple-900/50";
            
            const card = document.createElement('div');
            card.className = `payload-card border ${levelColor} bg-black/40`;
            card.innerHTML = `
            <div class="flex items-center justify-between mb-1">
                <span class="text-red-300 text-xs font-bold mono">${p.label} <span class="text-[9px] ${levelColor} px-1 border rounded ml-1">${p.level}</span></span>
                <span class="text-slate-600 text-[10px]">${p.tip}</span>
            </div>
            <button class="payload-btn" onclick="firePayload(this, \`${p.payload.replace(/`/g,'\\`')}\`)">▶ ${p.payload}</button>`;
            panel.appendChild(card);
        });
    } catch(e) {
        console.error('Failed to load attack arsenal', e);
    }
}



        function firePayload(btn, payload) {

            // Flash button

            btn.style.background = '#7f1d1d';

            setTimeout(() => btn.style.background = '', 300);

            // Set into input + send

            document.getElementById('red-payload').value = payload;

            sendAttack(payload);

            // Switch to terminal tab to see output

            switchAttackTab('terminal');

        }



        function switchAttackTab(tab) {

            document.querySelectorAll('.attack-tab').forEach(t => t.classList.remove('active-tab'));

            document.getElementById('tab-' + tab).classList.add('active-tab');

            document.getElementById('panel-payloads').classList.toggle('hidden', tab !== 'payloads');

            document.getElementById('panel-terminal').classList.toggle('hidden', tab !== 'terminal');

            if (tab === 'terminal') document.getElementById('panel-terminal').classList.add('flex');

            else document.getElementById('panel-terminal').classList.remove('flex');

        }



        const _deployedRules = new Set();



async function renderDefenseArsenal() {
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
            let levelColor = "text-emerald-400 border-emerald-900/50";
            if (d.level === "Intermediate") levelColor = "text-amber-400 border-amber-900/50";
            if (d.level === "Advanced") levelColor = "text-purple-400 border-purple-900/50";
            
            const btn = document.createElement('button');
            btn.className = `defense-btn border ${levelColor} bg-black/40`;
            if (_deployedRules.has(d.rule)) btn.classList.add('deployed');
            btn.dataset.rule = d.rule;
            btn.innerHTML = `<span class="font-bold text-blue-300">${d.label}</span> <span class="text-[9px] ${levelColor} px-1 border rounded ml-1">${d.level}</span><br><span class="text-[10px] text-slate-500">${d.tip}</span>`;
            btn.onclick = () => deployDefenseRule(btn, d.rule, d.label);
            arsenal.appendChild(btn);
        });
    } catch(e) {
        console.error('Failed to load defense arsenal', e);
    }
}



        async function deployDefenseRule(btn, rule, label) {

            if (_deployedRules.has(rule)) return; // already active

            const res = await deployDefense(rule);

            if (res !== false) {

                _deployedRules.add(rule);

                btn.classList.add('deployed');

                btn.onclick = null;

                // Update active rules list

                const list = document.getElementById('active-rules-list');

                if (list.querySelector('.italic')) list.innerHTML = '';

                const chip = document.createElement('div');

                chip.className = 'text-[10px] text-emerald-400 mono';

                chip.textContent = `✓ ${label}`;

                list.appendChild(chip);

                // Raise threat level text

                const tl = document.getElementById('blue-threat-level');

                if (tl) { tl.textContent = 'THREAT LEVEL: CONTAINED'; tl.className = 'text-xs font-bold text-blue-400 mono'; }

            }

        }



        function deployCustomRule() {

            const input = document.getElementById('blue-custom-rule');

            const rule = input.value.trim();

            if (!rule) return;

            input.value = '';

            deployDefense(rule);

        }

        async function decryptPayload() {
            const input = document.getElementById('blue-decrypt-input');
            const cipher = input.value.trim();
            if(!cipher) return;
            
            try {
                const res = await fetch('/api/game/decrypt', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ lobby_id: currentLobbyId, encrypted_text: cipher })
                });
                const data = await res.json();
                if(data.success) {
                    input.value = ''; // clear input
                    document.getElementById('blue-verify-input').value = data.decrypted; // prep verify box
                    alert(`Decrypted Payload: ${data.decrypted}`);
                } else {
                    alert(data.error);
                }
            } catch(e) { console.error(e); }
        }

        async function verifyAttack() {
            const input = document.getElementById('blue-verify-input');
            const decrypted = input.value.trim();
            if(!decrypted) return;
            
            try {
                const res = await fetch('/api/game/verify', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ lobby_id: currentLobbyId, decrypted_payload: decrypted })
                });
                const data = await res.json();
                if(data.success) {
                    alert(data.message);
                } else {
                    alert(data.error);
                }
            } catch(e) { console.error(e); }
        }

        

        function renderTargetPreview() {

            const targetArea = document.getElementById('target-preview-area');

            if (window.currentScenario === 'sqli_login') {

                targetArea.innerHTML = `

                    <div class="bg-slate-800 p-2 text-xs font-mono text-slate-400 flex items-center gap-2">

                        <div class="w-2 h-2 rounded-full bg-emerald-500"></div> TARGET: INTERNAL HR PORTAL (SIMULATED)

                    </div>

                    <div class="flex-1 bg-white p-4 overflow-y-auto">

                        <div class="max-w-md mx-auto mt-8 border p-6 rounded shadow-lg">

                            <h2 class="text-2xl font-bold text-gray-800 mb-4">Employee Login</h2>

                            <input type="text" id="target-input" placeholder="Username" class="w-full border p-2 mb-4 rounded text-black">

                            <input type="password" placeholder="Password" class="w-full border p-2 mb-4 rounded text-black">

                            <button onclick="submitTargetForm()" class="bg-blue-600 text-white w-full py-2 rounded hover:bg-blue-700 transition">Login</button>

                            <p class="text-xs text-gray-500 mt-4 text-center">Notice: v1.0.4 - Please report bugs to IT.</p>

                        </div>

                    </div>`;

            } else if (window.currentScenario === 'cmd_ping') {

                targetArea.innerHTML = `

                    <div class="bg-slate-800 p-2 text-xs font-mono text-slate-400 flex items-center gap-2">

                        <div class="w-2 h-2 rounded-full bg-emerald-500"></div> TARGET: NETWORK DIAGNOSTICS (SIMULATED)

                    </div>

                    <div class="flex-1 bg-gray-100 p-4 overflow-y-auto font-mono text-sm">

                        <div class="max-w-xl mx-auto mt-4 p-4 bg-white border border-gray-300 shadow">

                            <h2 class="text-xl font-bold text-blue-900 mb-4 border-b pb-2">Ping Utility v2.1</h2>

                            <p class="mb-4 text-gray-700">Enter an IP address or hostname to ping.</p>

                            <div class="flex gap-2 mb-4">

                                <input type="text" id="target-input" placeholder="8.8.8.8" class="flex-1 border p-2 text-black bg-gray-50">

                                <button onclick="submitTargetForm()" class="bg-blue-800 text-white px-6 py-2 font-bold hover:bg-blue-900 transition">PING</button>

                            </div>

                            <div class="bg-black text-green-400 p-4 h-32 overflow-y-auto">

                                > Ready...

                            </div>

                        </div>

                    </div>`;

            } else if (window.currentScenario === 'xss_search') {

                targetArea.innerHTML = `

                    <div class="bg-slate-800 p-2 text-xs font-mono text-slate-400 flex items-center gap-2">

                        <div class="w-2 h-2 rounded-full bg-emerald-500"></div> TARGET: PRODUCT CATALOG (SIMULATED)

                    </div>

                    <div class="flex-1 bg-white p-4 overflow-y-auto text-black">

                        <div class="max-w-2xl mx-auto mt-4">

                            <h2 class="text-2xl font-black text-amber-500 mb-6">eShop Search</h2>

                            <div class="flex gap-2 mb-8">

                                <input type="text" id="target-input" placeholder="Search for products..." class="flex-1 border-2 border-gray-300 p-3 rounded-lg text-lg">

                                <button onclick="submitTargetForm()" class="bg-amber-500 text-white px-8 py-3 rounded-lg font-bold hover:bg-amber-600 transition">Search</button>

                            </div>

                            <div class="border-t pt-4">

                                <p class="text-gray-500 italic">No search query provided.</p>

                            </div>

                        </div>

                    </div>`;

            } else if (window.currentScenario === 'lfi_traversal') {

                targetArea.innerHTML = `

                    <div class="bg-slate-800 p-2 text-xs font-mono text-slate-400 flex items-center gap-2">

                        <div class="w-2 h-2 rounded-full bg-emerald-500"></div> TARGET: DOC STORAGE (SIMULATED)

                    </div>

                    <div class="flex-1 bg-[#1a1a1a] p-4 overflow-y-auto text-gray-300 font-mono">

                        <div class="max-w-2xl mx-auto mt-4 border border-gray-700">

                            <div class="bg-gray-800 p-2 border-b border-gray-700 font-bold">📄 Document Downloader</div>

                            <div class="p-6">

                                <p class="mb-4">Select a document to download:</p>

                                <div class="flex gap-2 mb-4">

                                    <span class="bg-gray-800 p-2 text-gray-400">download.php?file=</span>

                                    <input type="text" id="target-input" placeholder="report2025.pdf" class="flex-1 bg-black border border-gray-700 p-2 text-white">

                                    <button onclick="submitTargetForm()" class="bg-gray-700 hover:bg-gray-600 px-4 py-2 font-bold transition">GET</button>

                                </div>

                                <div class="bg-black p-4 border border-gray-700 min-h-[100px]">

                                    (Preview area)

                                </div>

                            </div>

                        </div>

                    </div>`;

            } else if (window.currentScenario === 'ssti_jinja') {

                targetArea.innerHTML = `

                    <div class="bg-slate-800 p-2 text-xs font-mono text-slate-400 flex items-center gap-2">

                        <div class="w-2 h-2 rounded-full bg-emerald-500"></div> TARGET: EMAIL MARKETING (SIMULATED)

                    </div>

                    <div class="flex-1 bg-white p-4 overflow-y-auto text-black">

                        <div class="max-w-2xl mx-auto mt-4 p-6 border-2 border-indigo-100 rounded-lg">

                            <h2 class="text-2xl font-bold text-indigo-700 mb-2">Campaign Template Editor</h2>

                            <p class="text-gray-500 mb-6">Customize the greeting for your email blast using our new rendering engine.</p>

                            

                            <label class="block text-sm font-bold text-gray-700 mb-2">Greeting Template</label>

                            <textarea id="target-input" rows="4" class="w-full border p-3 rounded bg-gray-50 mb-4" placeholder="Hello /* raw *//* user.name *//* endraw */, we have a special offer for you!"></textarea>

                            <button onclick="submitTargetForm()" class="bg-indigo-600 text-white px-6 py-2 rounded font-bold hover:bg-indigo-700 transition">Preview Rendering</button>

                            

                            <div class="mt-8 pt-4 border-t">

                                <p class="text-sm text-gray-500 font-bold mb-2">Live Preview:</p>

                                <div class="bg-gray-100 p-4 min-h-[50px] italic text-gray-600">No template provided yet.</div>

                            </div>

                        </div>

                    </div>`;

            } else if (window.currentScenario === 'custom_ctf') {

                const desc = window.customDesc || 'No details provided by the host.';

                targetArea.innerHTML = `

                    <div class="bg-slate-800 p-2 text-xs font-mono text-slate-400 flex items-center gap-2">

                        <div class="w-2 h-2 rounded-full bg-emerald-500"></div> TARGET: CUSTOM SIMULATION

                    </div>

                    <div class="flex-1 bg-white p-4 overflow-y-auto text-black font-mono">

                        <div class="max-w-2xl mx-auto border-2 border-slate-300 p-6 rounded bg-slate-50 shadow-md mt-4">

                            <h2 class="text-2xl font-black text-slate-800 mb-4 flex items-center gap-2"><span class="mi">router</span> Simulated Endpoint</h2>

                            <div class="text-slate-700 whitespace-pre-wrap mb-8 pb-6 border-b border-slate-300 text-sm leading-relaxed">${desc}</div>

                            

                            <label class="block text-xs font-bold text-slate-500 mb-2 tracking-widest uppercase">Inject Payload</label>

                            <div class="flex gap-2">

                                <input type="text" id="target-input" placeholder="Enter attack payload..." onkeypress="if(event.key==='Enter') submitTargetForm()" class="flex-1 bg-white border border-slate-400 p-3 rounded text-black focus:border-red-500 outline-none transition">

                                <button onclick="submitTargetForm()" class="bg-red-600 text-white px-8 py-3 rounded font-bold hover:bg-red-700 transition">EXECUTE</button>

                            </div>

                        </div>

                    </div>`;

            } else if (window.currentScenario === 'omni_sandbox') {

                targetArea.innerHTML = `

                    <div class="bg-slate-800 p-2 text-xs font-mono text-slate-400 flex items-center gap-2">

                        <div class="w-2 h-2 rounded-full bg-fuchsia-500"></div> TARGET: OMNI-SANDBOX

                    </div>

                    <div class="flex-1 bg-white p-4 overflow-y-auto text-black font-mono">

                        <div class="max-w-2xl mx-auto border-2 border-slate-300 p-6 rounded bg-slate-50 shadow-md mt-4">

                            <h2 class="text-2xl font-black text-slate-800 mb-4 flex items-center gap-2"><span class="mi text-fuchsia-600">bug_report</span> Vulnerable System Sandbox</h2>

                            <div class="text-slate-700 whitespace-pre-wrap mb-8 pb-6 border-b border-slate-300 text-sm leading-relaxed">This target is vulnerable to EVERYTHING (SQLi, XSS, CMD Injection, LFI, SSTI). 

Red Team: Throw any exploit at it.

Blue Team: Defend against all vectors simultaneously.</div>

                            

                            <label class="block text-xs font-bold text-slate-500 mb-2 tracking-widest uppercase">Inject Payload</label>

                            <div class="flex gap-2">

                                <input type="text" id="target-input" placeholder="Enter any exploit payload..." onkeypress="if(event.key==='Enter') submitTargetForm()" class="flex-1 bg-white border border-slate-400 p-3 rounded text-black focus:border-fuchsia-500 outline-none transition">

                                <button onclick="submitTargetForm()" class="bg-fuchsia-600 text-white px-8 py-3 rounded font-bold hover:bg-fuchsia-700 transition">EXECUTE</button>

                            </div>

                        </div>

                    </div>`;

            }

        }



        function submitTargetForm() {

            if (myTeam !== 'red') {

                alert("Only the Red Team (Offense) can execute payloads against the target.");

                return;

            }

            const input = document.getElementById('target-input');

            if (input && input.value) {

                const payload = input.value;

                input.value = '';

                // Forward the payload to the existing sendAttack function logic

                sendAttack(payload);

            }

        }



        async function pollGameState() {

            if(!currentLobbyId) return;

            try {

                const res = await fetch(`/api/game/state/${currentLobbyId}`);

                const data = await res.json();

                

                if (data.success) {

                    if (data.status === 'paused') {
                        document.getElementById('paused-overlay').classList.remove('hidden');
                    } else {
                        document.getElementById('paused-overlay').classList.add('hidden');
                    }
                    
                    if (data.status === 'active' && document.getElementById('waiting-room').classList.contains('hidden') === false) {

                        // Game started by host, but we are still in waiting room

                        startMatch();

                    }

                    

                    if (myTeam === 'blue' || myTeam === 'host') {
                        const traffic = document.getElementById('blue-traffic');
                        const newTraffic = data.logs.join('\n');
                        if (traffic && traffic.innerHTML !== newTraffic) {
                            traffic.innerHTML = newTraffic;
                            traffic.scrollTop = traffic.scrollHeight;
                        }
                    }
                    
                    if (myTeam === 'red' || myTeam === 'host') {
                        if (data.red_terminal_logs && data.red_terminal_logs.length > (window._redLogCount || 0)) {
                            const term = document.getElementById('red-terminal-output');
                            if (term) {
                                const newItems = data.red_terminal_logs.slice(window._redLogCount || 0);
                                term.innerHTML += '\n' + newItems.join('\n');
                                term.scrollTop = term.scrollHeight;
                            }
                            window._redLogCount = data.red_terminal_logs.length;
                        }
                    }
                    // Render Target State (Packed/Unpacked)
                    const badge = document.getElementById('target-status-badge');
                    if (badge) {
                        if (data.target_state === 'unpacked') {
                            badge.textContent = '[ TARGET UNPACKED - COMPROMISED ]';
                            badge.className = 'bg-red-900/80 text-red-400 border border-red-500/80 px-6 py-2 rounded-lg font-black tracking-[5px] mono text-lg shadow-[0_0_20px_rgba(239,68,68,0.5)] transition-all duration-300 animate-pulse';
                        } else {
                            badge.textContent = '[ TARGET PACKED - SECURE ]';
                            badge.className = 'bg-blue-900/50 text-blue-400 border border-blue-500/50 px-6 py-2 rounded-lg font-black tracking-[5px] mono text-lg shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-300';
                        }
                    }

                    // Server Authoritative Timer
                    if (data.time_remaining !== undefined && data.time_remaining !== null) {
                        const timerDisplay = document.getElementById('battleground-timer-display');
                        if (timerDisplay) {
                            const m = Math.floor(data.time_remaining / 60).toString().padStart(2, '0');
                            const s = (data.time_remaining % 60).toString().padStart(2, '0');
                            timerDisplay.textContent = m + ':' + s;
                            
                            if (data.time_remaining <= 30) {
                                timerDisplay.classList.add('text-red-500');
                                timerDisplay.classList.remove('text-amber-400');
                            }
                            
                            if (data.time_remaining <= 0 && data.status === 'active') {
                                if (isHost || window.myTeam === 'host') {
                                    try {
                                        fetch('/api/game/end_timer', {
                                            method: 'POST',
                                            headers: {'Content-Type': 'application/json'},
                                            body: JSON.stringify({ lobby_id: currentLobbyId })
                                        });
                                    } catch(err) {}
                                }
                            }
                        }
                    }

                    

                    if (data.status === 'red_wins' && !window.breachTriggered) {
                        window.breachTriggered = true;
                        clearInterval(gamePollInterval);
                        if (typeof battlegroundTimerInterval !== 'undefined') clearInterval(battlegroundTimerInterval);
                        if (myTeam === 'red') {
                            showRedVictory(data.winner || 'Red Team');
                        } else {
                            triggerBreach();
                        }
                    }

                    if (data.status === 'blue_wins' && !window.breachTriggered) {
                        window.breachTriggered = true;
                        clearInterval(gamePollInterval);
                        if (typeof battlegroundTimerInterval !== 'undefined') clearInterval(battlegroundTimerInterval);
                        showBlueVictory(data.winner || 'Blue Team');
                    }

                }

            } catch(e) { console.error('Game poll error', e); }

        }



        async function sendAttack(customPayload = null) {
            let payload = customPayload;
            if (!payload) {
                const input = document.getElementById('red-payload');
                payload = input.value.trim();
                if(!payload) return;
                input.value = '';
            }

            try {
                const encodedPayload = btoa(unescape(encodeURIComponent(payload)));
                const res = await fetch('/api/game/attack', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ lobby_id: currentLobbyId, payload: encodedPayload, is_encoded: true })
                });
                
                // Handle non-JSON responses from server (like 502 or 403 from external WAF)
                if (!res.ok) {
                    const text = await res.text();
                    try { JSON.parse(text); } catch(e) { throw new Error("Server returned non-JSON error: " + res.status); }
                } else {
                    await res.json();
                }
                
                pollGameState();
            } catch(e) { 
                const term = document.getElementById('red-terminal-output');
                if (term) {
                    term.innerHTML += `\n<div class="text-red-500 font-bold">> Network Error.</div>`;
                    term.scrollTop = term.scrollHeight;
                }
                console.error(e); 
            }
        }



        async function deployDefense(rule) {
            if (!rule) return false;
            try {
                const encodedRule = btoa(unescape(encodeURIComponent(rule)));
                const res = await fetch('/api/game/defend', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ lobby_id: currentLobbyId, rule: encodedRule, is_encoded: true })
                });
                
                if (!res.ok) {
                    const text = await res.text();
                    try { JSON.parse(text); } catch(e) { throw new Error("Server returned non-JSON error: " + res.status); }
                } else {
                    const data = await res.json();
                }
                pollGameState();

                // Raise threat level on first defense deployed
                const tl = document.getElementById('blue-threat-level');
                if (tl && tl.textContent === 'LOW') {
                    tl.textContent = 'ELEVATED';
                    tl.className = 'text-yellow-400 font-bold';
                }
                return data.success !== false;
            } catch(e) { 
                console.error(e); 
                const traffic = document.getElementById('blue-traffic');
                if (traffic) {
                    traffic.innerHTML += `\n<div class="text-red-400 font-bold">[WAF] Network Error Deploying Defense.</div>`;
                    traffic.scrollTop = traffic.scrollHeight;
                }
                return false;
            }
        }



        
async function createLobby() {
    const scenario = document.getElementById('create-scenario').value;
    const team = document.getElementById('create-team').value;
    const customDesc = document.getElementById('create-custom-desc').value;
    const customFlag = document.getElementById('create-custom-flag').value;
    const maxPlayers = parseInt(document.getElementById('create-max-players').value) || 2;

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
                max_players: maxPlayers,
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

async function joinLobby(role) {
    let payload = {};
    if (role === 'leader') {
        const lobbyId = document.getElementById('join-lobby-id').value.trim();
        const team = document.getElementById('join-team').value;
        if(!lobbyId) return showError('Please enter a Lobby ID');
        payload = { role: 'leader', lobby_id: lobbyId, team: team };
    } else {
        const inviteCode = document.getElementById('join-invite-code').value.trim();
        if(!inviteCode) return showError('Please enter a Team ID (Invite Code)');
        payload = { role: 'player', invite_code: inviteCode };
    }

    try {
        const res = await fetch('/api/lobby/join', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
            currentLobbyId = data.lobby_id;
            myTeam = data.team;
            isHost = (role === 'leader');
            
            if (data.status === 'waiting') {
                showWaitingRoom(currentLobbyId, data.red_code, data.blue_code);
            } else if (data.status === 'active') {
                document.getElementById('lobby-modal').classList.add('hidden');
                document.getElementById('waiting-room').classList.add('hidden');
                document.getElementById('battleground-ui').classList.remove('hidden');
                startMatch();
            }
        } else {
            showError(data.error);
        }
    } catch (err) { showError('Failed to join lobby'); }
}

function showError(msg) {

            const errDiv = document.getElementById('lobby-error');

            errDiv.textContent = msg;

            errDiv.classList.remove('hidden');

            setTimeout(() => errDiv.classList.add('hidden'), 3000);

        }



        // Matrix Rain Background

        const canvas = document.getElementById('matrix-bg');

        const ctx = canvas.getContext('2d');

        

        let width = canvas.width = window.innerWidth;

        let height = canvas.height = window.innerHeight;

        

        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$+-*/=%""\'#&_(),.;:?!\\|{}<>[]^~'.split('');

        const fontSize = 14;

        let columns = width / fontSize;

        const drops = [];

        for (let x = 0; x < columns; x++) drops[x] = 1;



        function drawMatrix() {

            ctx.fillStyle = 'rgba(5, 10, 15, 0.05)';

            ctx.fillRect(0, 0, width, height);

            

            ctx.fillStyle = '#0f5132'; // Dark green

            ctx.font = fontSize + 'px "JetBrains Mono"';

            

            for (let i = 0; i < drops.length; i++) {

                const text = chars[Math.floor(Math.random() * chars.length)];

                

                // Occasional bright green or white character

                if (Math.random() > 0.95) ctx.fillStyle = '#10b981';

                else if (Math.random() > 0.99) ctx.fillStyle = '#ffffff';

                else ctx.fillStyle = '#064e3b';

                

                ctx.fillText(text, i * fontSize, drops[i] * fontSize);

                

                if (drops[i] * fontSize > height && Math.random() > 0.975) {

                    drops[i] = 0;

                }

                drops[i]++;

            }

        }

        setInterval(drawMatrix, 35);

        window.addEventListener('resize', () => {

            width = canvas.width = window.innerWidth;

            height = canvas.height = window.innerHeight;

            columns = width / fontSize;

        });



        // Live Activity Feed Generator

        const hackers = ['ZeroDayNinja', 'BytePhantom', 'GhostInTheShell', 'CrashOverride', 'ViperSec', 'NeonBlade', 'CipherPunk', 'RootKitten'];

        const actions = ['rooted machine', 'captured flag', 'submitted vulnerability', 'achieved first blood on'];

        const targets = ['[HARD] Internal DC', '[EASY] Web App 01', '[INSANE] CEO Laptop', '[MEDIUM] Backup Server', 'SQLi Challenge'];



        function addFeedItem() {

            const feed = document.getElementById('feed-container');

            const hacker = hackers[Math.floor(Math.random() * hackers.length)];

            const action = actions[Math.floor(Math.random() * actions.length)];

            const target = targets[Math.floor(Math.random() * targets.length)];

            

            const isFirstBlood = action.includes('first blood');

            

            const div = document.createElement('div');

            div.className = 'flex items-start gap-3 text-xs p-3 rounded bg-slate-900/50 border border-slate-800/50 animate-[pulse_1s_ease-out] transition-all duration-300';

            div.style.opacity = '0';

            div.innerHTML = `

                <div class="text-xl mt-1">${isFirstBlood ? '🩸' : '💀'}</div>

                <div>

                    <p class="mb-1"><span class="${isFirstBlood ? 'text-red-400 font-bold' : 'text-emerald-400 font-semibold'}">${hacker}</span> <span class="text-slate-400">${action}</span> <span class="text-white mono">${target}</span></p>

                    <p class="text-[9px] text-slate-500 mono">Just now</p>

                </div>

            `;

            

            feed.prepend(div);

            // trigger reflow

            void div.offsetWidth;

            div.style.opacity = '1';



            if (feed.children.length > 5) feed.lastChild.remove();

        }



        // Initialize feed

        for(let i=0; i<4; i++) { addFeedItem(); }

        setInterval(addFeedItem, 5000);



        // ─── BREACH EVENT SYSTEM ───

        window.breachTriggered = false;



        function triggerBreach() {

            // 1. Deface the target preview with a ransomware screen

            const targetArea = document.getElementById('target-preview-area');

            if (targetArea) {

                targetArea.innerHTML = `

                    <div style="background:#000;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:'Courier New',monospace;padding:24px;box-sizing:border-box;">

                        <div style="font-size:72px;animation:breach-flicker 0.8s infinite;margin-bottom:16px;">💀</div>

                        <div style="color:#ef4444;font-size:28px;font-weight:900;text-transform:uppercase;letter-spacing:4px;margin-bottom:8px;animation:breach-text-glitch 0.15s infinite">YOU HAVE BEEN HACKED</div>

                        <div style="color:#f97316;font-size:13px;margin-bottom:24px;text-align:center;max-width:380px;line-height:1.8">

                            THIS WEBSITE HAS BEEN COMPROMISED.<br>

                            ALL DATA HAS BEEN ENCRYPTED AND EXFILTRATED.<br>

                            YOUR SYSTEM IS UNDER ATTACKER CONTROL.

                        </div>

                        <div style="border:1px solid #ef4444;padding:16px 32px;border-radius:8px;color:#ef4444;font-size:12px;text-align:center;box-shadow:0 0 20px rgba(239,68,68,0.5);">

                            <div style="font-size:10px;color:#94a3b8;margin-bottom:8px;">BREACH ID</div>

                            <div style="font-size:20px;letter-spacing:4px;">0xDEAD-BEEF-CAFE</div>

                        </div>

                        <div style="margin-top:24px;color:#64748b;font-size:10px;text-transform:uppercase;letter-spacing:3px;">cyberspace defsoc // red team breached your perimeter</div>

                    </div>`;

            }



            // 2. Show the dramatic Breach Alert modal

            document.getElementById('breach-overlay').classList.add('show');



            // 3. Flash the screen red

            document.body.style.transition = 'background-color 0.1s';

            let flashes = 0;

            const flashInterval = setInterval(() => {

                document.body.style.backgroundColor = flashes % 2 === 0 ? '#1a0000' : '#0a0a0f';

                flashes++;

                if (flashes > 8) { clearInterval(flashInterval); document.body.style.backgroundColor = ''; }

            }, 120);



            // 4. Add breach log to traffic

            const traffic = document.getElementById('blue-traffic');

            if (traffic) {

                traffic.innerHTML += `\n<span class='text-red-500 font-black'>⚠ ⚠ ⚠  CRITICAL BREACH DETECTED — ATTACKER HAS ROOT ACCESS — ALL DEFENSES BYPASSED  ⚠ ⚠ ⚠</span>`;

                traffic.scrollTop = traffic.scrollHeight;

            }

        }



        function remediateBreach() {

            document.getElementById('breach-overlay').classList.remove('show');

            // Restore target preview

            renderTargetPreview();

            const traffic = document.getElementById('blue-traffic');

            if (traffic) {

                traffic.innerHTML += `\n<span class='text-emerald-400 font-bold'>[REMEDIATED] Patch deployed. Systems restored. Post-incident review required.</span>`;

                traffic.scrollTop = traffic.scrollHeight;

            }

            // Show a final summary

            setTimeout(() => {
                alert('🔴 Match Over — Red Team breached your perimeter. Study the attack logs to harden your defenses for next time!');
                window.location.href = '/dashboard';
            }, 500);

        }



        function showRedVictory(winner) {
            const overlay = document.getElementById('red-victory-overlay');
            if(overlay) overlay.classList.add('show');
        }

        function showBlueVictory(winner) {
            const overlay = document.getElementById('blue-victory-overlay');
            if(overlay) overlay.classList.add('show');
        }

        function closeVictory() {
            window.location.href = '/dashboard';
        }

// --- NEW DEFENSIVE TOOLS & INTEL ---

async function analyzeTraffic() {
    if (!currentLobbyId) return;
    const analyzerModal = document.getElementById('traffic-analyzer-modal');
    const content = document.getElementById('traffic-analyzer-content');
    
    analyzerModal.classList.remove('hidden');
    content.innerHTML = '<span class="text-blue-500 animate-pulse">Initiating packet decryption...</span>';
    
    try {
        const res = await fetch('/api/game/investigate', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ lobby_id: currentLobbyId })
        });
        const data = await res.json();
        
        if (data.success) {
            content.innerHTML = '';
            if (data.payloads.length === 0) {
                content.innerHTML = '<span class="text-slate-500">No anomalous traffic recorded yet.</span>';
                return;
            }
            
            data.payloads.forEach(p => {
                const color = p.blocked ? 'text-red-500' : 'text-blue-400';
                const status = p.blocked ? '[BLOCKED]' : '[DECRYPTED]';
                // Escape HTML from payload to prevent XSS in analyzer
                const safePayload = String(p.payload).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
                content.innerHTML += `<div class="${color} mb-2">[${p.timestamp}] ${status} Payload Signature:<br><span class="text-slate-300">${safePayload}</span></div>`;
            });
            content.scrollTop = content.scrollHeight;
        } else {
            content.innerHTML = `<span class="text-red-500">Error: ${data.error}</span>`;
        }
    } catch(e) {
        content.innerHTML = `<span class="text-red-500">Analyzer failed to connect to matrix.</span>`;
    }
}

function showThreatIntel() {
    const modal = document.getElementById('threat-intel-modal');
    const content = document.getElementById('threat-intel-content');
    
    let html = '';
    
    switch (window.currentScenario) {
        case 'sqli_login':
            html = `
                <h3 class="text-emerald-400 font-bold mb-2">[INTEL] SQL Injection (Authentication Bypass)</h3>
                <p>The target server is running a legacy authentication module that directly concatenates user input into a SQL query.</p>
                <p class="mt-2"><strong>Red Team Objective:</strong> Inject SQL syntax (e.g., <code>' OR 1=1 --</code>) to manipulate the logic and bypass authentication.</p>
                <p class="mt-2"><strong>Blue Team Objective:</strong> Deploy a WAF rule (Regex) to intercept common SQLi signatures before they reach the database.</p>
            `;
            break;
        case 'cmd_injection':
            html = `
                <h3 class="text-emerald-400 font-bold mb-2">[INTEL] Command Injection (RCE)</h3>
                <p>An administrative ping utility on the target server passes user input directly to the system shell.</p>
                <p class="mt-2"><strong>Red Team Objective:</strong> Use command separators (e.g., <code>;</code>, <code>&&</code>, <code>|</code>) to execute arbitrary system commands.</p>
                <p class="mt-2"><strong>Blue Team Objective:</strong> Deploy a WAF rule to block shell metacharacters and command chaining operators.</p>
            `;
            break;
        case 'xss_search':
            html = `
                <h3 class="text-emerald-400 font-bold mb-2">[INTEL] Cross-Site Scripting (XSS)</h3>
                <p>The target web application reflects user search input directly into the HTML without sanitization.</p>
                <p class="mt-2"><strong>Red Team Objective:</strong> Inject malicious JavaScript (e.g., <code>&lt;script&gt;</code>) to hijack simulated user sessions.</p>
                <p class="mt-2"><strong>Blue Team Objective:</strong> Deploy a WAF rule to block script tags and common XSS event handlers.</p>
            `;
            break;
        case 'custom_ctf':
            html = `
                <h3 class="text-emerald-400 font-bold mb-2">[INTEL] Custom Threat Scenario</h3>
                <p>${window.customDesc || 'A classified target with an unknown vulnerability profile.'}</p>
                <p class="mt-2"><strong>Red Team Objective:</strong> Discover and exploit the specific vulnerability in the custom scenario.</p>
                <p class="mt-2"><strong>Blue Team Objective:</strong> Monitor traffic logs carefully and deploy WAF rules to block the anomalous patterns.</p>
            `;
            break;
        default:
            html = `
                <h3 class="text-emerald-400 font-bold mb-2">[INTEL] Classified Target</h3>
                <p>Insufficient intel available for this target. Proceed with caution.</p>
            `;
    }
    
    content.innerHTML = html;
    modal.classList.remove('hidden');
}

// --- NEW GAME TIMER LOGIC ---
let battlegroundTimerInterval = null;

function startBattlegroundTimer(durationSeconds) {
    if (battlegroundTimerInterval) clearInterval(battlegroundTimerInterval);
    
    let timeRemaining = durationSeconds;
    const timerDisplay = document.getElementById('battleground-timer-display');
    
    battlegroundTimerInterval = setInterval(async () => {
        timeRemaining--;
        
        if (timerDisplay) {
            const m = Math.floor(timeRemaining / 60).toString().padStart(2, '0');
            const s = (timeRemaining % 60).toString().padStart(2, '0');
            timerDisplay.textContent = m + ':' + s;
            
            if (timeRemaining <= 30) {
                timerDisplay.classList.add('text-red-500');
                timerDisplay.classList.remove('text-amber-400');
            }
        }
        
        if (timeRemaining <= 0) {
            clearInterval(battlegroundTimerInterval);
            if (timerDisplay) timerDisplay.textContent = '00:00';
            
            if (isHost || window.myTeam === 'host') {
                try {
                    await fetch('/api/game/end_timer', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ lobby_id: currentLobbyId })
                    });
                } catch (e) { console.error('Failed to end game', e); }
            }
        }
    }, 1000);
}



async function surrenderMatch() {
    if(!confirm('Are you sure you want to surrender? This will immediately give the opposing team the victory.')) return;
    try {
        await fetch('/api/game/surrender', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ lobby_id: currentLobbyId, team: myTeam })
        });
    } catch(err) { console.error('Failed to surrender', err); }
}
