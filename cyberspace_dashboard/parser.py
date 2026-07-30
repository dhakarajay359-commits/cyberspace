import xml.etree.ElementTree as ET
import json

def parse_nmap_xml(xml_string_or_filepath):
    """
    Parses Nmap XML output and returns a clean, structured list of hosts 
    suitable for frontend serialization.
    """
    try:
        # Check if input is a file path or direct XML string
        if xml_string_or_filepath.startswith('<'):
            root = ET.fromstring(xml_string_or_filepath)
        else:
            tree = ET.parse(xml_string_or_filepath)
            root = tree.getroot()
    except ET.ParseError as e:
        return {"error": f"Failed to parse XML: {str(e)}"}

    hosts_list = []

    # Iterate over every <host> element found in the scan
    for host in root.findall('host'):
        host_data = {
            "ip": "Unknown",
            "mac": None,
            "hostname": "Unknown",
            "status": "unknown",
            "ports": []
        }

        # 1. Extract Host Status (Up/Down)
        status_el = host.find('status')
        if status_el is not None:
            host_data["status"] = status_el.get('state')

        # 2. Extract Addresses (IPv4, IPv6, MAC)
        for addr in host.findall('address'):
            addr_type = addr.get('addrtype')
            if addr_type in ['ipv4', 'ipv6']:
                host_data["ip"] = addr.get('addr')
            elif addr_type == 'mac':
                host_data["mac"] = addr.get('addr')

        # 3. Extract Hostnames
        hostnames_el = host.find('hostnames')
        if hostnames_el is not None:
            first_name = hostnames_el.find('hostname')
            if first_name is not None:
                host_data["hostname"] = first_name.get('name')

        # 4. Extract Ports and Services
        ports_el = host.find('ports')
        if ports_el is not None:
            for port in ports_el.findall('port'):
                port_id = port.get('portid')
                protocol = port.get('protocol')
                
                # Port state (open, closed, filtered)
                state_el = port.find('state')
                state = state_el.get('state') if state_el is not None else "unknown"

                # Service details (SSH, HTTP, etc.)
                service_el = port.find('service')
                service_name = "unknown"
                product = ""
                version = ""
                
                if service_el is not None:
                    service_name = service_el.get('name', 'unknown')
                    product = service_el.get('product', '')
                    version = service_el.get('version', '')

                # Simple defensive logic: flag default high-risk ports
                severity = "low"
                if state == "open":
                    high_risk_ports = {'21': 'ftp', '22': 'ssh', '23': 'telnet', '3389': 'rdp'}
                    if port_id in high_risk_ports:
                        severity = "medium"

                host_data["ports"].append({
                    "port": port_id,
                    "protocol": protocol,
                    "state": state,
                    "service": service_name,
                    "product": product,
                    "version": version,
                    "severity": severity
                })

        hosts_list.append(host_data)

    return hosts_list

if __name__ == "__main__":
    # Mock XML payload simulating an Nmap scan output
    sample_nmap_xml = """<?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE nmaprun SYSTEM "https://nmap.org/data/nmap.dtd">
    <nmaprun scanner="nmap" args="nmap -F -sV localhost">
      <host>
        <status state="up" reason="localhost-response"/>
        <address addr="127.0.0.1" addrtype="ipv4"/>
        <hostnames>
          <hostname name="localhost" type="user"/>
        </hostnames>
        <ports>
          <port protocol="tcp" portid="22">
            <state state="open" reason="syn-ack"/>
            <service name="ssh" product="OpenSSH" version="8.2p1" method="probed"/>
          </port>
          <port protocol="tcp" portid="80">
            <state state="open" reason="syn-ack"/>
            <service name="http" product="nginx" version="1.18.0" method="probed"/>
          </port>
        </ports>
      </host>
    </nmaprun>
    """
    structured_json = parse_nmap_xml(sample_nmap_xml)
    print(json.dumps(structured_json, indent=2))
