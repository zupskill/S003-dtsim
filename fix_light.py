import re

with open('src/index.css', 'r') as f:
    content = f.read()

# Update light mode background
content = content.replace('--background: #f8fafc', '--background: #f7fafc')
content = content.replace('background-color: #f8fafc', 'background-color: #f7fafc')

with open('src/index.css', 'w') as f:
    f.write(content)

