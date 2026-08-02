import sys

with open("app.py", "r", encoding="utf-8") as f:
    app_lines = f.readlines()

with open("missing_endpoints.py", "r", encoding="utf-8") as f:
    endpoints_lines = f.readlines()

# find if __name__ == '__main__':
insert_idx = -1
for i, line in enumerate(app_lines):
    if line.strip() == "if __name__ == '__main__':":
        insert_idx = i
        break

if insert_idx == -1:
    print("Could not find if __name__ == '__main__':")
    sys.exit(1)

# filter endpoints_lines to remove if __name__ == '__main__':
filtered_endpoints = []
for line in endpoints_lines:
    if line.strip() == "if __name__ == '__main__':":
        break
    filtered_endpoints.append(line)

new_app_lines = app_lines[:insert_idx] + ["\n"] + filtered_endpoints + ["\n"] + app_lines[insert_idx:]

with open("app.py", "w", encoding="utf-8") as f:
    f.writelines(new_app_lines)

print("Successfully injected endpoints!")
