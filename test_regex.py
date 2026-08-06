import re
import os

files = []
for root, _, filenames in os.walk('src'):
    for filename in filenames:
        if filename.endswith('.tsx'):
            files.append(os.path.join(root, filename))

for file in files:
    with open(file, 'r') as f:
        content = f.read()
    
    # Just a test to see if we can safely do regex
    # count bg-cyan-400
    cyan_count = len(re.findall(r'bg-cyan-400', content))
    if cyan_count > 0:
        print(f"{file}: {cyan_count} bg-cyan-400")
