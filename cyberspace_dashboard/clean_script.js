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

                // Step 2: Auto-start the game (so status becomes 'active')
                await fetch('/api/lobby/start', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ lobby_id: demoLobby })
                });

                // Step 3: Fetch lobby status to get the scenario
                const statusRes = await fetch(`/api/lobby/status/${demoLobby}`);
                const statusData = await statusRes.json();
                if (statusData.scenario) window.currentScenario = statusData.scenario;

                // Step 4: Load the game UI
                document.getElementById('lobby-modal').classList.add('hidden');
                await startMatch();

            } catch(e) {
                console.error('Demo auto-join error', e);
            }
        })();

        async function createLobby() {
            const scenario = document.getElementById('create-scenario').value;
            const hostTeam = document.getElementById('create-team').value;
            try {
                const res = await fetch('/api/lobby/create', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ max_players: 4, scenario: scenario, host_team: hostTeam })
                });
                const data = await res.json();
                if (data.success) {
                    currentLobbyId = data.lobby_id;
                    myTeam = hostTeam; 
                    isHost = true;
                    showWaitingRoom(currentLobbyId, data.red_invite_code, data.blue_invite_code);
                } else {
                    showError(data.error);
                }
            } catch (err) { showError('Failed to create lobby'); }
        }

        async function joinLobby() {
            const inviteCode = document.getElementById('join-invite-code').value.trim();
            if(!inviteCode) return showError('Please enter an Invite Code');
            
            try {
                const res = await fetch('/api/lobby/join', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ invite_code: inviteCode })
                });
                const data = await res.json();
                if (data.success) {
                    currentLobbyId = data.lobby_id;
                    myTeam = data.team;
                    showWaitingRoom(currentLobbyId);
                } else {
                    showError(data.error);
                }
            } catch (err) { showError('Failed to join lobby'); }
        }

        function showWaitingRoom(lobbyId, redCode = '', blueCode = '') {
            document.getElementById('lobby-modal').classList.add('hidden');
            document.getElementById('waiting-room').classList.remove('hidden');
            document.getElementById('display-lobby-id').textContent = lobbyId;
            
            if (redCode) document.getElementById('display-red-code').textContent = redCode;
            if (blueCode) document.getElementById('display-blue-code').textContent = blueCode;

            // Store codes for verification
            window._redCode = redCode;
            window._blueCode = blueCode;
            window._demoLobbyId = lobbyId;

            const base = window.location.origin + window.location.pathname;

            const demoDiv = document.getElementById('solo-demo-links');
            if (demoDiv) {
                demoDiv.innerHTML = `
                    <div class="bg-slate-900/80 border border-slate-700 rounded-xl p-6 mt-6 text-center">
                        <p class="text-emerald-400 font-black text-sm uppercase tracking-widest mb-1">🎮 Solo Demo Mode — Two Tab Setup</p>
                        <p class="text-slate-400 text-xs mb-5">Click a team button below. You will be asked to enter that team's invite code before the tab opens.</p>
                        <div class="flex gap-4 justify-center flex-wrap">
                <button onclick="verifyAndOpenTab('red')"
                   class="bg-red-900/40 border-2 border-red-500/70 text-red-400 font-black px-6 py-3 rounded-xl text-sm hover:bg-red-600 hover:text-white transition flex items-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                   <span class="mi">swords</span> Open RED TEAM Tab
                   <span class="text-xs font-normal text-red-300 ml-1">(Enter Red Code First)</span>
                </button>
                <button onclick="verifyAndOpenTab('blue')"
                   class="bg-blue-900/40 border-2 border-blue-500/70 text-blue-400 font-black px-6 py-3 rounded-xl text-sm hover:bg-blue-600 hover:text-white transition flex items-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                   <span class="mi">shield</span> Open BLUE TEAM Tab
                   <span class="text-xs font-normal text-blue-300 ml-1">(Enter Blue Code First)</span>
                </button>
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
                    
                    const redList = document.getElementById('red-team-list');
                    redList.innerHTML = data.members.red.map(u => `<li><span class="text-slate-500">></span> ${u}</li>`).join('');
                    
                    const blueList = document.getElementById('blue-team-list');
                    blueList.innerHTML = data.members.blue.map(u => `<li><span class="text-slate-500">></span> ${u}</li>`).join('');
                }
            } catch(e) { console.error('Polling error', e); }
        }

        // ─── SCENARIO DATA: All attack payloads + defenses ───
        const SCENARIO_DATA = {
            sqli_login: {
                name: 'SQL Injection', icon: '💉', color: 'red',
                description: 'Inject malicious SQL to bypass login authentication',
                payloads: [
                    { label: 'Basic Auth Bypass',      payload: "' OR 1=1 --",                 tip: 'Closes the quote, adds always-true condition' },
                    { label: 'Username Bypass',         payload: "admin' --",                    tip: 'Comments out the password check' },
                    { label: 'Union Select Dump',       payload: "' UNION SELECT null,null,null--", tip: 'Attempts to read extra columns from DB' },
                    { label: 'Boolean Blind',           payload: "' OR 'x'='x",                  tip: 'Blind injection using tautology' },
                    { label: 'Drop Table Payload',      payload: "'; DROP TABLE users--",         tip: 'Destructive payload (simulated)' },
                ],
                defenses: [
                    { label: '🛡 Block SQL Keywords',   rule: "(?i)(union|select|insert|drop|delete|update|or\\s+1=1|\'\\s*--)",  tip: 'Regex blocks common SQLi patterns' },
                    { label: '🛡 Block Quote + Comment', rule: "'.*--",                             tip: 'Blocks payloads using quote+comment bypass' },
                    { label: '🛡 Parameterized Mode',   rule: "(?i)(UNION|SELECT|DROP|'|--)",      tip: 'Broad block of SQL special chars' },
                    { label: '🛡 Block OR Injection',   rule: "(?i)\\bOR\\b.*=",                   tip: 'Targets OR 1=1 style bypasses' },
                ]
            },
            cmd_ping: {
                name: 'Command Injection', icon: '💻', color: 'orange',
                description: 'Inject shell commands into a ping diagnostic tool',
                payloads: [
                    { label: 'Semicolon Injection',     payload: '8.8.8.8; ls -la',          tip: 'Runs second command after ping' },
                    { label: 'Pipe to Shell',           payload: '8.8.8.8 | cat /etc/passwd', tip: 'Pipes ping output to cat' },
                    { label: 'Background Process',      payload: '8.8.8.8 & whoami',          tip: 'Runs whoami in the background' },
                    { label: 'Backtick Exec',           payload: '`id`',                      tip: 'Backtick command substitution' },
                    { label: 'Chained Commands',        payload: '127.0.0.1 && cat /etc/shadow', tip: 'Double-amp chained execution' },
                ],
                defenses: [
                    { label: '🛡 Block Shell Operators', rule: '[;&|`]',                          tip: 'Blocks ; & | ` chars used in injection' },
                    { label: '🛡 Block cmd Keywords',    rule: '(?i)(cat|ls|whoami|id|passwd|shadow)', tip: 'Blocks common recon commands' },
                    { label: '🛡 Input Sanitization',   rule: '[^a-zA-Z0-9.\\-]',               tip: 'Only allow alphanumeric+dot+dash' },
                ]
            },
            xss_search: {
                name: 'Cross-Site Scripting (XSS)', icon: '🕷', color: 'yellow',
                description: 'Inject JavaScript into a product search field',
                payloads: [
