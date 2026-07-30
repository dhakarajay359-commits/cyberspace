import dns.resolver
import json

def audit_dns_security(domain):
    """
    Queries SPF and DMARC records for a domain and parses them 
    to assess the email security posture.
    """
    results = {
        "domain": domain,
        "spf": {
            "found": False,
            "record": None,
            "status": "Missing",
            "explanation": "No SPF record found. Phishers can easily spoof emails from this domain."
        },
        "dmarc": {
            "found": False,
            "record": None,
            "status": "Missing",
            "policy": "none",
            "explanation": "No DMARC record found. This domain lacks protection and spoofing visibility."
        }
    }

    resolver = dns.resolver.Resolver()
    resolver.timeout = 5.0
    resolver.lifetime = 5.0

    # 1. Check SPF Record (Root domain TXT record starting with 'v=spf1')
    try:
        txt_records = resolver.resolve(domain, 'TXT')
        for record in txt_records:
            record_text = "".join([t.decode('utf-8') for t in record.strings])
            if record_text.startswith("v=spf1"):
                results["spf"]["found"] = True
                results["spf"]["record"] = record_text
                
                # Analyze defensive strength of the SPF "all" mechanism
                if "-all" in record_text:
                    results["spf"]["status"] = "Strong (Hard Fail)"
                    results["spf"]["explanation"] = "Unauthorized emails will be strictly rejected (-all)."
                elif "~all" in record_text:
                    results["spf"]["status"] = "Moderate (Soft Fail)"
                    results["spf"]["explanation"] = "Unauthorized emails will likely be flagged as spam (~all)."
                elif "?all" in record_text or "+all" in record_text:
                    results["spf"]["status"] = "Weak"
                    results["spf"]["explanation"] = "Weak SPF mechanism detected. The domain authorizes almost any sender."
                break
    except (dns.resolver.NoAnswer, dns.resolver.NXDOMAIN, dns.exception.Timeout):
        pass

    # 2. Check DMARC Record (TXT record at _dmarc.<domain>)
    try:
        dmarc_target = f"_dmarc.{domain}"
        dmarc_records = resolver.resolve(dmarc_target, 'TXT')
        for record in dmarc_records:
            record_text = "".join([t.decode('utf-8') for t in record.strings])
            if record_text.startswith("v=DMARC1"):
                results["dmarc"]["found"] = True
                results["dmarc"]["record"] = record_text
                
                # Parse the primary DMARC policy tag (p=reject, quarantine, or none)
                policy = "none"
                for tag_pair in record_text.split(";"):
                    clean_pair = tag_pair.strip()
                    if clean_pair.startswith("p="):
                        policy = clean_pair.split("=")[1].lower()
                        break
                
                results["dmarc"]["policy"] = policy
                
                # Assess severity based on policy
                if policy == "reject":
                    results["dmarc"]["status"] = "Strong"
                    results["dmarc"]["explanation"] = "Domain is fully protected; spoofed emails are outright rejected (p=reject)."
                elif policy == "quarantine":
                    results["dmarc"]["status"] = "Moderate"
                    results["dmarc"]["explanation"] = "Spoofed emails are sent directly to the spam folder (p=quarantine)."
                else:
                    results["dmarc"]["status"] = "Monitoring Only"
                    results["dmarc"]["explanation"] = "DMARC policy is set to 'none'. Spoofed emails will still deliver to inboxes."
                break
    except (dns.resolver.NoAnswer, dns.resolver.NXDOMAIN, dns.exception.Timeout):
        pass

    return results

if __name__ == "__main__":
    target_domain = "github.com"
    audit_output = audit_dns_security(target_domain)
    print(json.dumps(audit_output, indent=2))
