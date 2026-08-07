document.addEventListener('DOMContentLoaded', () => {
  // Inject Terminal HTML
  const terminalUI = document.createElement('div');
  terminalUI.id = 'hacker-terminal';
  terminalUI.className = 'hidden';
  terminalUI.innerHTML = `
    <div id="terminal-output">OmniCorp Mainframe [Version 1.0.9]\n(c) 2026 OmniCorp Corporation. All rights reserved.\n\nType 'help' to see available commands.</div>
    <div class="terminal-line">
      <span class="terminal-prompt">root@omnicorp:~$</span>
      <input type="text" id="terminal-input" autocomplete="off" spellcheck="false" autofocus>
    </div>
  `;
  document.body.appendChild(terminalUI);

  const toggleBtn = document.createElement('button');
  toggleBtn.id = 'terminal-toggle-btn';
  toggleBtn.innerText = '>_';
  toggleBtn.title = "Toggle Hacker Mode (Ctrl + `)";
  document.body.appendChild(toggleBtn);

  const term = document.getElementById('hacker-terminal');
  const input = document.getElementById('terminal-input');
  const output = document.getElementById('terminal-output');

  function toggleTerminal() {
    term.classList.toggle('hidden');
    if (!term.classList.contains('hidden')) {
      input.focus();
    }
  }

  toggleBtn.addEventListener('click', toggleTerminal);

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === '`') {
      e.preventDefault();
      toggleTerminal();
    }
  });

  input.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
      const cmdRaw = input.value;
      const cmd = cmdRaw.trim();
      input.value = '';
      
      printOut(`\n<span style="color:#0f0;">root@omnicorp:~$</span> ${escapeHtml(cmd)}`);

      if (!cmd) return;

      const args = cmd.split(' ');
      const command = args[0].toLowerCase();

      switch (command) {
        case 'help':
          printOut(`Available commands:
  help               - Show this message
  clear              - Clear terminal output
  ls                 - List active challenge IDs
  cd <page>          - Navigate to a page (home, challenges, scoreboard, payloads, campaign)
  submit <id> <flag> - Submit a flag for a challenge
  deploy <id>        - Deploy a docker instance for a hard challenge
  decode <t> <str>   - Decode a string (types: base64, hex, url)
  scoreboard         - View top 3 teams
  exit               - Close terminal`);
          break;
        case 'clear':
          output.innerHTML = '';
          break;
        case 'cd':
        case 'goto':
          if (!args[1]) {
            printOut(`<span class="terminal-error">Usage: ${command} <page></span>`);
            printOut(`Available pages: home, challenges, scoreboard, payloads, campaign`);
          } else {
            const dest = args[1].toLowerCase();
            const routes = {
              'home': '/',
              '/': '/',
              '..': '/',
              'index': '/',
              'challenges': '/challenges.html',
              'scoreboard': '/scoreboard.html',
              'payloads': '/payloads.html',
              'campaign': '/campaign.html'
            };
            if (routes[dest]) {
              printOut(`Navigating to ${escapeHtml(dest)}...`);
              setTimeout(() => {
                window.location.href = routes[dest];
              }, 500);
            } else {
              printOut(`<span class="terminal-error">Directory/Page not found: ${escapeHtml(dest)}</span>`);
            }
          }
          break;
        case 'exit':
          toggleTerminal();
          break;
        case 'ls':
          await runLs();
          break;
        case 'submit':
          await runSubmit(args[1], args.slice(2).join(' '));
          break;
        case 'deploy':
          await runDeploy(args[1]);
          break;
        case 'scoreboard':
          await runScoreboard();
          break;
        case 'sudo':
          printOut(`<span class="terminal-error">user is not in the sudoers file. This incident will be reported.</span>`);
          break;
        case 'whoami':
          try {
            const res = await fetch('/api/auth/me');
            const data = await res.json();
            if (data.teamName) {
              printOut(`You are <span style="color:var(--primary); font-weight:bold;">${escapeHtml(data.teamName)}</span>, a l33t hacker.`);
            } else {
              printOut(`guest - Please log in.`);
            }
          } catch (e) {
            printOut(`guest - Please log in.`);
          }
          break;
        case 'cat':
          if (args[1] === '/etc/passwd' || args[1] === '/etc/shadow') {
            printOut(`root:x:0:0:root:/root:/bin/bash\n...<br><span style="color:var(--text-muted); font-size: 10px;">(Wow, you found a secret! There are no points for this, but you have earned my respect.)</span>`);
          } else {
            printOut(`<span class="terminal-error">cat: ${escapeHtml(args[1] || '')}: Permission denied</span>`);
          }
          break;
        case 'ping':
          printOut(`PING ${escapeHtml(args[1] || '8.8.8.8')} 56(84) bytes of data.\n64 bytes from ${escapeHtml(args[1] || '8.8.8.8')}: icmp_seq=1 ttl=115 time=14.2 ms\n...`);
          break;
        case 'decode':
          if (args.length < 3) {
            printOut(`<span class="terminal-error">Usage: decode <type> <string></span>\nTypes: base64, hex, url`);
          } else {
            const type = args[1].toLowerCase();
            const str = args.slice(2).join(' ');
            try {
              let result = '';
              if (type === 'base64') result = atob(str);
              else if (type === 'hex') result = decodeURIComponent(str.replace(/\s+/g, '').replace(/[0-9a-f]{2}/g, '%$&'));
              else if (type === 'url') result = decodeURIComponent(str);
              else {
                printOut(`<span class="terminal-error">Unknown type. Use: base64, hex, url</span>`);
                break;
              }
              printOut(`<span style="color:var(--success); font-family:var(--mono);">[Decoded]:</span> ${escapeHtml(result)}`);
            } catch (e) {
              printOut(`<span class="terminal-error">Failed to decode ${escapeHtml(type)} string.</span>`);
            }
          }
          break;
        default:
          printOut(`<span class="terminal-error">Command not found: ${escapeHtml(command)}</span>`);
      }
      term.scrollTop = term.scrollHeight;
    }
  });

  function printOut(html) {
    output.innerHTML += `\n${html}`;
  }

  async function runLs() {
    try {
      const res = await fetch('/api/challenges');
      const data = await res.json();
      if (!res.ok) {
        printOut(`<span class="terminal-error">${data.error || 'Access Denied'}</span>`);
        return;
      }
      let out = 'ID\tPTS\tSTATUS\t\tNAME\n----------------------------------------------------';
      data.forEach(c => {
        out += `\n${c.id}\t${c.points}\t${c.solved ? '[SOLVED]' : '[      ]'}\t${escapeHtml(c.title)}`;
      });
      printOut(out);
    } catch (e) {
      printOut(`<span class="terminal-error">Network error.</span>`);
    }
  }

  async function runSubmit(id, flag) {
    if (!id || !flag) {
      printOut(`<span class="terminal-error">Usage: submit <challenge_id> <flag></span>`);
      return;
    }
    if (!/^(flag|FLAG)\{.*\}$/.test(flag)) {
      printOut(`<span class="terminal-error">Invalid format: Flags must match flag{...}</span>`);
      return;
    }
    try {
      const res = await fetch(`/api/challenges/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flag })
      });
      const data = await res.json();
      if (res.ok && data.correct) {
        printOut(`<span class="terminal-success">ACCESS GRANTED: Flag accepted.</span>`);
        // Trigger global reload or heat visual
        if (window.loadChallenges) window.loadChallenges();
      } else {
        printOut(`<span class="terminal-error">ACCESS DENIED: ${data.error || 'Incorrect flag.'}</span>`);
      }
    } catch (e) {
      printOut(`<span class="terminal-error">Network error.</span>`);
    }
  }

  async function runDeploy(id) {
    if (!id) {
      printOut(`<span class="terminal-error">Usage: deploy <challenge_id></span>`);
      return;
    }
    try {
      printOut(`Provisioning Container...`);
      const res = await fetch(`/api/challenges/${id}/deploy`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        printOut(`<span class="terminal-success">Instance Deployed.</span>`);
        printOut(`Target IP: ${data.ip}:${data.port}`);
        printOut(`Destroys in: 30:00`);
      } else {
        printOut(`<span class="terminal-error">Deployment Failed: ${data.error || 'Unknown error.'}</span>`);
      }
    } catch (e) {
      printOut(`<span class="terminal-error">Network error.</span>`);
    }
  }

  async function runScoreboard() {
    try {
      const res = await fetch('/api/scoreboard');
      const data = await res.json();
      let out = 'RANK\tSCORE\tTEAM\n-----------------------------------------';
      data.slice(0, 3).forEach(t => {
        out += `\n${t.rank}\t${t.score}\t${escapeHtml(t.team)} ${t.badges ? t.badges.join('') : ''}`;
      });
      printOut(out);
    } catch(e) {
      printOut(`<span class="terminal-error">Network error.</span>`);
    }
  }

  function escapeHtml(s) {
    const d = document.createElement('div');
    d.textContent = s ?? '';
    return d.innerHTML;
  }
});
