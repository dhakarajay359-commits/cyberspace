
    // ─── Clock ───
    function updateClock() {
        const now = new Date();
        document.getElementById('clock-display').textContent =
            now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
    }
    updateClock(); setInterval(updateClock, 1000);

    // ─── Matrix Rain ───
    const matrixCanvas = document.getElementById('matrix-canvas');
    const matrixCtx = matrixCanvas.getContext('2d');
    const chars = 'アイウエオカキクケコサシスセソタチツテト01ナニヌネノABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*<>/\\|{}[]';

    function resizeMatrix() {
        matrixCanvas.width = window.innerWidth;
        matrixCanvas.height = window.innerHeight;
    }
    resizeMatrix();
    window.addEventListener('resize', resizeMatrix);

    const fontSize = 13;
    let columns = Math.floor(matrixCanvas.width / fontSize);
    let drops = Array.from({length: columns}, () => Math.random() * -100);

    function drawMatrix() {
        matrixCtx.fillStyle = 'rgba(5, 10, 15, 0.05)';
        matrixCtx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
        matrixCtx.font = fontSize + 'px JetBrains Mono, monospace';
        drops.forEach((y, i) => {
            const char = chars[Math.floor(Math.random() * chars.length)];
            const brightness = Math.random();
            if (brightness > 0.95) {
                matrixCtx.fillStyle = '#ffffff';
            } else if (brightness > 0.8) {
                matrixCtx.fillStyle = '#7effd4';
            } else {
                matrixCtx.fillStyle = '#10b981';
            }
            matrixCtx.fillText(char, i * fontSize, y * fontSize);
            drops[i] = y > matrixCanvas.height / fontSize + Math.random() * 20 ? 0 : y + 1;
        });
    }
    setInterval(drawMatrix, 45);

    // ─── NEEDLE-THREAD Particle Network ───
    (function() {
        const nc = document.getElementById('cyber-bg');
        if (!nc) return;
        const nx = nc.getContext('2d');
        let nW, nH;
        const np = [];
        function rsz() { nW = nc.width = window.innerWidth; nH = nc.height = window.innerHeight; }
        window.addEventListener('resize', rsz); rsz();
        function P() {
            this.x = Math.random()*nW; this.y = Math.random()*nH;
            this.vx = (Math.random()-0.5)*0.45; this.vy = (Math.random()-0.5)*0.45;
            this.r = Math.random()*1.8+0.4;
        }
        P.prototype.tick = function() {
            this.x+=this.vx; this.y+=this.vy;
            if(this.x<0||this.x>nW) this.vx=-this.vx;
            if(this.y<0||this.y>nH) this.vy=-this.vy;
        };
        P.prototype.draw = function() {
            nx.beginPath(); nx.arc(this.x,this.y,this.r,0,Math.PI*2);
            nx.fillStyle='#10b981'; nx.shadowBlur=5; nx.shadowColor='#10b981';
            nx.fill(); nx.shadowBlur=0;
        };
        for(let i=0;i<80;i++) np.push(new P());
        function loop() {
            nx.clearRect(0,0,nW,nH);
            for(let i=0;i<np.length;i++) {
                np[i].tick(); np[i].draw();
                for(let j=i+1;j<np.length;j++) {
                    const dx=np[i].x-np[j].x, dy=np[i].y-np[j].y;
                    const d=Math.sqrt(dx*dx+dy*dy);
                    if(d<140) {
                        nx.beginPath();
                        nx.strokeStyle=`rgba(16,185,129,${(1-d/140)*0.55})`;
                        nx.lineWidth=0.7;
                        nx.moveTo(np[i].x,np[i].y); nx.lineTo(np[j].x,np[j].y);
                        nx.stroke();
                    }
                }
            }
            requestAnimationFrame(loop);
        }
        loop();
    })();

    // ─── Floating Particles ───
    const cyberWords = ['SCANNING', 'CVE-2024', 'EXPLOIT', 'PENTEST', 'FIREWALL', 'PAYLOAD',
        'NMAP -sV', 'OSINT', 'BURPSUITE', 'METASPLOIT', 'XSS', 'SQLI', 'RCE',
        '192.168.1.0/24', 'PORT 443', 'SSH-2.0', 'TLS 1.3', 'AES-256', 'HASH:SHA256',
        'ROOT ACCESS', 'PRIVILEGE ESC', 'BUFFER OVF'];

    const layer = document.getElementById('particles-layer');
    for(let i = 0; i < 18; i++) {
        const el = document.createElement('div');
        el.className = 'particle';
        el.textContent = cyberWords[Math.floor(Math.random() * cyberWords.length)];
        el.style.left = Math.random() * 100 + '%';
        el.style.animationDuration = (20 + Math.random() * 30) + 's';
        el.style.animationDelay = (Math.random() * 20) + 's';
        el.style.opacity = 0;
        el.style.color = Math.random() > 0.7 ? '#34d399' : '#10b981';
        layer.appendChild(el);
    }

    // ─── Typing Animation ───
    const messages = [
        'Initializing secure session...',
        'Loading threat intelligence...',
        'Connecting to DEFSOC nodes...',
        'Verifying zero-trust policy...',
        'Ready. Enter credentials.',
    ];
    let msgIdx = 0, charIdx = 0;
    const typingEl = document.getElementById('typing-display');
    function typeNext() {
        if(charIdx < messages[msgIdx].length) {
            typingEl.textContent = messages[msgIdx].substring(0, ++charIdx);
            setTimeout(typeNext, 50);
        } else {
            setTimeout(() => {
                charIdx = 0;
                msgIdx = (msgIdx + 1) % messages.length;
                typingEl.textContent = '';
                typeNext();
            }, 2500);
        }
    }
    typeNext();

    // ─── Live Threat Feed ───
    const threatData = [
        {sev:'CRIT', src:'45.88.221.12', msg:'SQLi probe on /api/auth'},
        {sev:'HIGH', src:'92.118.36.11', msg:'Port scan 0-65535'},
        {sev:'HIGH', src:'31.14.40.115', msg:'Brute-force SSH detected'},
        {sev:'MED', src:'177.72.246.3', msg:'XSS payload in header'},
        {sev:'MED', src:'5.182.211.7', msg:'CVE-2021-44228 probe'},
        {sev:'CRIT', src:'23.83.224.19', msg:'RCE attempt via SSTI'},
        {sev:'HIGH', src:'103.79.79.4', msg:'Directory traversal ../../'},
        {sev:'MED', src:'185.220.101.2', msg:'Tor exit node detected'},
        {sev:'HIGH', src:'109.74.154.9', msg:'SSRF to internal metadata'},
        {sev:'CRIT', src:'80.249.145.7', msg:'Log4Shell exploit attempt'},
    ];
    const feedEl = document.getElementById('threat-feed-list');

    function addThreatFeedItem() {
        const t = threatData[Math.floor(Math.random() * threatData.length)];
        const sevClass = t.sev === 'CRIT' ? 'sev-crit' : t.sev === 'HIGH' ? 'sev-high' : 'sev-med';
        const item = document.createElement('div');
        item.className = 'feed-item';
        item.innerHTML = `<span class="${sevClass}">[${t.sev}]</span> ${t.src}<br><span style="color:rgba(100,150,120,0.6)">${t.msg}</span>`;
        feedEl.insertBefore(item, feedEl.firstChild);
        if(feedEl.children.length > 6) feedEl.removeChild(feedEl.lastChild);
    }
    for(let i=0;i<4;i++) addThreatFeedItem();
    setInterval(addThreatFeedItem, 3000);

    // ─── Animating Stats ───
    setInterval(() => {
        document.getElementById('stat-threats').textContent =
            (2847 + Math.floor(Math.random() * 50)).toLocaleString();
        document.getElementById('stat-scans').textContent =
            Math.floor(130 + Math.random() * 30);
    }, 2000);

    // ─── Login Submit Animation ───
    document.getElementById('login-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const bar = document.getElementById('loading-bar');
        const btn = document.getElementById('btn-login');
        const btnText = document.getElementById('btn-text');

        const user = document.getElementById('username').value.trim();
        const pass = document.getElementById('password').value.trim();
        if (!user || !pass) return;

        btnText.textContent = '⬡ AUTHENTICATING...';
        btn.style.opacity = '0.8';
        btn.disabled = true;

        let barWidth = 0;
        const interval = setInterval(() => {
            barWidth += Math.random() * 18;
            if (barWidth >= 100) {
                barWidth = 100;
                clearInterval(interval);
                bar.style.width = '100%';
                setTimeout(() => { window.location.href = '/dashboard'; }, 400);
            }
            bar.style.width = barWidth + '%';
        }, 150);
    });
    