import sys
import re

try:
    with open('templates/compete.html', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add Blue Victory Overlay HTML right before red-victory-overlay or just before <script>
    blue_victory_html = """
    <!-- Blue Victory Overlay -->
    <div id="blue-victory-overlay" class="fixed inset-0 z-[200] hidden bg-black/90 backdrop-blur-md flex flex-col items-center justify-center transition-all duration-500 opacity-0 pointer-events-none">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1)_0%,transparent_70%)]"></div>
        <div class="relative text-center p-12 border border-blue-500/30 rounded-2xl bg-slate-900/50 shadow-[0_0_50px_rgba(59,130,246,0.2)] max-w-2xl w-full mx-4">
            <div class="w-24 h-24 mx-auto mb-6 text-blue-500 flex items-center justify-center animate-pulse">
                <span class="mi mi-fill" style="font-size: 96px;">verified_user</span>
            </div>
            <h2 class="text-4xl font-black text-white mb-2 uppercase tracking-[0.2em] text-blue-400">Target Secured</h2>
            <p class="text-slate-400 mb-8 font-mono">All adversarial payloads neutralized. WAF Integrity: 100%</p>
            <div class="flex gap-4 justify-center">
                <button onclick="closeBlueVictory()" class="bg-slate-800 hover:bg-slate-700 text-white px-8 py-3 rounded uppercase font-bold tracking-widest text-sm transition border border-slate-700">Dismiss</button>
                <a href="/dashboard" class="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded uppercase font-bold tracking-widest text-sm transition shadow-[0_0_15px_rgba(59,130,246,0.5)]">Return to HQ</a>
            </div>
        </div>
    </div>
"""
    
    # Insert it right before red-victory-overlay
    if '<!-- Victory Overlay -->' in content:
        content = content.replace('<!-- Victory Overlay -->', blue_victory_html + '\n    <!-- Victory Overlay -->')
    else:
        # fallback
        content = content.replace('</body>', blue_victory_html + '\n</body>')

    # 2. Add triggerBlueVictory and closeBlueVictory JS
    js_funcs = """
        function triggerBlueVictory() {
            const overlay = document.getElementById('blue-victory-overlay');
            if (overlay) {
                overlay.classList.remove('hidden');
                setTimeout(() => {
                    overlay.classList.remove('opacity-0', 'pointer-events-none');
                }, 50);
            }
        }
        function closeBlueVictory() {
            const overlay = document.getElementById('blue-victory-overlay');
            if (overlay) {
                overlay.classList.add('opacity-0', 'pointer-events-none');
                setTimeout(() => overlay.classList.add('hidden'), 500);
            }
        }
"""
    
    # insert before function startMatch()
    if 'function startMatch() {' in content:
        content = content.replace('function startMatch() {', js_funcs + '\n        function startMatch() {')

    with open('templates/compete.html', 'w', encoding='utf-8') as f:
        f.write(content)
        
    print("Blue Victory Added!")

except Exception as e:
    print("Error:", e)
