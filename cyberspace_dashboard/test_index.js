
    // ── TAB/CHIP SYSTEM ──────────────────────────────────────────────────────
    const CHIP_COLORS = {
        dast:'chip-active', sast:'chip-active-cyan', infra:'chip-active-cyan',
        secrets:'chip-active-red', dns:'chip-active-cyan', waf:'chip-active-amber',
        sri:'chip-active', cors:'chip-active-purple', subdomain:'chip-active-purple',
        ssl:'chip-active', ai:'chip-active-red', domxss:'chip-active-amber',
        asvs:'chip-active', smuggling:'chip-active-purple', typosquat:'chip-active-purple',
        redirect:'chip-active-amber', localstorage:'chip-active-cyan', iac:'chip-active-cyan',
        hook:'chip-active', sectxt:'chip-active-cyan'
    };

    document.querySelectorAll('.tab').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            document.querySelectorAll('.tab').forEach(b => { b.className = 'tab chip-inactive text-xs font-bold px-3 py-1.5 rounded-full transition-all duration-200'; });
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.add('hidden'));
            btn.className = `tab ${CHIP_COLORS[tab]||'chip-active'} text-xs font-bold px-3 py-1.5 rounded-full transition-all duration-200`;
            document.getElementById('pane-' + tab)?.classList.remove('hidden');
        });
    });

    // ── HELPERS ──────────────────────────────────────────────────────────────
    const rc = () => document.getElementById('results-container');
    const term = document.getElementById('terminal-feed');
    const pulse = document.getElementById('terminal-pulse');
    const status = document.getElementById('status-msg');

    function termLog(txt) { term.textContent += txt + '\n'; term.scrollTop = term.scrollHeight; }
    function setLoading(msg = 'Running scan...') { status.textContent = '⟳ ' + msg; status.classList.remove('hidden'); pulse.classList.remove('hidden'); }
    function clearLoading() { status.classList.add('hidden'); pulse.classList.add('hidden'); }

    function card(color, label, title, body) {
        return `<div class="finding-card bg-slate-950 border-l-4 border-${color}-500 p-4 rounded-r-lg mb-3">
            <span class="text-xs bg-${color}-500/10 text-${color}-400 px-2 py-0.5 rounded font-bold mono">${label}</span>
            <p class="text-sm mt-2 font-semibold">${title}</p>
            <p class="text-xs text-slate-400 mt-1">${body}</p>
        </div>`;
    }

    function codeBlock(title, code) {
        return `<div class="mt-4 p-4 bg-black rounded-lg border border-slate-800">
            <div class="flex justify-between items-center mb-2">
                <h4 class="text-emerald-400 text-xs font-bold uppercase">${title}</h4>
                <button onclick="navigator.clipboard.writeText(this.parentElement.nextElementSibling.textContent)" class="text-[10px] text-slate-400 hover:text-slate-200">Copy</button>
            </div>
            <pre class="text-[10px] text-slate-300 mono overflow-x-auto">${code}</pre>
        </div>`;
    }

    async function post(endpoint, payload) {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
        return res.json();
    }

    // ── PASSIVE QUICK AUDITORS ────────────────────────────────────────────

    // ── NESSUS ENGINE ────────────────────────────────────────────────────────
    document.getElementById('btn-nessus-start').addEventListener('click', async () => {
        const target = document.getElementById('nessus-target').value;
        if(!target) return;
        
        const btn = document.getElementById('btn-nessus-start');
        btn.disabled = true;
        btn.classList.add('opacity-50');
        document.getElementById('nessus-engine-status').textContent = 'ENGINE ACTIVE';
        document.getElementById('nessus-engine-status').classList.replace('text-slate-400', 'text-emerald-400');
        document.getElementById('nessus-engine-pulse').classList.replace('bg-slate-500', 'bg-emerald-500');
        document.getElementById('nessus-engine-pulse').classList.add('animate-ping');
        
        const statusText = document.getElementById('nessus-status-text');
        document.getElementById('nessus-report-container').classList.add('hidden');
        
        // Start animation lifecycle
        const stages = ['Scoping', 'Info Gathering', 'Scanning', 'False Positives', 'Exploit (Sim)', 'Reporting'];
        
        for(let i=1; i<=6; i++) {
            document.querySelectorAll('.nessus-node').forEach(n => {
                n.classList.remove('active-node', 'completed-node');
                const id = parseInt(n.id.replace('node-', ''));
                if(id < i) n.classList.add('completed-node');
                if(id === i) n.classList.add('active-node');
            });
            document.getElementById('nessus-progress-line').style.width = ((i-1) * 20) + '%';
            statusText.textContent = `[+] Initiating Phase ${i}: ${stages[i-1]}...`;
            
            // Wait 800ms between fake phases to simulate the lifecycle visually
            if(i < 6) await new Promise(r => setTimeout(r, 800));
        }
        
        // Actually call the API
        const data = await post('/api/scan/nessus', {target});
        if(data.error) { statusText.textContent = '[!] ' + data.error; return; }
        
        // Poll for completion
        const poll = setInterval(async () => {
            const taskData = await (await fetch('/api/scan/' + data.task_id)).json();
            if(taskData.status === 'completed') {
                clearInterval(poll);
                renderNessusReport(taskData.results.report, target);
                
                document.getElementById('nessus-engine-status').textContent = 'ENGINE IDLE';
                document.getElementById('nessus-engine-status').classList.replace('text-emerald-400', 'text-slate-400');
                document.getElementById('nessus-engine-pulse').classList.replace('bg-emerald-500', 'bg-slate-500');
                document.getElementById('nessus-engine-pulse').classList.remove('animate-ping');
                btn.disabled = false;
                btn.classList.remove('opacity-50');
            } else if(taskData.status === 'error') {
                clearInterval(poll);
                statusText.textContent = '[!] Error: ' + taskData.message;
            }
        }, 1000);
    });

    function renderNessusReport(report, target) {
        document.getElementById('nessus-report-container').classList.remove('hidden');
        document.getElementById('btn-nessus-export').classList.remove('hidden');
        
        document.getElementById('report-target').textContent = target;
        document.getElementById('report-date').textContent = new Date().toLocaleString();
        document.getElementById('report-score').textContent = report.score;
        
        document.getElementById('count-critical').textContent = report.severity_counts.critical;
        document.getElementById('count-high').textContent = report.severity_counts.high;
        document.getElementById('count-medium').textContent = report.severity_counts.medium;
        document.getElementById('count-low').textContent = report.severity_counts.low;
        document.getElementById('count-info').textContent = report.severity_counts.info;
        
        const list = document.getElementById('report-vulns-list');
        list.innerHTML = '';
        
        const colors = {
            'critical': 'border-red-600 bg-red-50 text-red-900',
            'high': 'border-orange-500 bg-orange-50 text-orange-900',
            'medium': 'border-amber-400 bg-amber-50 text-amber-900',
            'low': 'border-green-500 bg-green-50 text-green-900',
            'info': 'border-blue-500 bg-blue-50 text-blue-900'
        };
        
        report.vulnerabilities.forEach(v => {
            list.insertAdjacentHTML('beforeend', `
                <div class="border-l-4 p-4 rounded bg-white shadow-sm ${colors[v.severity]} border">
                    <div class="flex justify-between items-start mb-2">
                        <h3 class="font-bold text-lg">${v.id}: ${v.name}</h3>
                        <span class="px-2 py-1 rounded text-xs font-bold uppercase border border-current opacity-80">CVSS: ${v.cvss}</span>
                    </div>
                    <p class="text-sm font-bold opacity-75 mb-2">Service: ${v.service} (Port ${v.port})</p>
                    <p class="text-sm mb-3">${v.description}</p>
                    
                    <div class="bg-slate-900 text-emerald-300 p-3 rounded mt-2 premium-gate">
                        <p class="font-bold text-xs text-slate-400 uppercase mb-1">Recommended Fix / Remediation</p>
                        <p class="text-sm premium-blur">${v.remediation}</p>
                        <div class="lock-overlay"><button onclick="openPricingModal()" class="bg-emerald-600 text-white text-xs font-bold px-4 py-1.5 rounded-full hover:bg-emerald-500 transition shadow-[0_0_10px_rgba(16,185,129,0.5)]">🔓 Unlock Fix</button></div>
                    </div>
                </div>
            `);
        });
        
        document.getElementById('nessus-progress-line').style.width = '100%';
        document.getElementById('nessus-status-text').textContent = '[✓] Report generation complete.';
    }

    document.getElementById('audit-btn').addEventListener('click', async () => {
        const target = document.getElementById('audit-target').value;
        if(!target) return;
        const data = await post('/api/audit/headers', {target});
        const panel = document.getElementById('audit-results');
        panel.classList.remove('hidden');
        if(data.error) { document.getElementById('audit-details').textContent = data.error; return; }
        const colorMap = {'A+':'text-emerald-400', 'A':'text-emerald-400', 'B':'text-yellow-400', 'C':'text-orange-400', 'D':'text-red-400', 'F':'text-red-600'};
        document.getElementById('audit-details').textContent = data.missing?.length ? 'Missing: ' + data.missing.join(', ') : 'All headers present!';
        document.getElementById('audit-badge').textContent = data.grade;
        document.getElementById('audit-badge').className = 'text-2xl font-black ' + (colorMap[data.grade] || 'text-red-400');
    });

    document.getElementById('csp-btn').addEventListener('click', async () => {
        const target = document.getElementById('csp-target').value;
        if(!target) return;
        const data = await post('/api/audit/csp', {target});
        const panel = document.getElementById('csp-results');
        panel.classList.remove('hidden');
        if(data.error) { panel.innerHTML = `<p class="text-red-400">${data.error}</p>`; return; }
        const gradeColor = data.grade === 'A' ? 'text-emerald-400' : data.grade === 'C' ? 'text-yellow-400' : 'text-red-400';
        panel.innerHTML = `<p>Grade: <span class="font-black ${gradeColor}">${data.grade}</span></p>` +
            (data.issues||[]).map(i => `<p class="text-orange-400">⚠ ${i}</p>`).join('') +
            (data.csp_present ? '' : `<p class="text-red-400">No CSP header found.</p>`);
    });

    document.getElementById('cookie-btn').addEventListener('click', async () => {
        const target = document.getElementById('cookie-target').value;
        if(!target) return;
        const data = await post('/api/audit/cookies', {target});
        const panel = document.getElementById('cookie-results');
        panel.classList.remove('hidden');
        if(data.error) { panel.innerHTML = `<p class="text-red-400">${data.error}</p>`; return; }
        if(!data.findings || data.findings.length === 0) {
            panel.innerHTML = `<p class="text-emerald-400">✓ ${data.cookies_found} cookie(s) found — all flags present!</p>`;
        } else {
            panel.innerHTML = data.findings.map(f =>
                `<div><p class="text-yellow-400 font-bold">${f.name}</p>${f.issues.map(i => `<p class="text-red-400">⚠ ${i}</p>`).join('')}</div>`
            ).join('');
        }
    });

    // ── DEEP SCANNER BUTTONS ──────────────────────────────────────────────

    // DAST
    document.getElementById('btn-dast').addEventListener('click', async () => {
        const target = document.getElementById('target-url').value;
        if(!target) return;
        setLoading('Nmap scanning — streaming output...');
        term.textContent = `[+] Starting DAST scan against ${target}\n`;
        const data = await post('/api/scan', {target, depth: document.getElementById('scan-depth').value});
        if(data.error) { termLog('[!] ' + data.error); clearLoading(); return; }
        const src = new EventSource('/api/stream/' + data.task_id);
        src.onmessage = e => termLog(e.data);
        src.addEventListener('end', async () => {
            src.close(); clearLoading();
            const final = await (await fetch('/api/scan/' + data.task_id)).json();
            if(final.results) renderHostResults(final.results);
        });
    });

    // SAST
    document.getElementById('btn-sast').addEventListener('click', async () => {
        const target = document.getElementById('target-path').value;
        if(!target) return;
        setLoading('Running Bandit & pip-audit...');
        term.textContent = '[+] Starting Code audit...\n';
        const data = await post('/api/scan/code', {target});
        if(data.error) { termLog('[!] ' + data.error); clearLoading(); return; }
        const src = new EventSource('/api/stream/' + data.task_id);
        src.onmessage = e => termLog(e.data);
        src.addEventListener('end', async () => {
            src.close(); clearLoading();
            const final = await (await fetch('/api/scan/' + data.task_id)).json();
            if(final.results?.sast?.results) renderSastResults(final.results.sast.results);
        });
    });

    // INFRA
    document.getElementById('btn-infra').addEventListener('click', async () => {
        const content = document.getElementById('infra-content').value;
        if(!content) return;
        setLoading('Linting Dockerfile...');
        const data = await post('/api/audit/infra', {content});
        clearLoading();
        rc().innerHTML = '';
        if(!data.findings?.length) { rc().innerHTML = '<p class="text-emerald-400">✓ No issues found.</p>'; return; }
        data.findings.forEach(f => rc().insertAdjacentHTML('beforeend', card('red', `INFRA: ${f.severity}`, f.issue, f.recommendation)));
        rc().insertAdjacentHTML('beforeend', codeBlock('SECURE VERSION', escHtml(data.fixed_content)));
    });

    // SECRETS
    document.getElementById('btn-secrets').addEventListener('click', async () => {
        const content = document.getElementById('secrets-content').value;
        if(!content) return;
        setLoading('Scanning for secrets...');
        const data = await post('/api/audit/secrets', {content});
        clearLoading();
        rc().innerHTML = '';
        if(!data.findings?.length) { rc().innerHTML = '<p class="text-emerald-400">✓ No secrets found.</p>'; return; }
        data.findings.forEach(f => rc().insertAdjacentHTML('beforeend', card('rose', `SECRET: ${f.type}`, f.issue, 'Line ' + f.line + ' — Use env vars or a Secret Manager.')));
        rc().insertAdjacentHTML('beforeend', codeBlock('MASKED VERSION', escHtml(data.masked_content)));
    });

    // DNS
    document.getElementById('btn-dns').addEventListener('click', async () => {
        const domain = document.getElementById('dns-domain').value;
        if(!domain) return;
        setLoading('Querying DNS...');
        const data = await post('/api/dns-audit', {domain});
        clearLoading();
        rc().innerHTML = '';
        const spfColor = data.spf?.found ? (data.spf.status.includes('Strong') ? 'emerald' : 'yellow') : 'red';
        const dmaColor = data.dmarc?.found ? (data.dmarc.status === 'Strong' ? 'emerald' : 'yellow') : 'red';
        rc().innerHTML = card(spfColor, 'SPF: ' + (data.spf?.status || 'Missing'), data.spf?.record || 'Not found', data.spf?.explanation || '')
            + card(dmaColor, 'DMARC: ' + (data.dmarc?.status || 'Missing'), data.dmarc?.record || 'Not found', data.dmarc?.explanation || '');
    });

    // WAF
    document.getElementById('btn-waf').addEventListener('click', async () => {
        const target = document.getElementById('waf-target').value;
        if(!target) return;
        setLoading('Probing WAF & rate limiter...');
        term.textContent = '[+] Sending 15 rapid requests...\n';
        const data = await post('/api/audit/waf', {target});
        clearLoading(); termLog(JSON.stringify(data, null, 2));
        rc().innerHTML = '';
        const rlColor = data.rate_limit_detected ? 'emerald' : 'red';
        const wafColor = data.waf_detected ? 'emerald' : 'yellow';
        rc().innerHTML = card(rlColor, 'Rate Limiting', data.rate_limit_detected ? 'Detected ✓' : 'Not detected!', data.rate_limit_indicators?.join(' | ') || '')
            + card(wafColor, 'WAF', data.waf_detected ? 'Detected ✓' : 'No WAF found', data.waf_indicators?.join(' | ') || '');
        if(data.fix?.rate_limit) rc().insertAdjacentHTML('beforeend', codeBlock('Nginx Rate-Limit Fix', escHtml(data.fix.rate_limit.nginx)));
    });

    // SRI
    document.getElementById('btn-sri').addEventListener('click', async () => {
        const target = document.getElementById('sri-target').value;
        if(!target) return;
        setLoading('Fetching HTML and computing SRI hashes...');
        const data = await post('/api/audit/sri', {target});
        clearLoading();
        rc().innerHTML = '';
        if(!data.findings?.length) { rc().innerHTML = '<p class="text-emerald-400">✓ All scripts have integrity hashes.</p>'; return; }
        data.findings.forEach(f => {
            rc().insertAdjacentHTML('beforeend', card('amber', 'SRI MISSING', f.src, f.issue));
            if(f.fix && f.fix !== 'Add integrity hash manually.') rc().insertAdjacentHTML('beforeend', codeBlock('Secure Script Tag', escHtml(f.fix)));
        });
    });

    // CORS
    document.getElementById('btn-cors').addEventListener('click', async () => {
        const target = document.getElementById('cors-target').value;
        if(!target) return;
        setLoading('Testing CORS policy...');
        const data = await post('/api/audit/cors', {target});
        clearLoading();
        rc().innerHTML = '';
        const color = data.vulnerable ? 'red' : 'emerald';
        rc().innerHTML = card(color, data.vulnerable ? 'CORS VULNERABLE' : 'CORS OK',
            `Allow-Origin: ${data['Access-Control-Allow-Origin']||'N/A'} | Allow-Credentials: ${data['Access-Control-Allow-Credentials']||'N/A'}`,
            data.fix || '');
    });

    // Subdomain
    document.getElementById('btn-subdomain').addEventListener('click', async () => {
        const domain = document.getElementById('sub-domain').value;
        if(!domain) return;
        setLoading('Scanning subdomains...');
        term.textContent = '[+] Checking common subdomains...\n';
        const data = await post('/api/audit/subdomain-takeover', {domain});
        clearLoading();
        rc().innerHTML = '';
        if(!data.vulnerable?.length) { rc().innerHTML = '<p class="text-emerald-400">✓ No dangling CNAMEs detected.</p>'; return; }
        data.vulnerable.forEach(v => rc().insertAdjacentHTML('beforeend', card('red', 'SUBDOMAIN TAKEOVER', v.subdomain, v.reason + ' — ' + v.fix)));
    });

    // SSL
    document.getElementById('btn-ssl').addEventListener('click', async () => {
        const domain = document.getElementById('ssl-domain').value;
        if(!domain) return;
        setLoading('Connecting and fetching TLS info...');
        const data = await post('/api/audit/ssl', {domain});
        clearLoading();
        rc().innerHTML = '';
        if(data.error) { rc().innerHTML = card('red', 'SSL ERROR', data.error, ''); return; }
        const color = data.secure ? 'emerald' : 'red';
        rc().innerHTML = card(color, data.secure ? 'TLS OK' : 'WEAK TLS',
            `Protocol: ${data.protocol} | Cipher: ${data.cipher}`,
            data.secure ? 'TLS version is modern and secure.' : 'Upgrade to TLS 1.2 or 1.3 immediately.');
    });

    // AI Prompt Guard
    document.getElementById('btn-ai').addEventListener('click', async () => {
        const text = document.getElementById('ai-content').value;
        if(!text) return;
        setLoading('Analyzing for injection patterns...');
        const data = await post('/api/audit/prompt-injection', {text});
        clearLoading();
        rc().innerHTML = '';
        if(!data.findings?.length) { rc().innerHTML = '<p class="text-emerald-400">✓ No injection patterns detected.</p>'; return; }
        data.findings.forEach(f => rc().insertAdjacentHTML('beforeend', card('rose', `INJECTION: ${f.type}`, f.type, f.recommendation)));
        rc().insertAdjacentHTML('beforeend', codeBlock('Dual-LLM Guard Template', escHtml(data.fix_template)));
    });

    // DOM-XSS
    document.getElementById('btn-domxss').addEventListener('click', async () => {
        const content = document.getElementById('domxss-content').value;
        if(!content) return;
        setLoading('Scanning for dangerous JS sinks...');
        const data = await post('/api/audit/dom-xss', {content});
        clearLoading();
        rc().innerHTML = '';
        if(!data.findings?.length) { rc().innerHTML = '<p class="text-emerald-400">✓ No dangerous DOM sinks detected.</p>'; return; }
        data.findings.forEach(f => rc().insertAdjacentHTML('beforeend', card('yellow', `DOM-XSS: Line ${f.line}`, f.issue, f.fix)));
    });

    // ASVS
    document.getElementById('btn-asvs').addEventListener('click', async () => {
        const arch = document.getElementById('asvs-arch').value;
        const data = await post('/api/audit/asvs', {arch});
        rc().innerHTML = `<h4 class="text-emerald-400 font-bold mb-3">ASVS Checklist — ${data.arch_type}</h4>` +
            (data.checklist||[]).map(c =>
                `<label class="flex items-start space-x-3 mb-3 cursor-pointer group">
                    <input type="checkbox" class="mt-0.5 accent-emerald-500 flex-shrink-0">
                    <div>
                        <span class="text-xs mono text-slate-500">${c.id}</span>
                        <span class="ml-2 text-xs bg-slate-800 text-slate-400 px-1 rounded">${c.category}</span>
                        <p class="text-sm text-slate-300 mt-0.5">${c.check}</p>
                    </div>
                </label>`
            ).join('');
    });

    // Git Hook
    document.getElementById('btn-hook').addEventListener('click', async () => {
        const data = await fetch('/api/audit/pre-commit-hook').then(r => r.json());
        rc().innerHTML = `<h4 class="text-emerald-400 font-bold mb-2">Pre-Commit Hook Generated</h4>`;
        data.instructions?.forEach(i => rc().insertAdjacentHTML('beforeend', `<p class="text-sm text-slate-300 mb-1">→ ${i}</p>`));
        rc().insertAdjacentHTML('beforeend', codeBlock('Save to .git/hooks/pre-commit', escHtml(data.content)));
    });

    // security.txt
    document.getElementById('btn-sectxt').addEventListener('click', async () => {
        const domain = document.getElementById('sectxt-domain').value;
        if(!domain) return;
        const data = await post('/api/audit/security-txt', {domain});
        rc().innerHTML = '';
        if(data.found) {
            rc().innerHTML = card('emerald', 'security.txt FOUND', data.url, 'RFC 9116 compliant.');
            rc().insertAdjacentHTML('beforeend', codeBlock('Content Preview', escHtml(data.content)));
        } else {
            rc().innerHTML = card('red', 'MISSING', 'No security.txt found.', data.fix || '');
            rc().insertAdjacentHTML('beforeend', codeBlock('Generate Your security.txt', escHtml(data.template)));
        }
    });

    // Enterprise: Smuggling
    document.getElementById('btn-smuggling').addEventListener('click', async () => {
        const target = document.getElementById('smuggling-target').value;
        if(!target) return;
        setLoading('Running HTTP Desync Probes (CL.TE / TE.CL)...');
        const data = await post('/api/audit/smuggling', {target});
        clearLoading();
        rc().innerHTML = '';
        if(!data.findings?.length) { rc().innerHTML = '<p class="text-emerald-400">✓ No smuggling detected.</p>'; return; }
        data.findings.forEach(f => rc().insertAdjacentHTML('beforeend', card(f.severity==='Critical'?'red':f.severity==='High'?'orange':'blue', `SMUGGLING: ${f.type}`, f.issue, f.detail)));
        if(data.cl_te_vulnerable || data.te_cl_vulnerable) {
            rc().insertAdjacentHTML('beforeend', codeBlock('Nginx Hardening Fix', escHtml(data.fix.nginx)));
        }
    });

    // Enterprise: TypoSquatting
    document.getElementById('btn-typosquat').addEventListener('click', async () => {
        const type = document.getElementById('typosquat-type').value;
        const content = document.getElementById('typosquat-content').value;
        if(!content) return;
        setLoading('Analyzing dependencies for brand mimicry...');
        const data = await post('/api/audit/typosquatting', {type, content});
        clearLoading();
        rc().innerHTML = '';
        if(data.safe) { rc().innerHTML = '<p class="text-emerald-400">✓ All dependencies look safe (No typosquatting detected).</p>'; return; }
        data.findings.forEach(f => rc().insertAdjacentHTML('beforeend', card(f.severity==='High'?'red':'orange', `TYPOSQUAT: ${f.package}`, f.issue, f.fix)));
    });

    // Enterprise: Open Redirect
    document.getElementById('btn-redirect').addEventListener('click', async () => {
        const target = document.getElementById('redirect-target').value;
        if(!target) return;
        setLoading('Fuzzing redirect parameters...');
        const data = await post('/api/audit/open-redirect', {target});
        clearLoading();
        rc().innerHTML = '';
        if(data.safe) { rc().innerHTML = '<p class="text-emerald-400">✓ No open redirects detected.</p>'; return; }
        data.findings.forEach(f => rc().insertAdjacentHTML('beforeend', card('red', `REDIRECT: ?${f.param}=`, f.issue, `Redirected to: ${f.redirected_to}`)));
        rc().insertAdjacentHTML('beforeend', codeBlock('Node.js Secure Redirect', escHtml(data.fix.node)));
    });

    // Enterprise: LocalStorage
    document.getElementById('btn-localstorage').addEventListener('click', async () => {
        const content = document.getElementById('localstorage-content').value;
        if(!content) return;
        setLoading('Auditing JS for LocalStorage token leaks...');
        const data = await post('/api/audit/localstorage', {content});
        clearLoading();
        rc().innerHTML = '';
        if(!data.findings?.length) { rc().innerHTML = '<p class="text-emerald-400">✓ No dangerous storage sinks found.</p>'; return; }
        data.findings.forEach(f => rc().insertAdjacentHTML('beforeend', card('red', `STORAGE SINK: Line ${f.line}`, f.issue, f.code)));
        rc().insertAdjacentHTML('beforeend', codeBlock('Migration to HttpOnly Cookies', escHtml(data.fix.migration_guide)));
    });

    // Enterprise: IaC Hardener
    document.getElementById('btn-iac').addEventListener('click', async () => {
        const content = document.getElementById('iac-content').value;
        if(!content) return;
        setLoading('Analyzing IAM/Terraform for wildcard permissions...');
        const data = await post('/api/audit/iac', {content});
        clearLoading();
        rc().innerHTML = '';
        if(!data.findings?.length) { rc().innerHTML = '<p class="text-emerald-400">✓ IaC policy adheres to Principle of Least Privilege.</p>'; return; }
        data.findings.forEach(f => rc().insertAdjacentHTML('beforeend', card(f.severity==='Critical'?'red':'orange', `IaC MISCONFIG: Line ${f.line}`, f.issue, f.code)));
        rc().insertAdjacentHTML('beforeend', codeBlock('Hardened IaC Template (Auto-Fixed)', escHtml(data.hardened_template)));
    });

    // Advanced: Prototype Pollution
    document.getElementById('proto-btn').addEventListener('click', async () => {
        const content = document.getElementById('proto-target').value;
        if(!content) return;
        setLoading('Analyzing code for Prototype Pollution patterns...');
        const data = await post('/api/audit/prototype-pollution', {content});
        clearLoading();
        rc().innerHTML = '';
        if(!data.findings?.length) { rc().innerHTML = '<p class="text-emerald-400">✓ No prototype pollution sinks found.</p>'; return; }
        data.findings.forEach(f => rc().insertAdjacentHTML('beforeend', card(f.severity==='High'?'red':'orange', `PROTO-POLLUTION: Line ${f.line}`, f.issue, f.code)));
        rc().insertAdjacentHTML('beforeend', codeBlock('Secure Object Creation', escHtml(data.fix)));
    });

    // Advanced: GraphQL Introspection
    document.getElementById('graphql-btn').addEventListener('click', async () => {
        const target = document.getElementById('graphql-target').value;
        if(!target) return;
        setLoading('Testing GraphQL endpoint for introspection...');
        const data = await post('/api/audit/graphql', {target});
        clearLoading();
        rc().innerHTML = '';
        if(!data.findings?.length) { rc().innerHTML = '<p class="text-emerald-400">✓ Introspection is disabled. API map is hidden.</p>'; return; }
        data.findings.forEach(f => rc().insertAdjacentHTML('beforeend', card('red', 'GRAPHQL INTROSPECTION', f.issue, f.detail)));
        rc().insertAdjacentHTML('beforeend', codeBlock('Disable Introspection (Apollo)', escHtml(data.fix)));
    });

    // Advanced: SSTI
    document.getElementById('ssti-btn').addEventListener('click', async () => {
        const target = document.getElementById('ssti-target').value;
        if(!target) return;
        setLoading('Injecting Server-Side Template payloads...');
        const data = await post('/api/audit/ssti', {target});
        clearLoading();
        rc().innerHTML = '';
        if(!data.findings?.length) { rc().innerHTML = '<p class="text-emerald-400">✓ No SSTI vulnerabilities detected.</p>'; return; }
        data.findings.forEach(f => rc().insertAdjacentHTML('beforeend', card('red', 'SSTI VULNERABILITY', f.issue, f.detail)));
        rc().insertAdjacentHTML('beforeend', codeBlock('Secure Context Rendering', escHtml(data.fix)));
    });

    // Advanced: Data Exposure
    document.getElementById('exposure-btn').addEventListener('click', async () => {
        const content = document.getElementById('exposure-target').value;
        if(!content) return;
        setLoading('Scanning JSON payload for sensitive data (PII)...');
        const data = await post('/api/audit/data-exposure', {content});
        clearLoading();
        rc().innerHTML = '';
        if(!data.findings?.length) { rc().innerHTML = '<p class="text-emerald-400">✓ No sensitive data patterns found in JSON.</p>'; return; }
        data.findings.forEach(f => rc().insertAdjacentHTML('beforeend', card('orange', 'DATA EXPOSURE', f.issue, f.detail)));
        rc().insertAdjacentHTML('beforeend', codeBlock('Data Transfer Object (DTO) Fix', escHtml(data.fix)));
    });

    // Advanced: CSP Reporting
    document.getElementById('csp-report-btn').addEventListener('click', async () => {
        const data = await fetch('/api/audit/csp-report-setup').then(r => r.json());
        rc().innerHTML = card('blue', 'CSP REPORTING SYSTEM', 'Ingestion Endpoint Ready', data.report_url);
        rc().insertAdjacentHTML('beforeend', codeBlock('CSP Reporting Setup Guide', escHtml(data.setup_guide)));
    });

    // ── RENDER HELPERS ──────────────────────────────────────────────────────
    function renderHostResults(hosts) {
        rc().innerHTML = '';
        if(!hosts?.length) { rc().innerHTML = '<p class="text-slate-500 text-sm">No open ports found.</p>'; return; }
        hosts.forEach(host => {
            host.ports?.forEach(port => {
                const c = port.severity === 'high' ? 'red' : port.severity === 'medium' ? 'yellow' : 'blue';
                rc().insertAdjacentHTML('beforeend', card(c, `PORT ${port.port}/${port.protocol}`, `${port.service} ${port.product || ''}`, `State: ${port.state} | Target: ${host.ip}`));
            });
        });
    }

    function renderSastResults(findings) {
        rc().innerHTML = '';
        if(!findings?.length) { rc().innerHTML = '<p class="text-emerald-400">✓ No SAST issues found.</p>'; return; }
        findings.forEach(f => rc().insertAdjacentHTML('beforeend', card('orange', `SAST: ${f.issue_severity}`, f.issue_text, `${f.filename}:${f.line_number}`)));
    }

    function escHtml(str) {
        return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    document.getElementById('xxe-btn').addEventListener('click', async () => {
        const content = document.getElementById('xxe-target').value;
        if(!content) return;
        setLoading('Auditing XML Parser...');
        const data = await post('/api/audit/xxe', {content});
        clearLoading();
        rc().innerHTML = '';
        if(!data.findings?.length) { rc().innerHTML = '<p class="text-emerald-400">✓ No insecure XML configurations detected.</p>'; return; }
        data.findings.forEach(f => rc().insertAdjacentHTML('beforeend', card('lime', `XXE VULN (Line ${f.line})`, f.issue, f.code)));
        rc().insertAdjacentHTML('beforeend', codeBlock('Secure XML Configuration', escHtml(data.fix)));
    });

    document.getElementById('host-btn').addEventListener('click', async () => {
        const target = document.getElementById('host-target').value;
        if(!target) return;
        setLoading('Injecting malicious Host headers...');
        const data = await post('/api/audit/host-header', {target});
        clearLoading();
        rc().innerHTML = '';
        if(!data.findings?.length) { rc().innerHTML = '<p class="text-emerald-400">✓ Host header is not blindly trusted or reflected.</p>'; return; }
        data.findings.forEach(f => rc().insertAdjacentHTML('beforeend', card('fuchsia', 'HOST INJECTION', f.issue, f.detail)));
        rc().insertAdjacentHTML('beforeend', codeBlock('Nginx Host Validation', escHtml(data.fix)));
    });

    document.getElementById('deserial-btn').addEventListener('click', async () => {
        const content = document.getElementById('deserial-target').value;
        if(!content) return;
        setLoading('Scanning for insecure object deserialization...');
        const data = await post('/api/audit/deserialization', {content});
        clearLoading();
        rc().innerHTML = '';
        if(!data.findings?.length) { rc().innerHTML = '<p class="text-emerald-400">✓ No unsafe object deserialization detected.</p>'; return; }
        data.findings.forEach(f => rc().insertAdjacentHTML('beforeend', card('yellow', `INSECURE DESERIALIZATION (Line ${f.line})`, f.issue, f.code)));
        rc().insertAdjacentHTML('beforeend', codeBlock('Safe Data Handling', escHtml(data.fix)));
    });

    document.getElementById('clickjack-btn').addEventListener('click', async () => {
        const target = document.getElementById('clickjack-target').value;
        if(!target) return;
        setLoading('Checking X-Frame-Options & CSP...');
        const data = await post('/api/audit/clickjacking', {target});
        clearLoading();
        rc().innerHTML = '';
        if(!data.findings?.length) { rc().innerHTML = '<p class="text-emerald-400">✓ Clickjacking protection (XFO/CSP) is active.</p>'; return; }
        data.findings.forEach(f => rc().insertAdjacentHTML('beforeend', card('cyan', 'CLICKJACKING VULNERABLE', f.issue, f.detail)));
        
        // Render a visual iframe test
        rc().insertAdjacentHTML('beforeend', `
            <div class="mt-4 p-4 border border-slate-700 bg-slate-900 rounded">
                <p class="text-xs text-slate-400 uppercase font-bold mb-2">Simulated Attacker Frame</p>
                <div class="w-full h-48 border-2 border-dashed border-red-500 relative opacity-80 bg-slate-800">
                    <iframe src="${target}" class="w-full h-full opacity-50 pointer-events-none"></iframe>
                    <div class="absolute inset-0 flex items-center justify-center pointer-events-none text-red-500 font-bold opacity-50 text-2xl transform rotate-[-20deg]">IFRAME SUCCESSFUL</div>
                </div>
            </div>
        `);
        
        rc().insertAdjacentHTML('beforeend', codeBlock('Anti-Clickjacking Headers', escHtml(data.fix)));
    });

    document.getElementById('ssrf-cloud-btn').addEventListener('click', async () => {
        const target = document.getElementById('ssrf-cloud-target').value;
        if(!target) return;
        setLoading('Probing Cloud Metadata (169.254.169.254)...');
        const data = await post('/api/audit/ssrf-cloud', {target});
        clearLoading();
        rc().innerHTML = '';
        if(!data.findings?.length) { rc().innerHTML = '<p class="text-emerald-400">✓ Metadata IP not reflected. No Cloud SSRF detected.</p>'; return; }
        data.findings.forEach(f => rc().insertAdjacentHTML('beforeend', card('indigo', 'CLOUD CREDENTIAL EXPOSURE', f.issue, f.detail)));
        rc().insertAdjacentHTML('beforeend', codeBlock('SSRF Prevention Strategy', escHtml(data.fix)));
    });

    // ── REMEDIATION PLAYGROUND ──────────────────────────────────────────────
    const updateRemediation = () => {
        let code = "server {\n";
        if(document.getElementById('toggle-csp').checked)  code += "    add_header Content-Security-Policy \"default-src 'self'; object-src 'none';\";\n";
        if(document.getElementById('toggle-hsts').checked)  code += "    add_header Strict-Transport-Security \"max-age=31536000; includeSubDomains; preload\";\n";
        if(document.getElementById('toggle-xfo').checked)   code += "    add_header X-Frame-Options \"DENY\";\n";
        if(document.getElementById('toggle-xcto').checked)  code += "    add_header X-Content-Type-Options \"nosniff\";\n";
        if(document.getElementById('toggle-rp').checked)    code += "    add_header Referrer-Policy \"no-referrer\";\n";
        code += "}";
        document.getElementById('remediation-code').textContent = code;
    };
    ['toggle-csp','toggle-hsts','toggle-xfo','toggle-xcto','toggle-rp'].forEach(id =>
        document.getElementById(id).addEventListener('change', updateRemediation));

    // ═══════════════════════════════════════════════════════════════════════
    // PREMIUM / SUBSCRIPTION SYSTEM
    // ═══════════════════════════════════════════════════════════════════════

    const PLANS = {
        free:    { name: 'Free',    scanners: true,  fixes: false, badge: 'FREE',    color: 'text-slate-400' },
        pro:     { name: 'Pro',     scanners: true,  fixes: true,  badge: 'PRO',     color: 'text-emerald-400' },
        enterprise: { name: 'Enterprise', scanners: true, fixes: true, badge: 'ENT', color: 'text-amber-400' }
    };

    let currentPlan = localStorage.getItem('cs_plan') || 'free';

    function applyPlan(plan) {
        currentPlan = plan;
        localStorage.setItem('cs_plan', plan);
        const p = PLANS[plan];

        const navTier = document.getElementById('nav-tier');
        const navLabel = document.getElementById('nav-tier-label');
        if (navTier && navLabel) {
            navTier.classList.remove('hidden');
            navTier.classList.add('flex');
            navLabel.textContent = p.badge;
            navLabel.style.background = plan === 'free' ? '#334155' :
                plan === 'pro' ? 'linear-gradient(135deg,#10b981,#059669)' :
                'linear-gradient(135deg,#f59e0b,#d97706)';
        }

        const upgradeBtn = document.getElementById('btn-upgrade-nav');
        if(upgradeBtn && plan !== 'free') {
            upgradeBtn.textContent = '✓ ' + p.name + ' Plan';
            upgradeBtn.className = 'ml-2 text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-700 text-slate-300 cursor-default';
            upgradeBtn.onclick = null;
        }

        updateFixGates();
    }

    function updateFixGates() {
        const hasFixes = PLANS[currentPlan].fixes;
        document.querySelectorAll('.fix-block').forEach(el => {
            const wrapper = el.closest('.fix-wrapper');
            if(!wrapper) return;
            if(hasFixes) {
                wrapper.classList.remove('premium-gate');
                el.classList.remove('premium-blur');
                const lock = wrapper.querySelector('.lock-overlay');
                if(lock) lock.remove();
            } else {
                wrapper.classList.add('premium-gate');
                el.classList.add('premium-blur');
                if(!wrapper.querySelector('.lock-overlay')) {
                    wrapper.insertAdjacentHTML('beforeend',
                        `<div class="lock-overlay">
                            <button onclick="openPricingModal()" class="bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-xs font-black px-4 py-2 rounded-full shadow-xl hover:scale-105 transition">
                                🔒 Unlock Fix — Upgrade to Pro
                            </button>
                        </div>`);
                }
            }
        });
    }

    const _origCodeBlock = codeBlock;
    function codeBlock(title, code) {
        return `<div class="fix-wrapper relative mt-4">
            <div class="fix-block">${_origCodeBlock(title, code)}</div>
        </div>`;
    }

    function openPricingModal() {
        document.getElementById('pricing-modal').classList.remove('hidden');
    }
    function closePricingModal() {
        document.getElementById('pricing-modal').classList.add('hidden');
    }

    function selectPlan(plan) {
        if(plan === 'free') {
            applyPlan('free');
            closePricingModal();
            return;
        }
        const modal = document.getElementById('payment-modal');
        document.getElementById('payment-plan-name').textContent = PLANS[plan].name;
        document.getElementById('payment-plan-price').textContent = plan === 'pro' ? '$12/month' : '$49/month';
        document.getElementById('payment-plan-key').value = plan;
        modal.classList.remove('hidden');
        document.getElementById('pricing-modal').classList.add('hidden');
    }

    function submitPayment() {
        const plan = document.getElementById('payment-plan-key').value;
        const name = document.getElementById('card-name').value;
        const num  = document.getElementById('card-number').value;
        if(!name || !num) { alert('Please fill in all payment fields.'); return; }

        const btn = document.getElementById('btn-pay');
        btn.textContent = 'Processing...';
        btn.disabled = true;

        setTimeout(() => {
            document.getElementById('payment-modal').classList.add('hidden');
            document.getElementById('success-modal').classList.remove('hidden');
            applyPlan(plan);
        }, 2000);
    }

    applyPlan(currentPlan);
    

    // ── EXOTIC AUDITORS JS ─────────────────────────────────────────────────
    const _post = async (endpoint, payload) => {
        const res = await fetch(endpoint, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
        return res.json();
    };
    const _rc = () => document.getElementById('results-container');
    function _card(color, label, title, body) {
        return `<div class="finding-card bg-slate-950 border-l-4 border-${color}-500 p-4 rounded-r-lg mb-3"><span class="text-xs bg-${color}-500/10 text-${color}-400 px-2 py-0.5 rounded font-bold mono">${label}</span><p class="text-sm mt-2 font-semibold">${title}</p><p class="text-xs text-slate-400 mt-1">${body}</p></div>`;
    }
    function _code(title, code) {
        return `<div class="mt-4 p-4 bg-black rounded-lg border border-slate-800"><div class="flex justify-between items-center mb-2"><h4 class="text-emerald-400 text-xs font-bold uppercase">${title}</h4><button onclick="navigator.clipboard.writeText(this.parentElement.nextElementSibling.textContent)" class="text-[10px] text-slate-400 hover:text-slate-200">Copy</button></div><pre class="text-[10px] text-slate-300 mono overflow-x-auto">${code}</pre></div>`;
    }
    function _escH(str) { return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

    document.getElementById('cswsh-btn').addEventListener('click', async () => {
        const target = document.getElementById('cswsh-target').value; if(!target) return;
        const data = await _post('/api/audit/cswsh', {target});
        _rc().innerHTML = '';
        if(!data.findings?.length) { _rc().innerHTML = '<p class="text-emerald-400">✓ WebSocket properly validates Origin header.</p>'; return; }
        data.findings.forEach(f => _rc().insertAdjacentHTML('beforeend', _card('teal','CSWSH VULNERABLE', f.issue, f.detail)));
        _rc().insertAdjacentHTML('beforeend', _code('Secure WS Origin Whitelist', _escH(data.fix)));
    });

    document.getElementById('redos-btn').addEventListener('click', async () => {
        const content = document.getElementById('redos-target').value; if(!content) return;
        const data = await _post('/api/audit/redos', {content});
        _rc().innerHTML = '';
        if(!data.findings?.length) { _rc().innerHTML = '<p class="text-emerald-400">✓ No catastrophic backtracking patterns detected.</p>'; return; }
        data.findings.forEach(f => _rc().insertAdjacentHTML('beforeend', _card('red',`ReDoS (Line ${f.line})`, f.issue, f.code)));
        _rc().insertAdjacentHTML('beforeend', _code('Safe Regex Strategy', _escH(data.fix)));
    });

    document.getElementById('debug-btn').addEventListener('click', async () => {
        const target = document.getElementById('debug-target').value; if(!target) return;
        const data = await _post('/api/audit/debug-endpoints', {target});
        _rc().innerHTML = '';
        if(!data.findings?.length) { _rc().innerHTML = '<p class="text-emerald-400">✓ No exposed debug/dev endpoints found.</p>'; return; }
        data.findings.forEach(f => _rc().insertAdjacentHTML('beforeend', _card('orange','DEV ENDPOINT EXPOSED', f.issue, f.detail)));
        _rc().insertAdjacentHTML('beforeend', _code('Disable Dev Routes', _escH(data.fix)));
    });

    document.getElementById('css-inject-btn').addEventListener('click', async () => {
        const content = document.getElementById('css-inject-target').value; if(!content) return;
        const data = await _post('/api/audit/css-injection', {content});
        _rc().innerHTML = '';
        if(!data.findings?.length) { _rc().innerHTML = '<p class="text-emerald-400">✓ No unsafe CSS properties detected.</p>'; return; }
        data.findings.forEach(f => _rc().insertAdjacentHTML('beforeend', _card('violet',`CSS KEYLOG (Line ${f.line})`, f.issue, f.code)));
        _rc().insertAdjacentHTML('beforeend', _code('Safe CSS Policy', _escH(data.fix)));
    });

    document.getElementById('dns-rebind-btn').addEventListener('click', async () => {
        const target = document.getElementById('dns-rebind-target').value; if(!target) return;
        const data = await _post('/api/audit/dns-rebinding', {target});
        _rc().innerHTML = '';
        if(!data.findings?.length) { _rc().innerHTML = '<p class="text-emerald-400">✓ No DNS rebinding vulnerability detected.</p>'; return; }
        data.findings.forEach(f => _rc().insertAdjacentHTML('beforeend', _card('pink','DNS REBINDING', f.issue, f.detail)));
        _rc().insertAdjacentHTML('beforeend', _code('IP Pinning Fix', _escH(data.fix)));
    });

    // ── PARTNER MARKETPLACE JS ─────────────────────────────────────────────
    let activePartner = '';
    function connectPartner(partner) {
        activePartner = partner;
        const names = { snyk:'Snyk', vicarius:'Vicarius vRx', astra:'Astra Security', hostedscan:'HostedScan' };
        document.getElementById('partner-modal-title').textContent = 'Connect ' + names[partner];
        document.getElementById('partner-api-key').value = '';
        document.getElementById('partner-modal').classList.remove('hidden');
    }

    document.getElementById('partner-modal-submit').addEventListener('click', () => {
        const key = document.getElementById('partner-api-key').value.trim();
        if(!key) return;

        sessionStorage.setItem(`partner_key_${activePartner}`, key);

        // Update status badge
        const statusEl = document.getElementById(activePartner + '-status');
        if(statusEl) { statusEl.textContent = 'CONNECTED'; statusEl.className = 'text-[10px] font-bold bg-emerald-900/50 text-emerald-400 px-2 py-1 rounded border border-emerald-500/30'; }

        // Update result under card
        const resultEl = document.getElementById(activePartner + '-result');
        if(resultEl) {
            resultEl.classList.remove('hidden');
            resultEl.innerHTML = `<span class="text-emerald-400 font-bold">✓ Connected.</span> <span class="text-slate-400">Live data will populate on next scan trigger.</span>`;
        }

        // Update button
        const btn = document.getElementById(activePartner + '-connect-btn');
        if(btn) { btn.textContent = '✓ Connected'; btn.classList.replace('bg-purple-700','bg-emerald-700'); btn.classList.replace('bg-blue-700','bg-emerald-700'); btn.classList.replace('bg-indigo-700','bg-emerald-700'); btn.disabled = true; }

        document.getElementById('partner-modal').classList.add('hidden');
    });
    