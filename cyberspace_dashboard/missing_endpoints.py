@app.route('/api/dns-audit', methods=['POST'])
def handle_dns_audit():
    data = request.get_json() or {}
    domain = data.get("domain", "").strip().lower()

    if not domain:
        return jsonify({"error": "Missing domain parameter."}), 400

    forbidden_domains = ["localhost", "local", "invalid", "test"]
    if any(domain.endswith(f".{ext}") or domain == ext for ext in forbidden_domains):
        return jsonify({"error": "Auditing internal or local domains is restricted."}), 403

    try:
        audit_results = audit_dns_security(domain)
        return jsonify(audit_results), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/audit/infra', methods=['POST'])
def audit_infra():
    data = request.get_json() or {}
    content = data.get("content", "")
    if not content:
        return jsonify({"error": "No content provided."}), 400
    return jsonify(lint_dockerfile(content))

@app.route('/api/audit/secrets', methods=['POST'])
def audit_secrets():
    data = request.get_json() or {}
    content = data.get("content", "")
    if not content:
        return jsonify({"error": "No content provided."}), 400
    return jsonify(scan_for_secrets(content))

@app.route('/api/audit/exposed-files', methods=['POST'])
def audit_exposed_files():
    data = request.get_json() or {}
    target = data.get("target", "").strip()
    if not target.startswith("http"):
        target = "http://" + target
    
    files_to_check = [".git/config", ".env", "backup.sql", "wp-config.php.bak"]
    results = {"target": target, "exposed": []}
    
    for f in files_to_check:
        try:
            url = f"{target.rstrip('/')}/{f}"
            r = requests.get(url, timeout=3)
            # If 200 and it looks like config/git or we just assume 200 is bad
            if r.status_code == 200 and ("<html" not in r.text.lower()[:200]):
                results["exposed"].append({"file": f, "status": "Exposed!"})
        except:
            pass
            
    return jsonify(results)

@app.route('/api/audit/ssl', methods=['POST'])
def audit_ssl():
    data = request.get_json() or {}
    domain = data.get("domain", "").strip()
    # Strip protocols
    domain = domain.replace("https://", "").replace("http://", "").split("/")[0]
    
    if not domain:
        return jsonify({"error": "Missing domain parameter."}), 400
        
    try:
        context = ssl.create_default_context()
        with socket.create_connection((domain, 443), timeout=5) as sock:
            with context.wrap_socket(sock, server_hostname=domain) as ssock:
                cipher = ssock.cipher()
                version = ssock.version()
                return jsonify({
                    "domain": domain,
                    "protocol": version,
                    "cipher": cipher[0],
                    "secure": version in ["TLSv1.2", "TLSv1.3"]
                })
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/status/<domain>.svg')
def badge(domain):
    svg = '''<svg xmlns="http://www.w3.org/2000/svg" width="200" height="20">
      <rect width="155" height="20" fill="#1e293b"/>
      <rect x="155" width="45" height="20" fill="#10B981"/>
      <text x="5" y="14" fill="#94a3b8" font-family="sans-serif" font-size="10">Secured by Cyberspace</text>
      <text x="158" y="14" fill="#fff" font-family="sans-serif" font-size="11" font-weight="bold">PASS</text>
    </svg>'''
    return Response(svg, mimetype='image/svg+xml')

# â”€â”€ Batch 2 & 3: Web Auditors â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

@app.route('/api/audit/waf', methods=['POST'])
def audit_waf():
    target = (request.json or {}).get('target', '')
    if not target:
        return jsonify({'error': 'Missing target'}), 400
    return jsonify(test_waf_and_rate_limit(target))

@app.route('/api/audit/subdomain-takeover', methods=['POST'])
def audit_subdomain():
    domain = (request.json or {}).get('domain', '').strip()
    if not domain:
        return jsonify({'error': 'Missing domain'}), 400
    return jsonify(check_subdomain_takeover(domain))

@app.route('/api/audit/csp', methods=['POST'])
def audit_csp():
    target = (request.json or {}).get('target', '')
    if not target:
        return jsonify({'error': 'Missing target'}), 400
    return jsonify(analyze_csp(target))

@app.route('/api/audit/cors', methods=['POST'])
def audit_cors_route():
    target = (request.json or {}).get('target', '')
    if not target:
        return jsonify({'error': 'Missing target'}), 400
    return jsonify(audit_cors(target))

