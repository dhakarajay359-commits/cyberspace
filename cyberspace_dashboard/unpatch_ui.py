import sys

try:
    with open('templates/compete.html', 'r', encoding='utf-8') as f:
        content = f.read()

    # Reverse UI Patch
    content = content.replace('background-color: #020617;', 'background-color: #050a0f;')
    content = content.replace('background: radial-gradient(circle at center, transparent 0%, #020617 80%);', 'background: radial-gradient(circle at center, transparent 0%, #050a0f 80%);')
    content = content.replace('bg-[#020617]', 'bg-[#03060a]')
    
    # RE-ADD Matrix Canvas right after body (if not already there)
    if '<canvas id="matrix-bg"></canvas>' not in content:
        content = content.replace('<body class="relative">', '<body class="relative">\n    <canvas id="matrix-bg"></canvas>')
    
    # Restore Header
    content = content.replace('<h1 class="text-[#f8fafc] font-[800] text-[2.25rem] uppercase tracking-[2px]">Adversarial Simulation Environment</h1>', '<h1 class="glitch-text mono" data-text="GLOBAL BATTLEGROUND">GLOBAL BATTLEGROUND</h1>')
    content = content.replace('<p class="text-indigo-400/80 mono text-xs mt-2 uppercase tracking-[0.3em]">Research Simulation & Defensive Strategy Training</p>', '<p class="text-emerald-400/80 mono text-xs mt-2 uppercase tracking-[0.3em]">Hacker Ranking & Live CTF Matchmaking</p>')
    
    # Restore Target Preview Breach
    content = content.replace('<span class="mi mi-fill" style="font-size:72px;">warning</span>', '💀')
    content = content.replace('CRITICAL INCIDENT', 'YOU HAVE BEEN HACKED')
    content = content.replace('Unauthorized Root Access Detected.<br>', 'THIS WEBSITE HAS BEEN COMPROMISED.<br>')
    content = content.replace('Simulated infrastructure has been compromised.<br>', 'ALL DATA HAS BEEN ENCRYPTED AND EXFILTRATED.<br>')
    content = content.replace('Data integrity failure.', 'YOUR SYSTEM IS UNDER ATTACKER CONTROL.')
    content = content.replace('CVE-SIM-1337', '0xDEAD-BEEF-CAFE')
    content = content.replace('INCIDENT ID', 'BREACH ID')
    content = content.replace('Adversarial Simulation Environment // Red Team Success', 'cyberspace defsoc // red team breached your perimeter')

    # Restore Breach Overlay
    content = content.replace('<span class="mi" style="font-size:80px;color:#ef4444;font-variation-settings:\'FILL\' 1,\'wght\' 400,\'GRAD\' 0,\'opsz\' 48">warning</span>', '<span class="mi" style="font-size:80px;color:#ef4444;font-variation-settings:\'FILL\' 1,\'wght\' 400,\'GRAD\' 0,\'opsz\' 48">dangerous</span>')
    content = content.replace('CRITICAL INCIDENT DETECTED', '<span class="mi text-red-500">warning</span> SECURITY BREACH DETECTED <span class="mi text-red-500">warning</span>')
    content = content.replace('Unauthorized Access Confirmed', 'Your Website Has Been Hacked')
    content = content.replace('[ALERT] The adversarial simulation has successfully bypassed mitigations.', '[CRITICAL] An attacker has successfully exploited a vulnerability in your system.')
    content = content.replace('WAF Bypass & Code Execution', 'SQL Injection / Remote Code Execution')
    content = content.replace('INFRASTRUCTURE COMPROMISED', 'ROOT ACCESS GRANTED TO ATTACKER')
    content = content.replace('Integrity violation confirmed', 'Encrypted &amp; Exfiltrated')
    content = content.replace('WAF evaluation failed. Review the simulation logs and formulate stronger regex defenses.', 'Your defenses failed. Deploy emergency patches and review your WAF rules to prevent future breaches.')

    # Re-add Matrix Javascript
    matrix_js = """
        // Matrix Rain Background
        const canvas = document.getElementById('matrix-bg');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            const letters = '01ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const fontSize = 14;
            const columns = canvas.width / fontSize;
            const drops = Array.from({length: columns}).fill(1);
            setInterval(() => {
                ctx.fillStyle = 'rgba(5, 10, 15, 0.1)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = '#0f0';
                ctx.font = fontSize + 'px monospace';
                drops.forEach((y, i) => {
                    const text = letters[Math.floor(Math.random() * letters.length)];
                    ctx.fillText(text, i * fontSize, y * fontSize);
                    if (y * fontSize > canvas.height && Math.random() > 0.95) drops[i] = 0;
                    drops[i]++;
                });
            }, 50);
        }
    """
    
    if '// UI Initialized' in content:
        content = content.replace('// UI Initialized', matrix_js)

    with open('templates/compete.html', 'w', encoding='utf-8') as f:
        f.write(content)
    print("UI RESTORED!")

except Exception as e:
    print("Error:", e)
