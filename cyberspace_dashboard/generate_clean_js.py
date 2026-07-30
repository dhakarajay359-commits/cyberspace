import re
with open('true_original_compete.html', 'r', encoding='utf-8') as f:
    text = f.read()

start_script = text.find('<script>') + 8
end_script = text.rfind('</script>')
js = text[start_script:end_script].strip()

# 1. Clean up Jinja templates (we don't need them in external JS anyway)
js = js.replace('{{', '/*').replace('}}', '*/').replace('{%', '/*').replace('%}', '*/')

# 2. Find the corrupted demoDiv block
corrupted_start = js.find("demoDiv.innerHTML = `")
if corrupted_start != -1:
    # Find where the corruption ends. The corruption copied `await fetch('/api/lobby/start', {` 
    # all the way down to `})();`
    # Let's find the `})();` that belongs to the corrupted autoJoinFromUrl
    corrupted_end = js.find('})();', corrupted_start) + 5
    
    correct_demo_div = """demoDiv.innerHTML = `
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
"""
    
    js = js[:corrupted_start] + correct_demo_div + js[corrupted_end:]

# 3. Add the missing try/catch closure to autoJoinFromUrl
# The original autoJoinFromUrl ends right before the first function showWaitingRoom.
idx = js.find("function showWaitingRoom")
if idx != -1:
    js = js[:idx] + "} catch(e) { console.error('Demo auto-join error', e); }\n})();\n\n" + js[idx:]

with open('static/js/compete.js', 'w', encoding='utf-8') as f:
    f.write(js)
    
print("Clean JS written to static/js/compete.js")