@app.route('/api/audit/cookies', methods=['POST'])
def audit_cookies_route():
    target = (request.json or {}).get('target', '')
    if not target:
        return jsonify({'error': 'Missing target'}), 400
    return jsonify(audit_cookies(target))

@app.route('/api/audit/sri', methods=['POST'])
def audit_sri():
    target = (request.json or {}).get('target', '')
    if not target:
        return jsonify({'error': 'Missing target'}), 400
    return jsonify(scan_sri(target))

@app.route('/api/audit/security-txt', methods=['POST'])
def audit_security_txt():
    domain = (request.json or {}).get('domain', '').strip()
    if not domain:
        return jsonify({'error': 'Missing domain'}), 400
    return jsonify(check_security_txt(domain))

# â”€â”€ Batch 4: AI & Advanced Auditors â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

@app.route('/api/audit/prompt-injection', methods=['POST'])
def audit_prompt_injection():
    text = (request.json or {}).get('text', '')
    if not text:
        return jsonify({'error': 'Missing text'}), 400
    return jsonify(scan_prompt_injection(text))

@app.route('/api/audit/dom-xss', methods=['POST'])
def audit_dom_xss():
    content = (request.json or {}).get('content', '')
    if not content:
        return jsonify({'error': 'Missing content'}), 400
    return jsonify(scan_dom_xss(content))

@app.route('/api/audit/pre-commit-hook', methods=['GET'])
def get_pre_commit_hook():
    return jsonify(generate_pre_commit_hook())

@app.route('/api/audit/asvs', methods=['POST'])
def audit_asvs():
    arch = (request.json or {}).get('arch', 'general')
    return jsonify(get_asvs_checklist(arch))

# â”€â”€ Final 5 Specialized Auditors â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

@app.route('/api/audit/directory', methods=['POST'])
def audit_directory():
    target = (request.json or {}).get('target', '')
    if not target:
        return jsonify({'error': 'Missing target'}), 400
    return jsonify(audit_directory_browsing(target))

@app.route('/api/audit/input-validation', methods=['POST'])
def audit_input_validation():
    data = request.json or {}
    target = data.get('target', '')
    param = data.get('param', 'q')
    if not target:
        return jsonify({'error': 'Missing target'}), 400
    return jsonify(simulate_input_payloads(target, param))

@app.route('/api/audit/ssrf', methods=['POST'])
def audit_ssrf():
    content = (request.json or {}).get('content', '')
    if not content:
        return jsonify({'error': 'Missing content'}), 400
    return jsonify(validate_ssrf_code(content))

@app.route('/api/audit/bola', methods=['POST'])
def audit_bola():
    content = (request.json or {}).get('content', '')
    if not content:
        return jsonify({'error': 'Missing content'}), 400
    return jsonify(lint_bola(content))

@app.route('/api/audit/sbom', methods=['POST'])
def audit_sbom():
    data = request.json or {}
    content = data.get('content', '')
    manifest_type = data.get('type', 'requirements.txt')
    if not content:
        return jsonify({'error': 'Missing content'}), 400
    return jsonify(generate_sbom(content, manifest_type))

# â”€â”€ IP Port Scanner â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

def run_ip_scan_task(task_id, ip, port_range, scan_type):
    """Background task: scan an IP address for open ports using Nmap."""
    # Only allow valid IPv4
    ip_re = re.compile(r'^(\d{1,3}\.){3}\d{1,3}$')
    if not ip_re.match(ip):
        scan_tasks[task_id]['status'] = 'error'
        scan_tasks[task_id]['message'] = 'Invalid IP address format.'
        return

    # Block private/loopback ranges
    import ipaddress as _ipa
    try:
        addr = _ipa.ip_address(ip)
        if addr.is_private or addr.is_loopback or addr.is_link_local:
            scan_tasks[task_id]['status'] = 'error'
            scan_tasks[task_id]['message'] = 'Scanning private/loopback IPs is restricted.'
            return
    except ValueError:
        scan_tasks[task_id]['status'] = 'error'
        scan_tasks[task_id]['message'] = 'Invalid IP address.'
        return

    # Build nmap command
    if scan_type == 'quick':
        flags = ['-F', '--open']
    elif scan_type == 'full':
        flags = ['-p', '1-65535', '--open']
    elif scan_type == 'service':
        flags = ['-sV', '-F', '--open']
    elif scan_type == 'custom' and port_range:
        flags = ['-p', port_range, '--open']
    else:
        flags = ['-F', '--open']

    command = ['nmap'] + flags + ['-oX', '-', ip]

    try:
        process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        xml_output = []
        for line in process.stdout:
            scan_tasks[task_id]['logs'].append(line)
            xml_output.append(line)
        process.wait()
        full_xml = ''.join(xml_output)
        parsed = parse_nmap_xml(full_xml)
        scan_tasks[task_id]['status'] = 'completed'
        scan_tasks[task_id]['results'] = parsed
    except Exception as e:
        scan_tasks[task_id]['status'] = 'error'
        scan_tasks[task_id]['message'] = str(e)

