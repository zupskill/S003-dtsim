import os
import re

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # EmpathizeStage.tsx bg-teal-600
    content = content.replace('bg-teal-600 hover:bg-teal-500', 'bg-brand-secondary hover:bg-brand-secondary-hover')
    content = content.replace('rgba(13,148,136,', 'rgba(0,181,230,')
    
    # from-indigo-600 to-cyan-600
    content = content.replace('from-indigo-600 to-cyan-600', 'from-brand-secondary to-brand-secondary/80')
    
    # bg-cyan-600
    content = content.replace('bg-cyan-600', 'bg-brand-secondary')
    
    # fill-cyan-400/20
    content = content.replace('fill-cyan-400/20', 'fill-brand-secondary/20')
    
    # bg-cyan-200/15
    content = content.replace('bg-cyan-200/15', 'bg-brand-secondary/15')
    
    # from-teal-600 to-cyan-400
    content = content.replace('from-teal-600 to-cyan-400', 'from-brand-secondary to-brand-secondary/80')
    
    # In index.css, replace .light .bg-cyan- with .light .bg-brand-secondary- or just update the variable values.
    # Actually, the user asked to replace teal with Azure, so cyan is also Azure.
    # We already fixed index.css to map these to Azure colors, but let's just make sure.

    with open(filepath, 'w') as f:
        f.write(content)

for root, _, filenames in os.walk('src'):
    for filename in filenames:
        if filename.endswith('.tsx') or filename.endswith('.ts'):
            process_file(os.path.join(root, filename))

print("Fixed leftovers.")
