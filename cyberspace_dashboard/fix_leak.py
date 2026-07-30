import sys
import re

try:
    with open('templates/compete.html', 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the corrupted block
    # Start: <span class="text-xs text-slate-400">YOUR RANK:</span>
    # End: if not lobby:
    
    start_str = '<span class="text-xs text-slate-400">YOUR RANK:</span>'
    end_str = 'if not lobby:\n'
    
    if start_str in content and end_str in content:
        start_idx = content.find(start_str) + len(start_str)
        end_idx = content.find(end_str) + len(end_str)
        
        replacement = """
                    <span class="text-emerald-400 font-bold tracking-widest text-sm">ELITE VANGUARD</span>
                </div>
            </div>
"""
        
        content = content[:start_idx] + replacement + content[end_idx:]
        
        with open('templates/compete.html', 'w', encoding='utf-8') as f:
            f.write(content)
        print("Python corruption removed successfully!")
    else:
        print("Could not find start or end string")

except Exception as e:
    print("Error:", e)
