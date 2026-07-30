
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

// ═══════════════════════════════════════════════════════════
//  DYNAMIC VFS & SHELL ENGINE
// ═══════════════════════════════════════════════════════════
class VFSNode {
    constructor(name, isDir = false, content = '') {
        this.name = name;
        this.isDir = isDir;
        this.content = content; // for files
        this.children = {};     // for dirs
        this.parent = null;
    }
}

class VFS {
    constructor() {
        this.root = new VFSNode('/', true);
        this.cwd = this.root;
        this._initDefaultFS();
    }

    _initDefaultFS() {
        this.mkdir('/root');
        this.mkdir('/home');
        this.mkdir('/home/kali');
        this.mkdir('/usr');
        this.mkdir('/usr/share');
        this.mkdir('/usr/share/wordlists');
        this.writeFile('/usr/share/wordlists/rockyou.txt', 'password\n123456\nqwerty\nletmein\nadmin\n');
        this.writeFile('/root/flag.txt', 'THM{vfs_is_working_perfectly}');
        
        // Initial setup for the user
        this.cwd = this.resolvePath('/root');
    }

    resolvePath(path) {
        if (!path) return this.cwd;
        if (path === '/') return this.root;
        
        let curr = path.startsWith('/') ? this.root : this.cwd;
        const parts = path.split('/').filter(p => p !== '');
        
        for (let p of parts) {
            if (p === '.') continue;
            if (p === '..') {
                if (curr.parent) curr = curr.parent;
                continue;
            }
            if (!curr.isDir || !curr.children[p]) return null;
            curr = curr.children[p];
        }
        return curr;
    }

    getPathString(node) {
        if (node === this.root) return '/';
        let parts = [];
        let curr = node;
        while (curr && curr !== this.root) {
            parts.unshift(curr.name);
            curr = curr.parent;
        }
        return '/' + parts.join('/');
    }

    mkdir(path) {
        if (path === '/') return;
        const parts = path.split('/');
        const name = parts.pop();
        const parentPath = parts.join('/') || '/';
        
        let parent = this.resolvePath(parentPath);
        if (!parent) {
            // auto-create parent
            this.mkdir(parentPath);
            parent = this.resolvePath(parentPath);
        }
        if (parent && parent.isDir && !parent.children[name]) {
            const dir = new VFSNode(name, true);
            dir.parent = parent;
            parent.children[name] = dir;
        }
    }

    writeFile(path, content, append = false) {
        const parts = path.split('/');
        const name = parts.pop();
        const parentPath = parts.join('/') || '/';
        
        const parent = this.resolvePath(parentPath);
        if (!parent || !parent.isDir) return false;

        let file = parent.children[name];
        if (file && file.isDir) return false;

        if (!file) {
            file = new VFSNode(name, false, '');
            file.parent = parent;
            parent.children[name] = file;
        }

        if (append) {
            file.content += content;
        } else {
            file.content = content;
        }
        return true;
    }

    readFile(path) {
        const node = this.resolvePath(path);
        if (node && !node.isDir) return node.content;
        return null;
    }
    
    rm(path) {
        const node = this.resolvePath(path);
        if (!node || node === this.root) return false;
        delete node.parent.children[node.name];
        return true;
    }
}

