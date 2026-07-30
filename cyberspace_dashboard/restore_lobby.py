with open('static/js/compete.js', 'r', encoding='utf-8') as f:
    text = f.read()

# We need to insert createLobby and joinLobby into compete.js
# Let's find a good place. Just before showError seems reasonable.

funcs = """
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

"""

idx = text.find('function showError(msg)')
if idx == -1:
    print("Could not find showError to insert before")
    exit(1)

new_text = text[:idx] + funcs + text[idx:]

with open('static/js/compete.js', 'w', encoding='utf-8') as f:
    f.write(new_text)

print("Successfully restored createLobby and joinLobby to compete.js")
