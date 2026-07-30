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
