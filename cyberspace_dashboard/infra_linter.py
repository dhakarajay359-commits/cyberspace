import re

def lint_dockerfile(dockerfile_content):
    """
    Lints a Dockerfile for common security misconfigurations.
    Returns a list of findings and a 'fixed' version.
    """
    findings = []
    lines = dockerfile_content.splitlines()
    has_user = False
    
    # Simple regex rules
    # 1. Check for latest tag
    latest_img_re = re.compile(r"^FROM\s+([^\s:]+)(?::latest)?(?:\s+AS\s+\w+)?$", re.IGNORECASE)
    # 2. Check for exposed dangerous ports (like 22)
    expose_re = re.compile(r"^EXPOSE\s+(\d+)", re.IGNORECASE)
    # 3. Check for USER directive
    user_re = re.compile(r"^USER\s+(\w+)", re.IGNORECASE)

    fixed_lines = []
    
    for i, line in enumerate(lines):
        clean_line = line.strip()
        fixed_line = line
        
        if clean_line.upper().startswith("FROM "):
            match = latest_img_re.match(clean_line)
            if match or ":latest" in clean_line:
                img_name = match.group(1) if match else clean_line.split()[1].split(":")[0]
                findings.append({
                    "line": i + 1,
                    "severity": "High",
                    "issue": f"Using 'latest' or untagged base image: {clean_line}",
                    "recommendation": f"Pin to a specific, slim version (e.g., {img_name}:18-alpine)"
                })
                # Fix: Add a dummy specific tag
                fixed_line = f"FROM {img_name}:alpine"
        
        elif clean_line.upper().startswith("EXPOSE "):
            match = expose_re.match(clean_line)
            if match:
                port = match.group(1)
                if port in ["22", "3306", "5432"]:
                    findings.append({
                        "line": i + 1,
                        "severity": "High",
                        "issue": f"Exposing sensitive port: {port}",
                        "recommendation": "Do not expose SSH or database ports in web containers."
                    })
                    fixed_line = f"# EXPOSE {port} # REMOVED FOR SECURITY"

        elif clean_line.upper().startswith("USER "):
            match = user_re.match(clean_line)
            if match:
                user = match.group(1)
                if user == "root" or user == "0":
                    findings.append({
                        "line": i + 1,
                        "severity": "Critical",
                        "issue": "Container runs as root user explicitly.",
                        "recommendation": "Use a non-root user."
                    })
                    fixed_line = "USER appuser"
                else:
                    has_user = True

        fixed_lines.append(fixed_line)

    if not has_user:
        findings.append({
            "line": len(lines),
            "severity": "High",
            "issue": "No USER directive found. Container defaults to root.",
            "recommendation": "Add a non-root user (e.g., RUN adduser -D appuser && USER appuser)."
        })
        fixed_lines.append("\n# Security fix: Run as non-root")
        fixed_lines.append("RUN addgroup -S appgroup && adduser -S appuser -G appgroup")
        fixed_lines.append("USER appuser")

    return {
        "findings": findings,
        "fixed_content": "\n".join(fixed_lines)
    }