class ShellEngine {
    constructor() {
        this.vfs = new VFS();
        this.user = 'root';
        this.hostname = 'attackbox';
        
        this.commands = {
            'pwd': (args) => {
                return this.vfs.getPathString(this.vfs.cwd);
            },
            'cd': (args) => {
                const target = args[0] || '/root';
                const node = this.vfs.resolvePath(target);
                if (!node) return `bash: cd: ${target}: No such file or directory`;
                if (!node.isDir) return `bash: cd: ${target}: Not a directory`;
                this.vfs.cwd = node;
                return '';
            },
            'ls': (args) => {
                let showHidden = args.includes('-a') || args.includes('-la') || args.includes('-al');
                let longFormat = args.includes('-l') || args.includes('-la') || args.includes('-al');
                
                const paths = args.filter(a => !a.startsWith('-'));
                const targetPath = paths.length > 0 ? paths[0] : '.';
                const node = this.vfs.resolvePath(targetPath);
                
                if (!node) return `ls: cannot access '${targetPath}': No such file or directory`;
                if (!node.isDir) return node.name;
                
                let out = [];
                const keys = Object.keys(node.children);
                if (showHidden) {
                    keys.unshift('..');
                    keys.unshift('.');
                }
                
                if (longFormat) {
                    out.push('total ' + (keys.length * 4));
                    for (let k of keys) {
                        let isDir = false;
                        if (k === '.') isDir = true;
                        else if (k === '..') isDir = true;
                        else isDir = node.children[k].isDir;
                        
                        let perms = isDir ? 'drwxr-xr-x' : '-rw-r--r--';
                        let size = isDir ? 4096 : (node.children[k] ? node.children[k].content.length : 0);
                        let date = 'Jul 17 12:00';
                        let cname = isDir ? `<span class="text-blue-400 font-bold">${k}</span>` : k;
                        out.push(`${perms} 1 ${this.user} ${this.user} ${size.toString().padStart(5, ' ')} ${date} ${cname}`);
                    }
                    return out.join('<br>');
                } else {
                    for (let k of keys) {
                        let isDir = (k==='.' || k==='..') ? true : node.children[k].isDir;
                        let cname = isDir ? `<span class="text-blue-400 font-bold">${k}</span>` : k;
                        out.push(cname);
                    }
                    return out.join('&nbsp;&nbsp;&nbsp;&nbsp;');
                }
            },
            'cat': (args) => {
                if (args.length === 0) return '';
                let out = [];
                for (let a of args) {
                    if (a.startsWith('>')) continue; // Skip redirect markers if they leaked here
                    const content = this.vfs.readFile(a);
                    if (content === null) out.push(`cat: ${a}: No such file or directory`);
                    else out.push(content.replace(/\\n/g, '<br>'));
                }
                return out.join('<br>');
            },
            'echo': (args) => {
                let out = args.join(' ');
                if (out.startsWith('"') && out.endsWith('"')) out = out.slice(1, -1);
                if (out.startsWith("'") && out.endsWith("'")) out = out.slice(1, -1);
                return out;
            },
            'mkdir': (args) => {
                if (args.length === 0) return 'mkdir: missing operand';
                for (let a of args) {
                    const existing = this.vfs.resolvePath(a);
                    if (existing) return `mkdir: cannot create directory '${a}': File exists`;
                    this.vfs.mkdir(this.vfs.getPathString(this.vfs.cwd) + '/' + a);
                }
                return '';
            },
            'touch': (args) => {
                if (args.length === 0) return 'touch: missing file operand';
                for (let a of args) {
                    const existing = this.vfs.resolvePath(a);
                    if (!existing) {
                        const cwdStr = this.vfs.getPathString(this.vfs.cwd);
                        const path = a.startsWith('/') ? a : (cwdStr === '/' ? '/' + a : cwdStr + '/' + a);
                        this.vfs.writeFile(path, '');
                    }
                }
                return '';
            },
            'rm': (args) => {
                if (args.length === 0) return 'rm: missing operand';
                // ignoring flags for simplicity
                const files = args.filter(a => !a.startsWith('-'));
                for (let f of files) {
                    if (!this.vfs.rm(f)) return `rm: cannot remove '${f}': No such file or directory`;
                }
                return '';
            },
            'whoami': (args) => {
                return this.user;
            },
            'clear': (args) => {
                return 'CLEAR_SIG';
            },
            'help': (args) => {
                return `Cyberspace Mock Shell v2.0<br>Available commands: pwd, cd, ls, cat, echo, mkdir, touch, rm, whoami, clear, help<br>Also supports standard tools: nmap, sqlmap, hashcat (simulated).`;
            }
        };
    }

