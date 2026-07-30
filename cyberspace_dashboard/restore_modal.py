with open('static/js/compete.js', 'r', encoding='utf-8') as f:
    text = f.read()

# We need to find demoDiv.innerHTML and append the modal.
# Let's locate the exact spot where we assign demoDiv.innerHTML
start_marker = "demoDiv.innerHTML = `"
end_marker = "</div>\n\n                    \"\"\"" # The one I mistakenly added earlier

start_idx = text.find(start_marker)
if start_idx == -1:
    print("Could not find demoDiv.innerHTML assignment!")
    exit(1)
end_idx = text.find('";', start_idx)
if end_idx == -1:
    end_idx = text.find('"""', start_idx)

if end_idx == -1:
    print("Could not find end of demoDiv.innerHTML assignment!")
    exit(1)

# We will replace from start_idx to the end of the assignment with the proper string
replacement = """demoDiv.innerHTML = `
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
                            <p id="tab-verify-error" class="text-red-400 text-xs mb-4 hidden"> Incorrect code. Try again.</p>
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
"""

# Let's cleanly replace
# We need to find where the `"""` ends
import re
new_text = re.sub(r'demoDiv\.innerHTML = `[\s\S]*?\"\"\"', replacement, text)

with open('static/js/compete.js', 'w', encoding='utf-8') as f:
    f.write(new_text)

print("Successfully restored the modal HTML to compete.js")
