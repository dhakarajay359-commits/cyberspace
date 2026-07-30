with open('static/js/compete.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Fix 1: Auto transition in autoJoinFromUrl
text = text.replace(
    'if (statusData.custom_desc) window.customDesc = statusData.custom_desc;\n\n\n\n        } catch(e) { console.error(\'Demo auto-join error\', e); }',
    'if (statusData.custom_desc) window.customDesc = statusData.custom_desc;\n                startMatch();\n        } catch(e) { console.error(\'Demo auto-join error\', e); }'
)

# Fix 2: Auto transition in pollLobbyStatus
text = text.replace(
    'blueList.innerHTML = data.members.blue.map(u => `<li><span class="text-slate-500">></span> ${u}</li>`).join(\'\');\n\n                }\n\n            } catch(e) { console.error(\'Polling error\', e); }',
    'blueList.innerHTML = data.members.blue.map(u => `<li><span class="text-slate-500">></span> ${u}</li>`).join(\'\');\n                    if (data.status === \'active\') startMatch();\n                }\n            } catch(e) { console.error(\'Polling error\', e); }'
)

with open('static/js/compete.js', 'w', encoding='utf-8') as f:
    f.write(text)

print("UI Transitions Fixed successfully!")