    getPrompt() {
        let p = this.vfs.getPathString(this.vfs.cwd);
        if (p.startsWith('/root')) p = p.replace('/root', '~');
        return `┌──(<span class="text-blue-400 font-bold">${this.user}㉿${this.hostname}</span>)-[<span class="text-white">${p}</span>]<br>└─<span class="text-emerald-400 font-bold">#</span> `;
    }

    parseArgs(cmdStr) {
        // very basic string parser that respects quotes
        const args = [];
        let curr = '';
        let inQuotes = false;
        let quoteChar = '';
        
        for (let i = 0; i < cmdStr.length; i++) {
            const char = cmdStr[i];
            if ((char === '"' || char === "'") && (i === 0 || cmdStr[i-1] !== '\\')) {
                if (!inQuotes) {
                    inQuotes = true;
                    quoteChar = char;
                } else if (quoteChar === char) {
                    inQuotes = false;
                } else {
                    curr += char;
                }
            } else if (char === ' ' && !inQuotes) {
                if (curr.length > 0) {
                    args.push(curr);
                    curr = '';
                }
            } else {
                curr += char;
            }
        }
        if (curr.length > 0) args.push(curr);
        return args;
    }

    execute(cmdStr) {
        cmdStr = cmdStr.trim();
        if (!cmdStr) return '';
        
        // Handle output redirection > and >>
        let redirectFile = null;
        let append = false;
        if (cmdStr.includes('>>')) {
            const parts = cmdStr.split('>>');
            cmdStr = parts[0].trim();
            redirectFile = parts[1].trim();
            append = true;
        } else if (cmdStr.includes('>')) {
            const parts = cmdStr.split('>');
            cmdStr = parts[0].trim();
            redirectFile = parts[1].trim();
            append = false;
        }

        const args = this.parseArgs(cmdStr);
        const cmd = args.shift();

        let output = '';
        if (this.commands[cmd]) {
            output = this.commands[cmd](args);
        } else {
            // Hook for dynamic hacking tools
            output = this.executeHackingTool(cmd, args, cmdStr);
        }
        
        if (redirectFile && output !== 'CLEAR_SIG' && !output.includes('bash: ')) {
            // strip HTML tags for saved files
            const cleanOut = output.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ');
            const cwdStr = this.vfs.getPathString(this.vfs.cwd);
            const path = redirectFile.startsWith('/') ? redirectFile : (cwdStr === '/' ? '/' + redirectFile : cwdStr + '/' + redirectFile);
            this.vfs.writeFile(path, cleanOut + '\\n', append);
            return '';
        }

        return output;
    }
    
