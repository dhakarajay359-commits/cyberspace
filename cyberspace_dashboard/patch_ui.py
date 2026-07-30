import sys
import re

try:
    with open('templates/compete.html', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. CSS Background and Glitch
    content = content.replace('background-color: #050a0f;', 'background-color: #020617;')
    content = content.replace('background: radial-gradient(circle at center, transparent 0%, #050a0f 80%);', 'background: radial-gradient(circle at center, transparent 0%, #020617 80%);')
    content = content.replace('bg-[#03060a]', 'bg-[#020617]')
    
    # Remove Matrix Canvas
    content = content.replace('<canvas id="matrix-bg"></canvas>', '')
    
    # Update Header
    content = content.replace('<h1 class="glitch-text mono" data-text="GLOBAL BATTLEGROUND">GLOBAL BATTLEGROUND</h1>', '<h1 class="text-[#f8fafc] font-[800] text-[2.25rem] uppercase tracking-[2px]">Adversarial Simulation Environment</h1>')
    content = content.replace('<p class="text-emerald-400/80 mono text-xs mt-2 uppercase tracking-[0.3em]">Hacker Ranking & Live CTF Matchmaking</p>', '<p class="text-indigo-400/80 mono text-xs mt-2 uppercase tracking-[0.3em]">Research Simulation & Defensive Strategy Training</p>')
    
    # 2. Matrix Javascript
    if 'const canvas = document.getElementById(\'matrix-bg\');' in content:
        # Regex to remove the matrix script block
        content = re.sub(r'// Matrix Rain Background.*?if \(canvas\) \{.*?\n        \}', '// UI Initialized', content, flags=re.DOTALL)

    # 3. Target Preview Breach
    content = content.replace('💀', '<span class="mi mi-fill" style="font-size:72px;">warning</span>')
    content = content.replace('YOU HAVE BEEN HACKED', 'CRITICAL INCIDENT')
    content = content.replace('THIS WEBSITE HAS BEEN COMPROMISED.<br>', 'Unauthorized Root Access Detected.<br>')
    content = content.replace('ALL DATA HAS BEEN ENCRYPTED AND EXFILTRATED.<br>', 'Simulated infrastructure has been compromised.<br>')
    content = content.replace('YOUR SYSTEM IS UNDER ATTACKER CONTROL.', 'Data integrity failure.')
    content = content.replace('0xDEAD-BEEF-CAFE', 'CVE-SIM-1337')
    content = content.replace('BREACH ID', 'INCIDENT ID')
    content = content.replace('cyberspace defsoc // red team breached your perimeter', 'Adversarial Simulation Environment // Red Team Success')

    # 4. Breach Overlay
    content = content.replace('<span class="mi" style="font-size:80px;color:#ef4444;font-variation-settings:\'FILL\' 1,\'wght\' 400,\'GRAD\' 0,\'opsz\' 48">dangerous</span>', '<span class="mi" style="font-size:80px;color:#ef4444;font-variation-settings:\'FILL\' 1,\'wght\' 400,\'GRAD\' 0,\'opsz\' 48">warning</span>')
    content = content.replace('<span class="mi text-red-500">warning</span> SECURITY BREACH DETECTED <span class="mi text-red-500">warning</span>', 'CRITICAL INCIDENT DETECTED')
    content = content.replace('Your Website Has Been Hacked', 'Unauthorized Access Confirmed')
    content = content.replace('[CRITICAL] An attacker has successfully exploited a vulnerability in your system.', '[ALERT] The adversarial simulation has successfully bypassed mitigations.')
    content = content.replace('SQL Injection / Remote Code Execution', 'WAF Bypass & Code Execution')
    content = content.replace('ROOT ACCESS GRANTED TO ATTACKER', 'INFRASTRUCTURE COMPROMISED')
    content = content.replace('Encrypted &amp; Exfiltrated', 'Integrity violation confirmed')
    content = content.replace('Your defenses failed. Deploy emergency patches and review your WAF rules to prevent future breaches.', 'WAF evaluation failed. Review the simulation logs and formulate stronger regex defenses.')

    with open('templates/compete.html', 'w', encoding='utf-8') as f:
        f.write(content)
    print("UI Updated Successfully")
except Exception as e:
    print("Error:", e)
