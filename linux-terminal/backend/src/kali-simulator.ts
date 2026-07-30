/**
 * KaliSimulator — Complete built-in Kali Linux terminal simulator.
 * Handles 200+ commands with realistic outputs. No API key required.
 */

function rnd(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomIp(): string {
  return `${rnd(['10','172','192'])}${rnd(['.168.','.16.','.0.'])}${Math.floor(Math.random()*254)+1}.${Math.floor(Math.random()*254)+1}`;
}

function randomMac(): string {
  return Array.from({length: 6}, () => Math.floor(Math.random()*256).toString(16).padStart(2,'0')).join(':');
}

// Simple string hash function to seed our pseudo-random generator
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// Pseudo-random generator based on seed
function seededRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

function nmapOutput(target: string, args: string): string {
  const seed = hashString(target);
  const allPorts = [
    { port: 21, state: 'open', service: 'ftp', version: 'vsftpd 3.0.3' },
    { port: 22, state: 'open', service: 'ssh', version: 'OpenSSH ' + (7 + Math.floor(seededRandom(seed+1)*3)) + '.9p1 Ubuntu' },
    { port: 23, state: 'open', service: 'telnet', version: 'Linux telnetd' },
    { port: 25, state: 'open', service: 'smtp', version: 'Postfix smtpd' },
    { port: 53, state: 'open', service: 'domain', version: 'ISC BIND 9.16.1' },
    { port: 80, state: 'open', service: 'http', version: seededRandom(seed+2) > 0.5 ? 'Apache httpd 2.4.52' : 'nginx 1.18.0' },
    { port: 110, state: 'open', service: 'pop3', version: 'Dovecot pop3d' },
    { port: 139, state: 'open', service: 'netbios-ssn', version: 'Samba smbd 4.6.2' },
    { port: 143, state: 'open', service: 'imap', version: 'Dovecot imapd' },
    { port: 443, state: 'open', service: 'https', version: seededRandom(seed+3) > 0.5 ? 'Apache httpd 2.4.52' : 'nginx 1.18.0' },
    { port: 445, state: 'open', service: 'microsoft-ds', version: 'Windows Server 2019 Standard' },
    { port: 3306, state: 'open', service: 'mysql', version: 'MySQL 8.0.' + Math.floor(seededRandom(seed+4)*40) },
    { port: 3389, state: 'open', service: 'ms-wbt-server', version: 'Microsoft Terminal Services' },
    { port: 8080, state: 'open', service: 'http-proxy', version: 'Apache Tomcat 9.0.85' },
  ];
  
  // Select between 2 and 6 open ports deterministically based on the target IP
  const numPorts = Math.floor(seededRandom(seed + 10) * 5) + 2;
  const activePorts: any[] = [];
  for (let i = 0; i < numPorts; i++) {
      const pIndex = Math.floor(seededRandom(seed + 20 + i) * allPorts.length);
      if (!activePorts.includes(allPorts[pIndex])) {
          activePorts.push(allPorts[pIndex]);
      }
  }
  activePorts.sort((a, b) => a.port - b.port);

  const startTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const mac = randomMac();
  
  let out = `\nStarting Nmap 7.94SVN ( https://nmap.org ) at ${startTime} EDT\n`;
  out += `Nmap scan report for ${target}\n`;
  out += `Host is up (0.${Math.floor(seededRandom(seed+5)*99)+10}s latency).\n`;
  
  if (args.includes('-sV') || args.includes('-A') || args.includes('-sC')) {
    out += `Not shown: ${1000 - activePorts.length} closed tcp ports (reset)\n`;
    out += `PORT      STATE    SERVICE     VERSION\n`;
    activePorts.forEach(p => {
      const portStr = `${p.port}/tcp`.padEnd(10);
      const stateStr = p.state.padEnd(9);
      const svcStr = p.service.padEnd(12);
      out += `${portStr}${stateStr}${svcStr}${p.version}\n`;
    });
    if (args.includes('-A')) {
      out += `\nOS detection performed. Please report any incorrect results at https://nmap.org/submit/ .\n`;
      out += `OS: ${seededRandom(seed+6) > 0.5 ? 'Linux 4.15 - 5.6' : 'Windows Server 2019 / 10.0 (Build 17763)'}\n`;
      out += `Network Distance: ${Math.floor(seededRandom(seed+7)*15)+1} hops\n`;
    }
  } else {
    out += `Not shown: ${1000 - activePorts.length} closed tcp ports (reset)\n`;
    out += `PORT      STATE    SERVICE\n`;
    activePorts.forEach(p => {
      out += `${String(p.port+'/tcp').padEnd(10)}${p.state.padEnd(9)}${p.service}\n`;
    });
  }
  
  out += `MAC Address: ${mac.toUpperCase()} (Unknown)\n`;
  out += `\nNmap done: 1 IP address (1 host up) scanned in ${(Math.random()*10+2).toFixed(2)} seconds\n`;
  return out;
}

function sqlmapOutput(args: string): string {
  const url = args.match(/-u ["']?([^\s"']+)/)?.[1] || 'http://target.com/vuln.php?id=1';
  const seed = hashString(url);
  const isVulnerable = seededRandom(seed) > 0.3;
  const dbType = seededRandom(seed+1) > 0.5 ? 'MySQL >= 5.0.12' : 'PostgreSQL';

  return `\n        ___
       __H__
 ___ ___[']_____ ___ ___  {1.8.2#stable}
|_ -| . [(]     | .'| . |
|___|_  [)]_|_|_|__,|  _|
      |_|V...       |_|   https://sqlmap.org

[!] legal disclaimer: Usage of sqlmap for attacking targets without prior mutual consent is illegal.

[*] starting @ ${new Date().toTimeString().substring(0,8)} /2024-01-15/

[INFO] testing connection to the target URL
[INFO] checking if the target is protected by some kind of WAF/IPS
[INFO] testing if the target URL content is stable
[INFO] target URL content is stable
[INFO] testing if GET parameter 'id' is dynamic
[INFO] GET parameter 'id' appears to be dynamic
${isVulnerable ? `[INFO] testing for SQL injection on GET parameter 'id'
[INFO] testing 'AND boolean-based blind - WHERE or HAVING clause'
[INFO] GET parameter 'id' is 'MySQL >= 5.1 AND error-based' injectable 
[INFO] the back-end DBMS is ${dbType}
[INFO] fetching banner
web server operating system: Linux Ubuntu
web application technology: Apache 2.4.52, PHP 8.1.2
back-end DBMS: ${dbType}` : `[WARNING] GET parameter 'id' does not appear to be injectable
[CRITICAL] all tested parameters do not appear to be injectable.`}

[*] ending @ ${new Date().toTimeString().substring(0,8)} /2024-01-15/
`;
}

function hydraOutput(args: string): string {
  const target = args.match(/(\d+\.\d+\.\d+\.\d+|[\w\-]+\.[\w]+)/)?.[0] || '192.168.1.1';
  const seed = hashString(target);
  const foundUser = seededRandom(seed) > 0.5 ? 'admin' : 'root';
  const foundPass = seededRandom(seed+1) > 0.5 ? 'password123' : 'admin123';
  
  return `Hydra v9.5 (c) 2023 by van Hauser/THC & David Maciejak - Please do not use in military or secret service organizations, or for illegal purposes

Hydra (https://github.com/vanhauser-thc/thc-hydra) starting @ ${new Date().toISOString().substring(0,19).replace('T', ' ')}
[DATA] max 16 tasks per 1 server, overall 16 tasks, 14344399 login tries (l:1/p:14344399), ~896525 tries per task
[DATA] attacking ssh://${target}:22/
[STATUS] 175.00 tries/min, 175 tries in 00:01h, 14344224 to do in 1366:07h, 16 active
${seededRandom(seed+2) > 0.3 ? `[22][ssh] host: ${target}   login: ${foundUser}   password: ${foundPass}\n1 of 1 target successfully completed, 1 valid password found` : `1 of 1 target successfully completed, 0 valid passwords found`}
Hydra (https://github.com/vanhauser-thc/thc-hydra) finished.\n`;
}

function gobusterOutput(args: string): string {
  const url = args.match(/-u\s+([^\s]+)/)?.[1] || 'http://target.com';
  const seed = hashString(url);
  return `
===============================================================
Gobuster v3.6
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:                     ${url}
[+] Method:                  GET
[+] Threads:                 10
[+] Wordlist:                /usr/share/wordlists/dirb/common.txt
[+] Negative Status codes:   404
[+] User Agent:              gobuster/3.6
[+] Timeout:                 10s
===============================================================
Starting gobuster in directory enumeration mode
===============================================================
/images               (Status: 301) [Size: 315] [--> ${url}/images/]
/index.php            (Status: 200) [Size: 1542]
/login.php            (Status: 200) [Size: 843]
${seededRandom(seed) > 0.5 ? `/admin                (Status: 301) [Size: 314] [--> ${url}/admin/]\n` : ''}${seededRandom(seed+1) > 0.3 ? `/config.php           (Status: 200) [Size: 0]\n` : ''}${seededRandom(seed+2) > 0.8 ? `/.git                 (Status: 301) [Size: 312] [--> ${url}/.git/]\n` : ''}/robots.txt           (Status: 200) [Size: 124]
===============================================================
Finished
===============================================================
`;
}

function niktoOutput(args: string): string {
  const url = args.match(/-h\s+([^\s]+)/)?.[1] || 'target.com';
  const seed = hashString(url);
  return `
- Nikto v2.5.0
---------------------------------------------------------------------------
+ Target IP:          ${Math.floor(seededRandom(seed+3)*255)}.${Math.floor(seededRandom(seed+4)*255)}.${Math.floor(seededRandom(seed+5)*255)}.${Math.floor(seededRandom(seed+6)*255)}
+ Target Hostname:    ${url}
+ Target Port:        80
+ Start Time:         ${new Date().toISOString().replace('T', ' ').substring(0, 19)}
---------------------------------------------------------------------------
+ Server: ${seededRandom(seed) > 0.5 ? 'Apache/2.4.52 (Ubuntu)' : 'nginx/1.18.0 (Ubuntu)'}
+ The anti-clickjacking X-Frame-Options header is not present.
+ The X-Content-Type-Options header is not set. This could allow the user agent to render the content of the site in a different fashion to the MIME type.
${seededRandom(seed+1) > 0.3 ? `+ /config.php: PHP config file may contain database IDs and passwords.\n` : ''}${seededRandom(seed+2) > 0.5 ? `+ /admin/: This might be interesting...\n` : ''}+ /robots.txt: contains 2 entries which should be manually viewed.
+ 8923 requests: 0 error(s) and 3 item(s) reported on remote host
+ End Time:           ${new Date(Date.now() + 15000).toISOString().replace('T', ' ').substring(0, 19)} (15 seconds)
---------------------------------------------------------------------------
+ 1 host(s) tested
`;
}

function metasploitOutput(args: string): string {
  if (!args || args.trim() === '') {
    return `
       =[ metasploit v6.3.44-dev                          ]
+ -- --=[ 2375 exploits - 1232 auxiliary - 417 post       ]
+ -- --=[ 1396 payloads - 46 encoders - 11 nops           ]
+ -- --=[ 9 evasion                                        ]

Metasploit tip: Use the analyze command to suggest runnable modules for hosts

msf6 > \n`;
  }
  return `[*] Module executed. See 'show options' for configuration.\n`;
}

function aircrackOutput(args: string): string {
  return `
                                                                   Aircrack-ng 1.7

      [00:00:52] 98765/14344392 keys tested (1820.05 k/s)

      Time left: 2 hours, 11 minutes, 44 seconds                          0.69%

                           KEY FOUND! [ rockyou ]

      Master Key     : C4 1A A7 A1 6F 3A 2E 43 BB E1 29 A3 18 0D 1F 98
                       B7 9F 61 40 42 C0 37 95 0F 22 04 1F 61 C4 48 1A

      Transient Key  : 06 7A 67 72 E3 85 C0 45 3E 47 19 F1 0F D5 6C 63
                       5E 1A B0 1D A7 44 A3 BC 60 F0 6D 45 23 1F 6F 01

      EAPOL HMAC     : 4C 29 3D FA D5 79 36 04 6E 7E 3B E1 3D 78 00 C5\n`;
}

function hashcatOutput(args: string): string {
  return `hashcat (v6.2.6) starting in auto-detect mode...

* Device #1: NVIDIA GeForce RTX 3080, 9596/10018 MB, 68MCU

Hashes: 1 digests; 1 unique digests, 1 unique salts
Bitmaps: 16 bits, 65536 entries, 0x0000ffff mask, 262144 bytes, 5/13 rotates
Rules: 1

Optimizers applied:
* Zero-Byte
* Early-Skip
* Scalar

ATTENTION! Pure (unoptimized) backend kernels selected.

Dictionary cache built:
* Filename..: /usr/share/wordlists/rockyou.txt
* Passwords.: 14344392
* Bytes.....: 139921497
* Keyspace..: 14344385
* Runtime...: 1 secs

5f4dcc3b5aa765d61d8327deb882cf99:password

Session..........: hashcat
Status...........: Cracked
Hash.Mode........: 0 (MD5)
Hash.Target......: 5f4dcc3b5aa765d61d8327deb882cf99
Time.Started.....: ${new Date().toISOString().replace('T',' ').substring(0,19)}
Time.Estimated...: Now
Kernel.Feature...: Pure Kernel
Guess.Base.......: File (/usr/share/wordlists/rockyou.txt)
Guess.Queue......: 1/1 (100.00%)
Speed.#1.........:  9134.0 MH/s
Recovered........: 1/1 (100.00%) Digests
Started: ${new Date().toISOString().replace('T',' ').substring(0,19)}
Stopped: ${new Date().toISOString().replace('T',' ').substring(0,19)}\n`;
}

function whoisOutput(target: string): string {
  return `Domain Name: ${target.toUpperCase()}
Registry Domain ID: 2138514_DOMAIN_COM-VRSN
Registrar WHOIS Server: whois.registrar.amazon.com
Registrar URL: http://registrar.amazon.com
Updated Date: 2023-11-10T09:00:00Z
Creation Date: 2021-03-12T12:00:00Z
Registry Expiry Date: 2025-03-12T12:00:00Z
Registrar: Amazon Registrar, Inc.
Registrant Organization: Amazon Technologies, Inc.
Registrant State/Province: WA
Registrant Country: US
Name Server: NS1.AMAZONAWS.COM
Name Server: NS2.AMAZONAWS.COM
DNSSEC: unsigned\n`;
}

function digOutput(target: string): string {
  return `
; <<>> DiG 9.18.28-0ubuntu0.22.04.1-Ubuntu <<>> ${target}
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 41823
;; flags: qr rd ra; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 1

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 65494
;; QUESTION SECTION:
;${target}.			IN	A

;; ANSWER SECTION:
${target}.		60	IN	A	${randomIp()}

;; Query time: 23 msec
;; SERVER: 8.8.8.8#53(8.8.8.8)
;; WHEN: ${new Date().toUTCString()}
;; MSG SIZE  rcvd: 62\n`;
}

function curlOutput(args: string): string {
  const url = args.split(' ').find(a => a.startsWith('http')) || 'http://example.com';
  return `<!DOCTYPE html>
<html>
<head><title>Example Domain</title></head>
<body>
<h1>Example Domain</h1>
<p>This domain is for use in illustrative examples in documents. You may use this domain in literature without prior coordination or asking for permission.</p>
</body>
</html>\n`;
}

function wgetOutput(args: string): string {
  const url = args.split(' ').find(a => a.startsWith('http')) || 'http://example.com/file.zip';
  const filename = url.split('/').pop() || 'index.html';
  const size = Math.floor(Math.random() * 5000000) + 100000;
  return `--${new Date().toISOString().replace('T',' ').substring(0,19)}--  ${url}
Resolving ${new URL(url).hostname}... ${randomIp()}
Connecting to ${new URL(url).hostname}|${randomIp()}|:80... connected.
HTTP request sent, awaiting response... 200 OK
Length: ${size} (${(size/1048576).toFixed(1)}M) [application/zip]
Saving to: '${filename}'

${filename}           100%[===================>] ${(size/1048576).toFixed(1)}M  2.45MB/s    in 2.5s

${new Date().toISOString().replace('T',' ').substring(0,19)} (${(size/2500000).toFixed(2)} MB/s) - '${filename}' saved [${size}/${size}]\n`;
}

function pingOutput(target: string): string {
  const ip = randomIp();
  return `PING ${target} (${ip}) 56(84) bytes of data.
64 bytes from ${target} (${ip}): icmp_seq=1 ttl=57 time=${(Math.random()*50+5).toFixed(1)} ms
64 bytes from ${target} (${ip}): icmp_seq=2 ttl=57 time=${(Math.random()*50+5).toFixed(1)} ms
64 bytes from ${target} (${ip}): icmp_seq=3 ttl=57 time=${(Math.random()*50+5).toFixed(1)} ms
64 bytes from ${target} (${ip}): icmp_seq=4 ttl=57 time=${(Math.random()*50+5).toFixed(1)} ms

--- ${target} ping statistics ---
4 packets transmitted, 4 received, 0% packet loss, time 3004ms
rtt min/avg/max/mdev = 12.345/23.456/45.678/10.234 ms\n`;
}

function aptOutput(pkg: string, action: string): string {
  if (action === 'update') {
    return `Get:1 http://kali.download/kali kali-rolling InRelease [41.5 kB]
Get:2 http://kali.download/kali kali-rolling/main amd64 Packages [19.8 MB]
Get:3 http://kali.download/kali kali-rolling/contrib amd64 Packages [109 kB]
Get:4 http://kali.download/kali kali-rolling/non-free amd64 Packages [198 kB]
Fetched 20.1 MB in 8s (2,519 kB/s)
Reading package lists... Done
Building dependency tree... Done
Reading state information... Done
All packages are up to date.\n`;
  }
  const size = Math.floor(Math.random() * 50000) + 1000;
  return `Reading package lists... Done
Building dependency tree... Done
Reading state information... Done
The following additional packages will be installed:
  lib${pkg} lib${pkg}-dev python3-${pkg}
Suggested packages:
  ${pkg}-doc ${pkg}-examples
The following NEW packages will be installed:
  ${pkg} lib${pkg} lib${pkg}-dev python3-${pkg}
0 upgraded, 4 newly installed, 0 to remove and 0 not upgraded.
Need to get ${size} kB of archives.
After this operation, ${size * 4} kB of additional disk space will be used.
Get:1 http://kali.download/kali kali-rolling/main amd64 ${pkg} amd64 1.0-${Math.floor(Math.random()*9)+1}kali1 [${size} kB]
Fetched ${size} kB in 2s (${Math.floor(size/2)} kB/s)
Selecting previously unselected package ${pkg}.
(Reading database ... 432156 files and directories currently installed.)
Preparing to unpack .../archives/${pkg}_1.0-1kali1_amd64.deb ...
Unpacking ${pkg} (1.0-1kali1) ...
Setting up ${pkg} (1.0-1kali1) ...
Processing triggers for man-db (2.11.2-3) ...
${pkg} has been installed successfully.\n`;
}

export class KaliSimulator {
  private cwd: string = '/root';
  private env: Record<string, string> = {
    HOME: '/root', USER: 'root', SHELL: '/bin/bash',
    PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
    TERM: 'xterm-256color', LANG: 'en_US.UTF-8',
  };
  private files: Record<string, string> = {
    '/root/.bashrc': '# ~/.bashrc: executed by bash(1) for non-login shells.\nexport PS1="\\u@\\h:\\w\\$ "\nalias ll="ls -la"\nalias la="ls -A"',
    '/etc/hostname': 'kali',
    '/etc/os-release': 'NAME="Kali GNU/Linux"\nVERSION="2024.1"\nID=kali\nID_LIKE=debian\nPRETTY_NAME="Kali GNU/Linux Rolling"\nVERSION_ID="2024.1"\nHOME_URL="https://www.kali.org/"\nSUPPORT_URL="https://forums.kali.org/"',
    '/etc/passwd': 'root:x:0:0:root:/root:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin\nwww-data:x:33:33:www-data:/var/www:/usr/sbin/nologin',
    '/root/.bash_history': 'nmap -sV 192.168.1.1\napt update\nmsfconsole\n',
  };
  private installedTools: Set<string> = new Set([
    'nmap','metasploit','msfconsole','sqlmap','hydra','aircrack-ng','john','hashcat',
    'nikto','gobuster','dirb','wfuzz','burpsuite','wireshark','netcat','nc',
    'curl','wget','git','python3','pip3','ssh','netstat','ifconfig','ip',
    'ls','cat','echo','pwd','whoami','id','uname','hostname','date','ps',
    'grep','find','chmod','chown','mkdir','rm','cp','mv','touch','nano','vi',
    'ping','dig','whois','traceroute','arp','route','ss','lsof',
    'tcpdump','masscan','dnsenum','dnsrecon','fierce','sublist3r',
    'wpscan','joomscan','skipfish','w3af','beef-xss','setoolkit','social-engineer',
    'john','crunch','cewl','medusa','patator','crackmapexec','impacket',
    'responder','bettercap','ettercap','arpspoof','dsniff',
    'volatility','autopsy','foremost','binwalk','exiftool','strings',
  ]);

  getCwd(): string { return this.cwd; }

  getMotd(): string {
    const G = '\x1b[38;5;82m';
    const P = '\x1b[38;5;141m';
    const D = '\x1b[38;5;245m';
    const R = '\x1b[0m';
    const n = '\r\n';
    const count = this.installedTools.size;
    const lines = [
      '',
      `${G}  +============================================================+${R}`,
      `${G}  |${R}  ${G} ######  ##  ## ######  ###### ######  ######${R}            ${G}|${R}`,
      `${G}  |${R}  ${G}##      ##  ## ##  ##  ##      ##  ##  ##    ${R}            ${G}|${R}`,
      `${G}  |${R}  ${G}##       ####  ######  ####    ######  ######${R}            ${G}|${R}`,
      `${G}  |${R}  ${G}##      ##  ## ##  ##  ##      ##  ##       ##${R}           ${G}|${R}`,
      `${G}  |${R}  ${G} ######  ##  ## ##  ##  ###### ##  ##  ######${R}            ${G}|${R}`,
      `${G}  +============================================================+${R}`,
      `${G}  |${R}  ${P}  CYBERSPACE -- Kali Linux Terminal  v2024.1${R}              ${G}|${R}`,
      `${G}  |${R}  ${D}  ${count}+ tools available  --  Type 'help' for command list${R}   ${G}|${R}`,
      `${G}  +============================================================+${R}`,
      '',
      '',
    ];
    return lines.join(n);
  }

  unknownCommand(cmd: string): string {
    const base = cmd.split(' ')[0];
    const target = cmd.split(' ')[1] || 'target';
    
    // Dynamically simulate any unknown command to feel like a real tool
    return `
[+] Starting ${base} v2.4.1 ( https://${base}.org )
[+] Initializing modules and loading configurations...
[i] Target: ${target}
[i] Execution started at ${new Date().toISOString().replace('T', ' ').substring(0, 19)}

[*] Performing analysis...
[+] 3 modules loaded.
[+] Progress: [===================>] 100%

[i] Results for ${base} scan:
 - No critical vulnerabilities found in standard paths.
 - Execution time: ${(Math.random() * 5 + 1).toFixed(2)} seconds.

[+] ${base} completed successfully.
`;
  }

  execute(fullCmd: string): string | null {
    // Handle pipes (basic support — run first command only, note output piped)
    const pipeIndex = fullCmd.indexOf(' | ');
    let cmd = fullCmd;
    let piped = '';
    if (pipeIndex > -1) {
      cmd = fullCmd.substring(0, pipeIndex);
      piped = fullCmd.substring(pipeIndex + 3);
    }

    const parts = cmd.trim().split(/\s+/);
    const base = parts[0];
    const args = parts.slice(1).join(' ');

    // Redirect handling
    const redir = cmd.match(/>>?\s+(\S+)/);
    const outFile = redir?.[1];

    let result = this.dispatch(base, args, parts.slice(1));

    if (result === null) return null;

    // Grep pipe simulation
    if (piped && result !== null) {
      const grepMatch = piped.match(/^grep\s+(-\w+\s+)?["']?([^"']+)["']?/);
      if (grepMatch) {
        const pattern = grepMatch[2];
        result = result.split('\n').filter(l => l.includes(pattern)).join('\n');
      }
    }

    // Write to file
    if (outFile && result !== null) {
      const absPath = outFile.startsWith('/') ? outFile : `${this.cwd}/${outFile}`;
      if (cmd.includes('>>')) {
        this.files[absPath] = (this.files[absPath] || '') + result;
      } else {
        this.files[absPath] = result;
      }
      return '';
    }

    return result;
  }

  private dispatch(base: string, args: string, parts: string[]): string | null {
    switch (base) {
      // ── Navigation ─────────────────────────────────────────────
      case 'cd': {
        const target = parts[0] || '~';
        if (target === '~' || target === '') { this.cwd = '/root'; }
        else if (target === '-') { /* keep */ }
        else if (target === '..') {
          const p = this.cwd.split('/').filter(Boolean); p.pop();
          this.cwd = '/' + p.join('/') || '/';
        } else if (target.startsWith('/')) { this.cwd = target; }
        else { this.cwd = (this.cwd === '/' ? '' : this.cwd) + '/' + target; }
        return '';
      }
      case 'pwd': return this.cwd + '\n';

      // ── File system ─────────────────────────────────────────────
      case 'ls': {
        const dir = this.cwd.toLowerCase();
        const longFlag = args.includes('-l') || args.includes('-la') || args.includes('-al');
        const allFlag = args.includes('-a') || args.includes('-la') || args.includes('-al');
        
        let files = [ { n: '.', t: 'dir', s: 4096 }, { n: '..', t: 'dir', s: 4096 } ];
        
        if (dir === '/root' || dir === '/root/') {
            files.push(
              { n: '.bashrc', t: 'file', s: 3526 }, { n: '.bash_history', t: 'file', s: 178 },
              { n: '.profile', t: 'file', s: 807 }, { n: 'Desktop', t: 'dir', s: 4096 },
              { n: 'Documents', t: 'dir', s: 4096 }, { n: 'Downloads', t: 'dir', s: 4096 },
              { n: 'tools', t: 'dir', s: 4096 }, { n: 'wordlists', t: 'dir', s: 4096 }
            );
        } else if (dir.includes('/downloads')) {
            files.push(
              { n: 'LinEnum.sh', t: 'file', s: 45210 },
              { n: 'linpeas.sh', t: 'file', s: 820120 },
              { n: 'nmap_scan_results.xml', t: 'file', s: 1420 }
            );
        } else if (dir.includes('/tools')) {
            files.push(
              { n: 'nmap', t: 'dir', s: 4096 },
              { n: 'sqlmap', t: 'dir', s: 4096 },
              { n: 'john', t: 'dir', s: 4096 }
            );
        } else if (dir.includes('/wordlists')) {
            files.push(
              { n: 'rockyou.txt', t: 'file', s: 139921497 },
              { n: 'dirb', t: 'dir', s: 4096 },
              { n: 'seclists', t: 'dir', s: 4096 }
            );
        }

        const visible = allFlag ? files : files.filter(f => !f.n.startsWith('.'));
        
        if (visible.length === 0) return '';
        
        if (longFlag) {
          let out = `total ${files.length * 8}\n`;
          visible.forEach(f => {
            const perm = f.t === 'dir' ? 'drwxr-xr-x' : '-rw-r--r--';
            const color = f.t === 'dir' ? '\x1b[38;5;81m' : '\x1b[0m';
            out += `${perm}  2 root root ${String(f.s).padStart(5)} Jan 15 14:${String(Math.floor(Math.random()*60)).padStart(2,'0')} ${color}${f.n}\x1b[0m\n`;
          });
          return out;
        }
        return visible.map(f => f.t === 'dir' ? `\x1b[38;5;81m${f.n}\x1b[0m` : f.n).join('  ') + '\n';
      }

      case 'cat': {
        if (!parts[0]) return 'cat: missing operand\n';
        const path = parts[0].startsWith('/') ? parts[0] : `${this.cwd}/${parts[0]}`;
        const content = this.files[path];
        if (content !== undefined) return content + '\n';
        // Generate content based on common paths
        if (path.includes('passwd')) return this.files['/etc/passwd'] + '\n';
        if (path.includes('hostname')) return 'kali\n';
        if (path.includes('os-release')) return this.files['/etc/os-release'] + '\n';
        return `cat: ${parts[0]}: No such file or directory\n`;
      }

      case 'echo': {
        const text = args.replace(/^["']|["']$/g, '').replace(/\$HOME/g, '/root').replace(/\$USER/g, 'root').replace(/\$PWD/g, this.cwd);
        return text + '\n';
      }

      case 'mkdir': return parts[0] ? '' : 'mkdir: missing operand\n';
      case 'touch': return '';
      case 'rm': return '';
      case 'cp': return '';
      case 'mv': return '';
      case 'chmod': return '';
      case 'chown': return '';

      case 'find': {
        return `/root/Documents/notes.txt\n/root/Downloads/report.pdf\n/root/tools/custom.py\n`;
      }

      case 'grep': {
        if (parts.length < 2) return '';
        return `${parts[parts.length-1]}:42:  match for "${parts[0]}"\n`;
      }

      case 'head': return `Line 1\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6\nLine 7\nLine 8\nLine 9\nLine 10\n`;
      case 'tail': return `Line 91\nLine 92\nLine 93\nLine 94\nLine 95\nLine 96\nLine 97\nLine 98\nLine 99\nLine 100\n`;
      case 'wc': return `     42     156     892 ${parts[0] || '-'}\n`;
      case 'sort': return `alpha\nbeta\ngamma\ndelta\n`;
      case 'uniq': return args + '\n';
      case 'awk': return `output\n`;
      case 'sed': return `processed output\n`;
      case 'cut': return `field1\nfield2\n`;

      // ── System info ─────────────────────────────────────────────
      case 'whoami': return 'root\n';
      case 'id': return 'uid=0(root) gid=0(root) groups=0(root)\n';
      case 'hostname': return 'kali\n';
      case 'uname': {
        if (args.includes('-a')) return 'Linux kali 6.6.9-amd64 #1 SMP PREEMPT_DYNAMIC Kali 6.6.9-1kali1 (2024-01-08) x86_64 GNU/Linux\n';
        return 'Linux\n';
      }
      case 'date': return new Date().toString() + '\n';
      case 'uptime': return ` ${new Date().toTimeString().substring(0,8)} up 2 days,  7:23,  1 user,  load average: 0.52, 0.48, 0.45\n`;
      case 'w': return ` ${new Date().toTimeString().substring(0,8)} up 2 days,  7:23,  1 user,  load average: 0.52, 0.48, 0.45\nUSER     TTY      FROM             LOGIN@   IDLE JCPU   PCPU WHAT\nroot     pts/0    192.168.1.100    10:00    0.00s  0.05s  0.00s w\n`;
      case 'env': return Object.entries(this.env).map(([k,v]) => `${k}=${v}`).join('\n') + '\n';
      case 'export': {
        const [k, v] = args.split('=');
        if (k && v) this.env[k] = v;
        return '';
      }
      case 'history': return Array.from({length: 20}, (_, i) => `  ${i+1}  ${['ls -la','nmap -sV 192.168.1.1','cd /tmp','cat /etc/passwd','python3 exploit.py','msfconsole','sqlmap -u http://target.com/vuln.php?id=1','hydra -l admin -P wordlist.txt ssh://192.168.1.1'][Math.floor(Math.random()*8)]}`).join('\n') + '\n';

      case 'ps': {
        if (args.includes('aux') || args.includes('-aux')) {
          return `USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND\nroot         1  0.0  0.1  167936 11088 ?        Ss   Jan15   0:07 /sbin/init\nroot       512  0.0  0.2  23540  8192 ?        Ss   Jan15   0:00 /usr/sbin/sshd\nroot      1024  0.0  0.1  22544  5120 pts/0    Ss   14:00   0:00 bash\nroot      2048  0.0  0.0  17516  2048 pts/0    R+   14:01   0:00 ps aux\n`;
        }
        return `  PID TTY          TIME CMD\n 1024 pts/0    00:00:00 bash\n 2048 pts/0    00:00:00 ps\n`;
      }
      case 'kill': return '';
      case 'top': return `top - ${new Date().toTimeString().substring(0,8)} up 2 days,  7:23,  1 user,  load average: 0.52, 0.48, 0.45\nTasks: 142 total,   1 running, 141 sleeping,   0 stopped,   0 zombie\n%Cpu(s):  2.3 us,  0.8 sy,  0.0 ni, 96.7 id,  0.2 wa,  0.0 hi,  0.0 si,  0.0 st\nMiB Mem :   7953.8 total,   2134.2 free,   3821.4 used,   1998.2 buff/cache\n\nPress Ctrl+C to exit.\n`;

      // ── Disk / Memory ─────────────────────────────────────────
      case 'df': return `Filesystem      Size  Used Avail Use% Mounted on\n/dev/sda1        50G   18G   30G  38% /\ntmpfs           3.9G     0  3.9G   0% /dev/shm\n/dev/sda2       200G  120G   80G  60% /home\n`;
      case 'du': return `4.0K\t./Desktop\n8.0K\t./Downloads\n12K\t./tools\n24K\t.\n`;
      case 'free': return `              total        used        free      shared  buff/cache   available\nMem:        8142336     3912704     2183168      286720     2046464     3654656\nSwap:       2097152           0     2097152\n`;
      case 'lsblk': return `NAME   MAJ:MIN RM  SIZE RO TYPE MOUNTPOINTS\nsda      8:0    0   50G  0 disk\n├─sda1   8:1    0   49G  0 part /\n└─sda2   8:2    0    1G  0 part [SWAP]\n`;
      case 'mount': return `/dev/sda1 on / type ext4 (rw,relatime,errors=remount-ro)\ntmpfs on /dev/shm type tmpfs (rw,nosuid,nodev)\n`;

      // ── Network ─────────────────────────────────────────────────
      case 'ifconfig': {
        const ip = '192.168.1.' + (Math.floor(Math.random()*200)+50);
        return `eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500\n        inet ${ip}  netmask 255.255.255.0  broadcast 192.168.1.255\n        inet6 fe80::a00:27ff:fe4e:66a1  prefixlen 64  scopeid 0x20<link>\n        ether ${randomMac()}  txqueuelen 1000  (Ethernet)\n        RX packets 12847  bytes 8392934 (8.0 MiB)\n        TX packets 8291  bytes 1893729 (1.8 MiB)\n\nlo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536\n        inet 127.0.0.1  netmask 255.0.0.0\n        loop  txqueuelen 1000  (Local Loopback)\n`;
      }
      case 'ip': {
        const ip = '192.168.1.' + (Math.floor(Math.random()*200)+50);
        if (args.includes('addr') || args.includes('a')) return `1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN\n    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00\n    inet 127.0.0.1/8 scope host lo\n2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP\n    link/ether ${randomMac()} brd ff:ff:ff:ff:ff:ff\n    inet ${ip}/24 brd 192.168.1.255 scope global eth0\n`;
        if (args.includes('route') || args.includes('r')) return `default via 192.168.1.1 dev eth0 proto dhcp src ${ip} metric 100\n192.168.1.0/24 dev eth0 proto kernel scope link src ${ip}\n`;
        return '';
      }
      case 'netstat': return `Active Internet connections (servers and established)\nProto Recv-Q Send-Q Local Address           Foreign Address         State\ntcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN\ntcp        0      0 127.0.0.1:3306          0.0.0.0:*               LISTEN\n`;
      case 'ss': return `Netid State  Recv-Q Send-Q Local Address:Port   Peer Address:Port\ntcp   LISTEN 0      128    0.0.0.0:22          0.0.0.0:*\ntcp   LISTEN 0      80     127.0.0.1:3306      0.0.0.0:*\n`;
      case 'arp': return `Address                  HWtype  HWaddress           Flags Mask            Iface\n192.168.1.1              ether   ${randomMac()}   C                     eth0\n192.168.1.100            ether   ${randomMac()}   C                     eth0\n`;
      case 'route': return `Kernel IP routing table\nDestination     Gateway         Genmask         Flags Metric Ref    Use Iface\ndefault         192.168.1.1     0.0.0.0         UG    100    0        0 eth0\n192.168.1.0     0.0.0.0         255.255.255.0   U     0      0        0 eth0\n`;
      case 'lsof': return `COMMAND   PID USER   FD   TYPE DEVICE SIZE/OFF NODE NAME\nbash     1024 root  cwd    DIR    8,1     4096    2 /root\nbash     1024 root  txt    REG    8,1  1183448 2048 /usr/bin/bash\n`;

      case 'ping': {
        const target = parts[0] || 'localhost';
        return pingOutput(target);
      }
      case 'traceroute': {
        const target = parts[0] || 'google.com';
        let out = `traceroute to ${target} (${randomIp()}), 30 hops max, 60 byte packets\n`;
        for (let i = 1; i <= 8; i++) {
          out += ` ${i}  ${randomIp()}  ${(Math.random()*10+1).toFixed(3)} ms  ${(Math.random()*10+1).toFixed(3)} ms  ${(Math.random()*10+1).toFixed(3)} ms\n`;
        }
        return out;
      }
      case 'dig': return digOutput(parts[0] || 'example.com');
      case 'whois': return whoisOutput(parts[0] || 'example.com');
      case 'curl': return curlOutput(args);
      case 'wget': return wgetOutput(args);
      case 'nc': case 'netcat': {
        if (args.includes('-z')) return `Connection to ${parts.find(p => /\d/.test(p)) || 'host'} port ${parts[parts.length-1]} [tcp/*] succeeded!\n`;
        return 'Listening on 0.0.0.0 4444\n';
      }
      case 'ssh': return `Welcome to Ubuntu 22.04.3 LTS (GNU/Linux 5.15.0-91-generic x86_64)\nLast login: Mon Jan 15 09:12:33 2024 from 192.168.1.50\n$ `;

      // ── Kali Tools ──────────────────────────────────────────────
      case 'nmap': return nmapOutput(parts.find(p => /[\d\.]/.test(p) || p.includes('.com')) || '192.168.1.1', args);
      case 'sqlmap': return sqlmapOutput(args);
      case 'hydra': return hydraOutput(args);
      case 'gobuster': return gobusterOutput(args);
      case 'nikto': return niktoOutput(args);
      case 'msfconsole': case 'metasploit': return metasploitOutput(args);
      case 'aircrack-ng': return aircrackOutput(args);
      case 'hashcat': return hashcatOutput(args);
      case 'john': return `Created directory: /root/.john\nWarning: detected hash type "md5crypt"\nUsing default input encoding: UTF-8\nLoaded 1 password hash (md5crypt, crypt(3) $1$ (and variants) [MD5 512/512 AVX512BW 16x3])\nPress 'q' or Ctrl-C to abort, almost any other key for status\npassword123      (admin)\n1g 0:00:00:04 DONE 2/3 (2024-01-15 14:42) 0.2469g/s 3564p/s 3564c/s 3564C/s\nUse the "--show --format=md5crypt" options to display all of the cracked passwords reliably\nSession completed.\n`;
      
      case 'dirb': return `\n-----------------\nDIRB v2.22    \nBy The Dark Raver\n-----------------\n\nSTART_TIME: Mon Jan 15 14:42:00 2024\nURL_BASE: http://target.com/\nWORDLIST_FILES: /usr/share/dirb/wordlists/common.txt\n\n-----------------\n\nGENERATED WORDS: 4612\n\n---- Scanning URL: http://target.com/ ----\n+ http://target.com/admin (CODE:301|SIZE:315)\n+ http://target.com/login (CODE:200|SIZE:3281)\n+ http://target.com/index.php (CODE:200|SIZE:10918)\n\n-----------------\nEND_TIME: Mon Jan 15 14:42:45 2024\nDOWNLOADED: 4612 - FOUND: 3\n`;
      
      case 'masscan': return `Starting masscan 1.3.2 (http://bit.ly/14GZzcT) at 2024-01-15 14:42:00 GMT\nInitiating SYN Stealth Scan\nScanning 1 hosts [65536 ports/host]\nDiscovered open port 22/tcp on ${parts.find(p => /\d+\.\d+/.test(p)) || '192.168.1.1'}\nDiscovered open port 80/tcp on ${parts.find(p => /\d+\.\d+/.test(p)) || '192.168.1.1'}\nDiscovered open port 443/tcp on ${parts.find(p => /\d+\.\d+/.test(p)) || '192.168.1.1'}\n`;
      
      case 'dnsenum': return `dnsenum VERSION:1.2.6\n\nHost's addresses:\nexample.com.  300 IN A ${randomIp()}\n\nName Servers:\nns1.example.com. 300 IN A ${randomIp()}\nns2.example.com. 300 IN A ${randomIp()}\n\nMail Servers:\nmail.example.com. 300 IN A ${randomIp()}\n`;
      
      case 'tcpdump': return `tcpdump: verbose output suppressed, use -v[v]... for full protocol decode\nlistening on eth0, link-type EN10MB (Ethernet), snapshot length 262144 bytes\n14:42:01.123456 IP 192.168.1.50.54312 > ${randomIp()}.80: Flags [S], seq 1234567890\n14:42:01.145678 IP ${randomIp()}.80 > 192.168.1.50.54312: Flags [S.], seq 987654321\n^C\n2 packets captured\n2 packets received by filter\n0 packets dropped by kernel\n`;
      
      case 'wpscan': return `\n\e[34m[i]\e[0m It seems like you have not updated the database for some time.\n\n\e[32m[+]\e[0m URL: http://target.com/ [200]\n\e[32m[+]\e[0m Started: Mon Jan 15 14:42:00 2024\n\n[+] WordPress version 6.4.2 identified\n[+] WordPress theme in use: twentytwentythree v1.3\n[+] Enumerating All Plugins:\n[+] Checking Plugin Versions\n[i] Plugin(s) Identified:\n[+] akismet - v5.3\n[+] contact-form-7 - v5.8.2 (Vulnerability found!)\n\nFinished: Mon Jan 15 14:42:45 2024\nRequests Done: 1427\nRequests Cached: 0\nData Sent: 378.208 KB\nData Received: 1.264 MB\n`;

      case 'cewl': return `CeWL 6.1 (Max Length) Robin Wood (robin@digi.ninja)\nwelcome\nlogin\nadmin\npassword\nusername\nemail\nsupport\nhome\ncontact\nabout\n`;
      
      case 'crunch': return `Crunch will now generate the following amount of data: 204800 bytes\n200 KB\n0 MB\n0 GB\n0 TB\n0 PB\nCrunch will now generate the following number of lines: 20480\naaa\naab\naac\naad\n...\nGenerating wordlist complete.\n`;

      case 'responder': return `[+] Poisoners:\n    LLMNR                      [ON]\n    NBT-NS                     [ON]\n    MDNS                       [ON]\n[+] Servers:\n    HTTP server                [ON]\n    HTTPS server               [ON]\n    SMB server                 [ON]\n[+] HTTP Options:\n    Always serving EXE         [OFF]\n    Serving EXE                [OFF]\n    Serving HTML               [OFF]\n    Upstream Proxy             [OFF]\n[*] Current Session Variables:\n    Responder Machine Name     [WIN-KALI]\n    Responder Domain Name      [KALI]\n[+] Listening for events...\n[SMB] NTLMv2-SSP Client : 192.168.1.100\n[SMB] NTLMv2-SSP Hash   : admin::WORKGROUP:1234567890abcdef:...\n`;

      // ── Package management ─────────────────────────────────────
      case 'apt': case 'apt-get': {
        const subcmd = parts[0];
        const pkg = parts[1] || '';
        if (subcmd === 'update') return aptOutput('', 'update');
        if (subcmd === 'upgrade') return `Reading package lists... Done\nBuilding dependency tree... Done\n0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.\n`;
        if (subcmd === 'install' && pkg) {
          if (this.installedTools.has(pkg)) {
            return `Reading package lists... Done\nBuilding dependency tree... Done\nReading state information... Done\n${pkg} is already the newest version (1.0-1kali1).\n0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.\n`;
          }
          this.installedTools.add(pkg);
          return aptOutput(pkg, 'install');
        }
        if (subcmd === 'remove' || subcmd === 'purge') return `Removing ${pkg} ...\nPurging configuration files for ${pkg} ...\n`;
        if (subcmd === 'search') return `${pkg}/kali-rolling 1.0-1kali1 amd64\n  ${pkg} - Security tool for penetration testing\n`;
        if (subcmd === 'show') return `Package: ${pkg}\nVersion: 1.0-1kali1\nSection: net\nDescription: ${pkg} - Powerful security auditing tool\n`;
        return aptOutput(pkg, subcmd);
      }
      case 'pip3': case 'pip': {
        const subcmd = parts[0];
        const pkg = parts[1] || '';
        if (subcmd === 'install') return `Collecting ${pkg}\n  Downloading ${pkg}-1.0.0-py3-none-any.whl (512 kB)\nInstalling collected packages: ${pkg}\nSuccessfully installed ${pkg}-1.0.0\n`;
        if (subcmd === 'list') return `Package    Version\n---------- -------\npip        24.0\nsetuptools 69.0.3\nrequests   2.31.0\ncryptography 42.0.2\nparamiko   3.4.0\nimpacket   0.11.0\n`;
        return '';
      }

      // ── Python / scripting ─────────────────────────────────────
      case 'python3': case 'python': {
        if (args.startsWith('-c')) {
          const code = args.replace(/^-c\s+/, '').replace(/^["']|["']$/g, '');
          if (code.includes('print(')) {
            const match = code.match(/print\(["'](.+?)["']\)/);
            if (match) return match[1] + '\n';
            if (code.includes('+')) return 'result\n';
            return '\n';
          }
          return '\n';
        }
        if (args.trim()) return `Executing ${args}...\nScript completed successfully.\n`;
        return `Python 3.11.8 (main, Feb 12 2024, 14:50:05) [GCC 13.2.0] on linux\nType "help", "copyright", "credits" or "license" for more information.\n>>> `;
      }

      case 'git': {
        if (parts[0] === 'clone') {
          const url = parts[1] || 'repo';
          const name = url.split('/').pop()?.replace('.git','') || 'repo';
          return `Cloning into '${name}'...\nremote: Enumerating objects: 142, done.\nremote: Counting objects: 100% (142/142), done.\nremote: Compressing objects: 100% (89/89), done.\nReceiving objects: 100% (142/142), 2.34 MiB | 3.12 MiB/s, done.\nResolving deltas: 100% (48/48), done.\n`;
        }
        if (parts[0] === 'status') return `On branch main\nYour branch is up to date with 'origin/main'.\nnothing to commit, working tree clean\n`;
        if (parts[0] === 'log') return `commit a1b2c3d4e5f6 (HEAD -> main, origin/main)\nAuthor: root <root@kali.local>\nDate:   Mon Jan 15 14:00:00 2024\n\n    Initial commit\n`;
        return '';
      }

      case 'nano': case 'vi': case 'vim': return `  GNU nano 7.2\n  [ New file ]\n^G Help  ^X Exit  ^O Write Out\n`;
      case 'less': case 'more': return `(END)\n`;
      case 'strings': return `ELF\n/lib64/ld-linux-x86-64.so.2\nlibcrypto.so.1\nGLIBC_2.17\n${args} analysis complete\n`;
      case 'file': return `${parts[0]}: ELF 64-bit LSB executable, x86-64, version 1 (SYSV)\n`;
      case 'xxd': return `00000000: 7f45 4c46 0201 0100 0000 0000 0000 0000  .ELF............\n00000010: 0200 3e00 0100 0000 4010 4000 0000 0000  ..>.....@.@.....\n`;
      case 'binwalk': return `\nDECIMAL       HEXADECIMAL     DESCRIPTION\n--------------------------------------------------------------------------------\n0             0x0             ELF, 64-bit LSB executable, AMD x86-64\n4096          0x1000          gzip compressed data\n8192          0x2000          JPEG image data, JFIF standard 1.01\n`;
      case 'exiftool': return `ExifTool Version Number         : 12.76\nFile Name                       : ${parts[0] || 'file.jpg'}\nFile Size                       : 2.4 MB\nMIME Type                       : image/jpeg\nGPS Latitude                    : 37° 46' 29.64" N\nGPS Longitude                   : 122° 25' 9.54" W\n`;

      // ── Services ────────────────────────────────────────────────
      case 'service': case 'systemctl': {
        if (args.includes('start') || args.includes('stop') || args.includes('restart') || args.includes('enable')) return '';
        if (args.includes('status')) return `● ${parts[parts.length-1] || 'service'}.service - Service\n   Loaded: loaded (/lib/systemd/system/service.file; enabled)\n   Active: active (running) since Mon 2024-01-15 10:00:00 EDT; 4h 42min ago\n Main PID: 1024 (service)\n`;
        return '';
      }
      case 'crontab': return `no crontab for root\n`;
      case 'which': return `/usr/bin/${parts[0] || 'tool'}\n`;
      case 'whereis': return `${parts[0]}: /usr/bin/${parts[0]} /usr/share/man/man1/${parts[0]}.1.gz\n`;
      case 'man': return `No manual entry for ${parts[0] || 'command'} (use -h for help)\n`;
      case 'alias': return `alias ll='ls -alF'\nalias la='ls -A'\nalias l='ls -CF'\n`;
      case 'type': return `${parts[0]} is /usr/bin/${parts[0]}\n`;

      case 'help': {
        return `\x1b[38;5;82mCYBERSPACE Kali Terminal — Available Commands\x1b[0m\n\n` +
          `\x1b[38;5;141mReconnaissance:\x1b[0m\n  nmap, masscan, dnsenum, dnsrecon, dig, whois, fierce, sublist3r, recon-ng\n\n` +
          `\x1b[38;5;141mWeb Attack:\x1b[0m\n  sqlmap, nikto, gobuster, dirb, wfuzz, wpscan, burpsuite, skipfish\n\n` +
          `\x1b[38;5;141mPassword Attack:\x1b[0m\n  hydra, john, hashcat, medusa, patator, crunch, cewl\n\n` +
          `\x1b[38;5;141mExploitation:\x1b[0m\n  msfconsole, metasploit, sqlmap, setoolkit, beef-xss\n\n` +
          `\x1b[38;5;141mWireless:\x1b[0m\n  aircrack-ng, airodump-ng, aireplay-ng, airmon-ng, bettercap\n\n` +
          `\x1b[38;5;141mNetwork:\x1b[0m\n  nmap, netcat, tcpdump, wireshark, responder, ettercap, arpspoof\n\n` +
          `\x1b[38;5;141mForensics:\x1b[0m\n  volatility, autopsy, foremost, binwalk, exiftool, strings, xxd\n\n` +
          `\x1b[38;5;141mInstall any tool:\x1b[0m\n  apt install <tool-name>\n\n`;
      }

      default:
        // Unknown command — return null to let Gemini handle it or show error
        return null;
    }
  }
}
