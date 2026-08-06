import os
import re

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Replace hardcoded rgb(6, 182, 212) with Azure Blue
    content = content.replace('rgba(6,182,212,', 'rgba(0,181,230,')
    content = content.replace('rgba(6, 182, 212,', 'rgba(0, 181, 230,')
    
    # Replace hardcoded #22d3ee with Azure Blue
    content = content.replace('#22d3ee', '#00b5e6')
    
    # Replace specific rgba values for Golden Yellow that might be old
    content = content.replace('rgba(245,158,11,', 'rgba(255,200,61,')
    
    # Replace rgba(37,99,235,...) with Golden Yellow or Azure? 
    # 37, 99, 235 is blue-600. It was used in Primary Button shadows. Should be Azure.
    content = content.replace('rgba(37,99,235,', 'rgba(0,181,230,')
    
    # Replace rgba(34,211,238,...) which is cyan-400.
    content = content.replace('rgba(34,211,238,', 'rgba(0,181,230,')
    content = content.replace('rgba(34, 211, 238,', 'rgba(0, 181, 230,')

    with open(filepath, 'w') as f:
        f.write(content)

for root, _, filenames in os.walk('src'):
    for filename in filenames:
        if filename.endswith('.tsx') or filename.endswith('.ts') or filename.endswith('.css'):
            process_file(os.path.join(root, filename))

print("Fixed hardcoded colors.")
