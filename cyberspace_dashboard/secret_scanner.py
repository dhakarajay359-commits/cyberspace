import re

def scan_for_secrets(content):
    """
    Scans a given text or configuration snippet for hardcoded secrets
    using high-entropy regex patterns.
    """
    findings = []
    lines = content.splitlines()

    patterns = {
        "AWS Access Key ID": re.compile(r"(?<![A-Z0-9])[A-Z0-9]{20}(?![A-Z0-9])"),
        "AWS Secret Access Key": re.compile(r"(?<![A-Za-z0-9/+=])[A-Za-z0-9/+=]{40}(?![A-Za-z0-9/+=])"),
        "Google API Key": re.compile(r"AIza[0-9A-Za-z-_]{35}"),
        "GitHub Token": re.compile(r"gh[pousr]_[a-zA-Z0-9]{36}"),
        "Generic Password or Token": re.compile(r"(?i)(password|secret|token|api_key)\s*[:=]\s*['\"]([^'\"]{8,})['\"]"),
        "Database URI": re.compile(r"(?:mysql|postgres|mongodb)\+?[a-z]*://([^:]+):([^@]+)@")
    }

    masked_lines = []

    for i, line in enumerate(lines):
        masked_line = line
        line_has_secret = False

        for secret_name, pattern in patterns.items():
            matches = pattern.finditer(line)
            for match in matches:
                # To prevent matching false positives on generic strings,
                # AWS keys usually require contextual checks but this is a simplified scanner
                secret_value = match.group(0)
                
                # Check for Generic Password specifically
                if secret_name == "Generic Password or Token" or secret_name == "Database URI":
                    secret_value = match.group(2) # The actual secret group
                
                # If it's a very generic match, skip if it doesn't look like a secret
                if secret_name == "AWS Access Key ID" and not line.startswith("AKIA"):
                    # Improve accuracy of AWS key detection
                    if "AKIA" not in secret_value:
                        continue
                
                line_has_secret = True
                findings.append({
                    "line": i + 1,
                    "severity": "Critical",
                    "type": secret_name,
                    "issue": f"Found potential {secret_name}",
                    "recommendation": "Use environment variables or a Secret Manager (e.g., AWS Secrets Manager, HashiCorp Vault)."
                })
                # Mask the secret
                masked_line = masked_line.replace(secret_value, "********")

        masked_lines.append(masked_line)

    return {
        "findings": findings,
        "masked_content": "\n".join(masked_lines)
    }
