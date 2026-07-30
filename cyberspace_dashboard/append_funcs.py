import os

with open('static/js/compete.js', 'a', encoding='utf-8') as f:
    f.write('''
// --- NEW DEFENSIVE TOOLS & INTEL ---

async function analyzeTraffic() {
    if (!currentLobbyId) return;
    const analyzerModal = document.getElementById('traffic-analyzer-modal');
    const content = document.getElementById('traffic-analyzer-content');
    
    analyzerModal.classList.remove('hidden');
    content.innerHTML = '<span class="text-blue-500 animate-pulse">Initiating packet decryption...</span>';
    
    try {
        const res = await fetch('/api/game/investigate', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ lobby_id: currentLobbyId })
        });
        const data = await res.json();
        
        if (data.success) {
            content.innerHTML = '';
            if (data.payloads.length === 0) {
                content.innerHTML = '<span class="text-slate-500">No anomalous traffic recorded yet.</span>';
                return;
            }
            
            data.payloads.forEach(p => {
                const color = p.blocked ? 'text-red-500' : 'text-blue-400';
                const status = p.blocked ? '[BLOCKED]' : '[DECRYPTED]';
                // Escape HTML from payload to prevent XSS in analyzer
                const safePayload = String(p.payload).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
                content.innerHTML += `<div class="${color} mb-2">[${p.timestamp}] ${status} Payload Signature:<br><span class="text-slate-300">${safePayload}</span></div>`;
            });
            content.scrollTop = content.scrollHeight;
        } else {
            content.innerHTML = `<span class="text-red-500">Error: ${data.error}</span>`;
        }
    } catch(e) {
        content.innerHTML = `<span class="text-red-500">Analyzer failed to connect to matrix.</span>`;
    }
}

function showThreatIntel() {
    const modal = document.getElementById('threat-intel-modal');
    const content = document.getElementById('threat-intel-content');
    
    let html = '';
    
    switch (window.currentScenario) {
        case 'sqli_login':
            html = `
                <h3 class="text-emerald-400 font-bold mb-2">[INTEL] SQL Injection (Authentication Bypass)</h3>
                <p>The target server is running a legacy authentication module that directly concatenates user input into a SQL query.</p>
                <p class="mt-2"><strong>Red Team Objective:</strong> Inject SQL syntax (e.g., <code>' OR 1=1 --</code>) to manipulate the logic and bypass authentication.</p>
                <p class="mt-2"><strong>Blue Team Objective:</strong> Deploy a WAF rule (Regex) to intercept common SQLi signatures before they reach the database.</p>
            `;
            break;
        case 'cmd_injection':
            html = `
                <h3 class="text-emerald-400 font-bold mb-2">[INTEL] Command Injection (RCE)</h3>
                <p>An administrative ping utility on the target server passes user input directly to the system shell.</p>
                <p class="mt-2"><strong>Red Team Objective:</strong> Use command separators (e.g., <code>;</code>, <code>&&</code>, <code>|</code>) to execute arbitrary system commands.</p>
                <p class="mt-2"><strong>Blue Team Objective:</strong> Deploy a WAF rule to block shell metacharacters and command chaining operators.</p>
            `;
            break;
        case 'xss_search':
            html = `
                <h3 class="text-emerald-400 font-bold mb-2">[INTEL] Cross-Site Scripting (XSS)</h3>
                <p>The target web application reflects user search input directly into the HTML without sanitization.</p>
                <p class="mt-2"><strong>Red Team Objective:</strong> Inject malicious JavaScript (e.g., <code>&lt;script&gt;</code>) to hijack simulated user sessions.</p>
                <p class="mt-2"><strong>Blue Team Objective:</strong> Deploy a WAF rule to block script tags and common XSS event handlers.</p>
            `;
            break;
        case 'custom_ctf':
            html = `
                <h3 class="text-emerald-400 font-bold mb-2">[INTEL] Custom Threat Scenario</h3>
                <p>${window.customDesc || 'A classified target with an unknown vulnerability profile.'}</p>
                <p class="mt-2"><strong>Red Team Objective:</strong> Discover and exploit the specific vulnerability in the custom scenario.</p>
                <p class="mt-2"><strong>Blue Team Objective:</strong> Monitor traffic logs carefully and deploy WAF rules to block the anomalous patterns.</p>
            `;
            break;
        default:
            html = `
                <h3 class="text-emerald-400 font-bold mb-2">[INTEL] Classified Target</h3>
                <p>Insufficient intel available for this target. Proceed with caution.</p>
            `;
    }
    
    content.innerHTML = html;
    modal.classList.remove('hidden');
}
''')