    executeHackingTool(cmd, args, fullStr) {
        // Fallback for tools like nmap, sqlmap, etc.
        const now = () => {
            const d = new Date();
            return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0') + ' ' + 
                   String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0') + ' ' + 'UTC';
        };
        const rnd = (min, max) => (Math.random() * (max - min) + min).toFixed(2);
        
        if (cmd === 'nmap') {
            const r = fullStr;
            const t = args[args.length - 1] || 'target';
            const sV = r.includes('-sV');
            const oS = r.includes('-O');
            const script = r.includes('--script');
            
            let out = `<span class="text-emerald-400">Starting Nmap 7.94 ( https://nmap.org ) at ${now()}</span><br>`;
            out += `Nmap scan report for ${t}<br>Host is up (${rnd(0.010,0.080)}s latency).<br>`;
            
            if (t.includes('10.10.')) {
                // internal target
                out += `Not shown: 998 closed tcp ports (reset)<br>PORT&nbsp;&nbsp;&nbsp;STATE SERVICE${sV?' VERSION':''}<br>`;
                out += `22/tcp&nbsp; open&nbsp; ssh${sV ? '&nbsp;&nbsp;&nbsp;&nbsp; <span class="text-cyan-400">OpenSSH 8.2p1</span>' : ''}<br>`;
                out += `80/tcp&nbsp; open&nbsp; http${sV ? '&nbsp;&nbsp;&nbsp;&nbsp;<span class="text-yellow-400">Apache httpd 2.4.49</span>' : ''}<br>`;
                if (script) out += `<br>| vuln: <span class="text-red-400 font-bold">CVE-2021-41773</span> VULNERABLE (Path Traversal)<br>`;
            } else {
                out += `Not shown: 999 filtered tcp ports (no-response)<br>PORT&nbsp;&nbsp;&nbsp;STATE SERVICE<br>`;
                out += `443/tcp open&nbsp; https<br>`;
            }
            out += `<br>Nmap done: 1 IP address (1 host up) scanned in ${rnd(1,5)} seconds`;
            return out;
        }
        
        if (cmd === 'sqlmap') {
            return `<span class="text-amber-400">___<br>__H__<br>___ ___[,]_____ ___ ___  {1.7.8#stable}<br>|_ -| . [']     | .'| . |<br>|___|_  [']_|_|_|__,|  _|<br>      |_|V...       |_|   https://sqlmap.org</span><br><br>[*] starting @ ${now()}<br>[+] fetching database names...<br>[*] information_schema<br>[*] <span class="text-emerald-400 font-bold">cyberspace_users</span><br>[*] ending @ ${now()}`;
        }
        
        if (cmd === 'hashcat') {
            return `Session..........: hashcat<br>Status...........: Cracked<br>Hash.Target......: hashes.txt<br><br><span class="text-emerald-400">5f4dcc3b5aa765d61d8327deb882cf99:<span class="text-red-400 font-bold">password</span></span><br>`;
        }
        
        return `bash: ${cmd}: command not found`;
    }
}


const shell = new ShellEngine();

document.getElementById('term-input').addEventListener('keypress', function(e) {
    if (e.key !== 'Enter') return;
    const raw = this.value.trim();
    if (!raw) return;
    
    const out = document.getElementById('term-output');
    const panel = document.getElementById('terminal-panel');

    // Echo command
    out.innerHTML += `<div class="mb-1">${shell.getPrompt()}<span class="text-white">${raw.replace(/</g,'&lt;')}</span></div>`;
    this.value = '';
    panel.scrollTop = panel.scrollHeight;

    const output = shell.execute(raw);

    // Simulate small execution delay for realism
    out.innerHTML += `<div class="text-gray-600 text-xs mb-1 loading-dots">▌</div>`;
    panel.scrollTop = panel.scrollHeight;
    
    setTimeout(() => {
        const loading = out.querySelector('.loading-dots');
        if (loading) loading.remove();
        
        if (output && output !== 'CLEAR_SIG') {
            out.innerHTML += `<div class="mb-3 text-xs leading-loose mono">${output}</div>`;
        } else if (output === 'CLEAR_SIG') {
            out.innerHTML = '';
        }
        document.getElementById('term-prompt').innerHTML = shell.getPrompt();
        panel.scrollTop = panel.scrollHeight;
    }, 150);
});

// Initialize prompt
document.addEventListener("DOMContentLoaded", () => {
    const promptElement = document.getElementById('term-prompt');
    if (promptElement) promptElement.innerHTML = shell.getPrompt();
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


// ═══════════════════════════════════════════════════════════
//  LIVE LEADERBOARD SIMULATION
// ═══════════════════════════════════════════════════════════
setInterval(() => {
    [1, 2, 3].forEach(id => {
        if (Math.random() > 0.7) {
            const el = document.getElementById('lb-score-' + id);
            if (el) {
                let current = parseInt(el.textContent.replace(/,/g, '').replace(' XP', ''));
                current += Math.floor(Math.random() * 15) * 10; // Add 0, 10, 20... 140 XP
                el.textContent = current.toLocaleString() + ' XP';
                
                // Add a flash effect
                el.style.color = '#fff';
                el.style.textShadow = '0 0 10px #10b981';
                setTimeout(() => {
                    el.style.color = '';
                    el.style.textShadow = '';
                }, 500);
            }
        }
    });
}, 3000);