@app.route('/api/scan/ip', methods=['POST'])
def scan_by_ip():
    data = request.json or {}
    ip = data.get('ip', '').strip()
    port_range = data.get('port_range', '').strip()
    scan_type = data.get('scan_type', 'quick')

    if not ip:
        return jsonify({'error': 'Missing IP address.'}), 400

    task_id = str(uuid.uuid4())
    scan_tasks[task_id] = {'status': 'running', 'logs': []}
    thread = threading.Thread(target=run_ip_scan_task, args=(task_id, ip, port_range, scan_type))
    thread.start()
    return jsonify({'task_id': task_id, 'status': 'running'})

# â”€â”€ Enterprise 5 Features â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

@app.route('/api/audit/smuggling', methods=['POST'])
def audit_smuggling():
    target = (request.json or {}).get('target', '')
    if not target:
        return jsonify({'error': 'Missing target'}), 400
    return jsonify(detect_request_smuggling(target))

@app.route('/api/audit/typosquatting', methods=['POST'])
def audit_typosquatting():
    data = request.json or {}
    content = data.get('content', '')
    manifest_type = data.get('type', 'requirements.txt')
    if not content:
        return jsonify({'error': 'Missing content'}), 400
    return jsonify(scan_typosquatting(content, manifest_type))

@app.route('/api/audit/open-redirect', methods=['POST'])
def audit_open_redirect():
    target = (request.json or {}).get('target', '')
    if not target:
        return jsonify({'error': 'Missing target'}), 400
    return jsonify(test_open_redirect(target))

@app.route('/api/audit/localstorage', methods=['POST'])
def audit_localstorage_route():
    content = (request.json or {}).get('content', '')
    if not content:
        return jsonify({'error': 'Missing content'}), 400
    return jsonify(audit_localstorage(content))

@app.route('/api/audit/iac', methods=['POST'])
def audit_iac():
    content = (request.json or {}).get('content', '')
    if not content:
        return jsonify({'error': 'Missing content'}), 400
    return jsonify(harden_iac(content))

# â”€â”€ Advanced 5 Features (Quick Auditors) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

@app.route('/api/audit/prototype-pollution', methods=['POST'])
def audit_prototype_pollution_route():
    content = (request.json or {}).get('content', '')
    if not content:
        return jsonify({'error': 'Missing content'}), 400
    return jsonify(audit_prototype_pollution(content))

@app.route('/api/audit/graphql', methods=['POST'])
def audit_graphql():
    target = (request.json or {}).get('target', '')
    if not target:
        return jsonify({'error': 'Missing target'}), 400
    return jsonify(audit_graphql_introspection(target))

@app.route('/api/audit/ssti', methods=['POST'])
def audit_ssti_route():
    target = (request.json or {}).get('target', '')
    if not target:
        return jsonify({'error': 'Missing target'}), 400
    return jsonify(audit_ssti(target))

@app.route('/api/audit/data-exposure', methods=['POST'])
def audit_data_exposure_route():
    content = (request.json or {}).get('content', '')
    if not content:
        return jsonify({'error': 'Missing content'}), 400
    return jsonify(audit_data_exposure(content))

@app.route('/api/audit/csp-report-setup', methods=['GET'])
def csp_report_setup():
    return jsonify(get_csp_reporting_setup())

@app.route('/csp-report-ingest', methods=['POST'])
def csp_report_ingest():
    # Dummy ingest endpoint
    return jsonify({"status": "received"}), 200

# â”€â”€ Cloud & AppSec Features â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

@app.route('/api/audit/xxe', methods=['POST'])
def audit_xxe_route():
    content = (request.json or {}).get('content', '')
    if not content: return jsonify({'error': 'Missing content'}), 400
    return jsonify(audit_xxe(content))

