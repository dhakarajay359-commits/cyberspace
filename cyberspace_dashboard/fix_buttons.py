with open('static/js/compete.js', 'r', encoding='utf-8') as f:
    text = f.read()

start_marker = "const demoDiv = document.getElementById('solo-demo-links');"
end_marker = "<!-- Team Code Verification Modal -->"

start_idx = text.find(start_marker)
end_idx = text.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print("Could not find markers!")
    exit(1)

# We will replace the static buttons with dynamically generated buttons
replacement = """const demoDiv = document.getElementById('solo-demo-links');
            if (demoDiv) {
                let buttonsHtml = '';
                if (isHost || myTeam === 'red') {
                    buttonsHtml += `
                    <button onclick="verifyAndOpenTab('red')"
                       class="bg-red-900/40 border-2 border-red-500/70 text-red-400 font-black px-6 py-3 rounded-xl text-sm hover:bg-red-600 hover:text-white transition flex items-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                       <span class="mi">swords</span> Open RED TEAM Tab
                       <span class="text-xs font-normal text-red-300 ml-1">(Enter Red Code First)</span>
                    </button>`;
                }
                if (isHost || myTeam === 'blue') {
                    buttonsHtml += `
                    <button onclick="verifyAndOpenTab('blue')"
                       class="bg-blue-900/40 border-2 border-blue-500/70 text-blue-400 font-black px-6 py-3 rounded-xl text-sm hover:bg-blue-600 hover:text-white transition flex items-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                       <span class="mi">shield</span> Open BLUE TEAM Tab
                       <span class="text-xs font-normal text-blue-300 ml-1">(Enter Blue Code First)</span>
                    </button>`;
                }

                demoDiv.innerHTML = `
                    <div class="bg-slate-900/80 border border-slate-700 rounded-xl p-6 mt-6 text-center">
                        <p class="text-emerald-400 font-black text-sm uppercase tracking-widest mb-1"> Solo Demo Mode  Two Tab Setup</p>
                        <p class="text-slate-400 text-xs mb-5">Click a team button below. You will be asked to enter that team's invite code before the tab opens.</p>
                        <div class="flex gap-4 justify-center flex-wrap">
                            ${buttonsHtml}
                        </div>
                    </div>

                    """

with open('static/js/compete.js', 'w', encoding='utf-8') as f:
    f.write(text[:start_idx] + replacement + text[end_idx:])

print("Successfully updated the demoDiv buttons logic in compete.js")
