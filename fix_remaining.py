import re
import os

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Gradients
    content = re.sub(r'\bfrom-cyan-\d+\b', 'from-brand-secondary', content)
    content = re.sub(r'\bto-indigo-\d+\b', 'to-brand-secondary/80', content)
    content = re.sub(r'\bvia-indigo-\d+\b', 'via-brand-secondary/90', content)
    content = re.sub(r'\bto-purple-\d+\b', 'to-brand-secondary/60', content)
    
    # Specific colors
    content = re.sub(r'\bbg-cyan-950', 'bg-brand-secondary', content)
    content = re.sub(r'\bbg-cyan-900', 'bg-brand-secondary', content)
    content = re.sub(r'\bbg-indigo-950', 'bg-brand-secondary', content)
    content = re.sub(r'\bbg-indigo-900', 'bg-brand-secondary', content)
    content = re.sub(r'\bbg-cyan-50\b', 'bg-brand-secondary/10', content)
    content = re.sub(r'\bbg-indigo-50\b', 'bg-brand-secondary/10', content)
    content = re.sub(r'\bbg-indigo-100\b', 'bg-brand-secondary/20', content)
    
    content = re.sub(r'\bborder-cyan-\d+\b', 'border-brand-secondary', content)
    content = re.sub(r'\bborder-indigo-\d+\b', 'border-brand-secondary', content)
    
    content = re.sub(r'\btext-cyan-\d+\b', 'text-brand-secondary', content)
    content = re.sub(r'\btext-indigo-\d+\b', 'text-brand-secondary', content)
    
    content = re.sub(r'\bshadow-cyan-\d+\b', 'shadow-brand-secondary', content)
    content = re.sub(r'\bshadow-indigo-\d+\b', 'shadow-brand-secondary', content)
    
    with open(filepath, 'w') as f:
        f.write(content)

for root, _, filenames in os.walk('src'):
    for filename in filenames:
        if filename.endswith('.tsx') or filename.endswith('.ts'):
            process_file(os.path.join(root, filename))
            
print("Remaining colors fixed.")