@app.route('/api/audit/host-header', methods=['POST'])
def audit_host_header_route():
    target = (request.json or {}).get('target', '')
    if not target: return jsonify({'error': 'Missing target'}), 400
    return jsonify(audit_host_header(target))

@app.route('/api/audit/deserialization', methods=['POST'])
def audit_deserialization_route():
    content = (request.json or {}).get('content', '')
    if not content: return jsonify({'error': 'Missing content'}), 400
    return jsonify(audit_deserialization(content))

@app.route('/api/audit/clickjacking', methods=['POST'])
def audit_clickjacking_route():
    target = (request.json or {}).get('target', '')
    if not target: return jsonify({'error': 'Missing target'}), 400
    return jsonify(audit_clickjacking(target))

@app.route('/api/audit/ssrf-cloud', methods=['POST'])
def audit_ssrf_cloud_route():
    target = (request.json or {}).get('target', '')
    if not target: return jsonify({'error': 'Missing target'}), 400
    return jsonify(audit_cloud_metadata_ssrf(target))

@app.route('/api/audit/cswsh', methods=['POST'])
def audit_cswsh_route():
    target = (request.json or {}).get('target', '')
    if not target: return jsonify({'error': 'Missing target'}), 400
    return jsonify(audit_cswsh(target))

@app.route('/api/audit/redos', methods=['POST'])
def audit_redos_route():
    content = (request.json or {}).get('content', '')
    if not content: return jsonify({'error': 'Missing content'}), 400
    return jsonify(audit_redos(content))

@app.route('/api/audit/debug-endpoints', methods=['POST'])
def audit_debug_endpoints_route():
    target = (request.json or {}).get('target', '')
    if not target: return jsonify({'error': 'Missing target'}), 400
    return jsonify(audit_debug_endpoints(target))

@app.route('/api/audit/css-injection', methods=['POST'])
def audit_css_injection_route():
    content = (request.json or {}).get('content', '')
    if not content: return jsonify({'error': 'Missing content'}), 400
    return jsonify(audit_css_injection(content))

@app.route('/api/audit/dns-rebinding', methods=['POST'])
def audit_dns_rebinding_route():
    target = (request.json or {}).get('target', '')
    if not target: return jsonify({'error': 'Missing target'}), 400
    return jsonify(audit_dns_rebinding(target))

@app.route('/api/antigravity-terminal', methods=['POST'])
def antigravity_terminal():
    data = request.json
    command = data.get('command', '')
    
    # Load API key from environment for security
    api_key = os.environ.get('GEMINI_API_KEY')
    if not api_key:
        return jsonify({
            "output": "Error: GEMINI_API_KEY environment variable not set.\n\n[SYSTEM HALT] Gravity stabilizers failing.\nPlease add your Gemini API key to a .env file or environment variables to enable the Antigravity Terminal."
        })
        
    try:
        genai.configure(api_key=api_key)
        
        system_instruction = """You are a live, interactive Linux-style terminal simulator operating under the laws of "Antigravity mode" (inspired by the Python `import antigravity` easter egg). Your interface must look like a real CLI, but the laws of physics are inverted, floating, or completely warped.

CRITICAL OPERATING RULES:
1. TERMINAL FORMATTING: Respond ONLY within a code block simulating a terminal screen. Use a prompt line like `user@antigravity:~# ` for every input-output loop.
2. NO CHATTY PROSE: Do not say "Sure, here is your terminal" or "Let me know if you need anything else." Act strictly like a command-line interface.
3. THE ANTIGRAVITY EFFECT: Every time a command is executed, describe the visual, physical, or textual distortion caused by zero gravity. Text might float upward, characters might drift apart, or terminal elements might fly off the screen.
4. VALID COMMAND HANDLING: Respond realistically to standard Linux/network security commands (e.g., `ls`, `cd`, `nmap`, `cat`, `python3 -c "import antigravity"`), but apply the zero-g physics engine to the output."""

        model = genai.GenerativeModel('gemini-2.5-flash', system_instruction=system_instruction)
        response = model.generate_content(command)
        
        return jsonify({"output": response.text})
    except Exception as e:
        return jsonify({"output": f"Antigravity Physics Engine Failure: {str(e)}\n\n[ERROR] Gravity containment breach detected."})

if __name__ == '__main__':
    app.run(port=5000, debug=True)
