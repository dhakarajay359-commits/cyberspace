import sys

try:
    with open('templates/compete.html', 'r', encoding='utf-8') as f:
        content = f.read()

    start_str = "(async function autoJoinFromUrl() {"
    end_str = "        })();"

    start_idx = content.find(start_str)
    if start_idx == -1:
        print("Could not find start of autoJoinFromUrl")
        sys.exit(1)
        
    end_idx = content.find(end_str, start_idx) + len(end_str)
    if end_idx == -1 + len(end_str):
        print("Could not find end of autoJoinFromUrl")
        sys.exit(1)

    clean_js = """(async function autoJoinFromUrl() {
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
                if (statusData.custom_desc) window.customDesc = statusData.custom_desc;

                // Step 4: Load the game UI
                document.getElementById('lobby-modal').classList.add('hidden');
                await startMatch();

            } catch(e) {
                console.error('Demo auto-join error', e);
            }
        })();"""

    content = content[:start_idx] + clean_js + content[end_idx:]

    with open('templates/compete.html', 'w', encoding='utf-8') as f:
        f.write(content)
        
    print("Fixed corrupted autoJoinFromUrl block!")

except Exception as e:
    print("Error:", e)
