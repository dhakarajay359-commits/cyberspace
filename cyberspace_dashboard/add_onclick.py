with open('templates/compete.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Add onclick to CUSTOM LOBBY
text = text.replace(
    'class="bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold py-3 px-6 rounded-lg mono text-sm border border-slate-700 transition">\n                                    CUSTOM LOBBY',
    'onclick="document.getElementById(\'lobby-modal\').classList.remove(\'hidden\')" class="bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold py-3 px-6 rounded-lg mono text-sm border border-slate-700 transition">\n                                    CUSTOM LOBBY'
)

text = text.replace(
    'class="btn-neon font-bold py-3 px-8 rounded-lg mono text-sm flex items-center gap-2">\n                                    <span class="radar-box !w-4 !h-4 !border"></span> FIND MATCH',
    'onclick="document.getElementById(\'lobby-modal\').classList.remove(\'hidden\')" class="btn-neon font-bold py-3 px-8 rounded-lg mono text-sm flex items-center gap-2">\n                                    <span class="radar-box !w-4 !h-4 !border"></span> FIND MATCH'
)

with open('templates/compete.html', 'w', encoding='utf-8') as f:
    f.write(text)

print('Added onclick handlers to the matchmaking buttons.')
