import re
import os

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Define color token replacements
    
    # Background / Surface
    content = re.sub(r'\bbg-slate-950\b', 'bg-background', content)
    content = re.sub(r'\bbg-slate-900\b', 'bg-surface', content)
    content = re.sub(r'\bbg-slate-850\b', 'bg-surface-hover', content)
    content = re.sub(r'\bbg-slate-800\b', 'bg-surface-hover', content)
    content = re.sub(r'\bbg-white\b', 'bg-background', content)
    content = re.sub(r'\bbg-slate-50\b', 'bg-surface', content)
    content = re.sub(r'\bbg-slate-100\b', 'bg-surface-hover', content)

    # Primary Action (Golden Yellow)
    content = re.sub(r'\bbg-cyan-400\b', 'bg-brand-primary', content)
    content = re.sub(r'\bhover:bg-cyan-300\b', 'hover:bg-brand-primary-hover', content)
    
    content = re.sub(r'\bbg-blue-600\b', 'bg-brand-primary', content)
    content = re.sub(r'\bhover:bg-blue-700\b', 'hover:bg-brand-primary-hover', content)
    
    # Secondary actions / Structural (Teal Blue)
    content = re.sub(r'\bbg-cyan-500\b', 'bg-brand-secondary', content)
    content = re.sub(r'\bhover:bg-cyan-500\b', 'hover:bg-brand-secondary-hover', content)
    
    content = re.sub(r'\bbg-indigo-600\b', 'bg-brand-secondary', content)
    content = re.sub(r'\bhover:bg-indigo-500\b', 'hover:bg-brand-secondary-hover', content)

    # Text mapping
    content = re.sub(r'\btext-white\b', 'text-text-primary', content)
    content = re.sub(r'\btext-slate-100\b', 'text-text-primary', content)
    content = re.sub(r'\btext-slate-200\b', 'text-text-primary', content)
    content = re.sub(r'\btext-slate-300\b', 'text-text-secondary', content)
    content = re.sub(r'\btext-slate-400\b', 'text-text-secondary', content)
    content = re.sub(r'\btext-slate-500\b', 'text-text-tertiary', content)
    content = re.sub(r'\btext-slate-600\b', 'text-text-tertiary', content)

    # Cyan text -> Teal Blue (Structural)
    content = re.sub(r'\btext-cyan-400\b', 'text-brand-secondary', content)
    content = re.sub(r'\btext-cyan-500\b', 'text-brand-secondary', content)
    content = re.sub(r'\btext-cyan-700\b', 'text-brand-secondary', content)

    # Indigo text -> Teal Blue
    content = re.sub(r'\btext-indigo-400\b', 'text-brand-secondary', content)
    content = re.sub(r'\btext-indigo-500\b', 'text-brand-secondary', content)
    content = re.sub(r'\btext-indigo-600\b', 'text-brand-secondary', content)
    content = re.sub(r'\btext-indigo-700\b', 'text-brand-secondary', content)

    # Amber / Yellow -> Golden Yellow
    content = re.sub(r'\btext-amber-400\b', 'text-brand-primary', content)
    content = re.sub(r'\btext-amber-500\b', 'text-brand-primary', content)
    content = re.sub(r'\btext-yellow-400\b', 'text-brand-primary', content)
    content = re.sub(r'\btext-yellow-500\b', 'text-brand-primary', content)

    # Borders
    content = re.sub(r'\bborder-slate-900\b', 'border-border', content)
    content = re.sub(r'\bborder-slate-800\b', 'border-border', content)
    content = re.sub(r'\bborder-slate-700\b', 'border-border-subtle', content)
    
    content = re.sub(r'\bborder-cyan-400\b', 'border-brand-secondary', content)
    content = re.sub(r'\bborder-cyan-500\b', 'border-brand-secondary', content)
    content = re.sub(r'\bborder-indigo-400\b', 'border-brand-secondary', content)
    content = re.sub(r'\bborder-indigo-500\b', 'border-brand-secondary', content)
    content = re.sub(r'\bborder-amber-400\b', 'border-brand-primary', content)
    content = re.sub(r'\bborder-amber-500\b', 'border-brand-primary', content)

    # Rings / Shadows
    content = re.sub(r'\bring-cyan-500\b', 'ring-brand-secondary', content)
    content = re.sub(r'\bring-indigo-500\b', 'ring-brand-secondary', content)
    content = re.sub(r'\bshadow-cyan-500\b', 'shadow-brand-secondary', content)
    
    # Specific fix for XP and Achievements (which we mapped to brand-secondary because they were cyan)
    # We'll explicitly change XP strings to brand-primary
    content = re.sub(r'text-brand-secondary\b(>\{profile\.xp\})', r'text-brand-primary\1', content)
    content = re.sub(r'text-brand-secondary\b(>\{profile\.xp\} XP)', r'text-brand-primary\1', content)
    content = re.sub(r'text-brand-secondary(>XP)', r'text-brand-primary\1', content)

    with open(filepath, 'w') as f:
        f.write(content)

for root, _, filenames in os.walk('src'):
    for filename in filenames:
        if filename.endswith('.tsx') or filename.endswith('.ts'):
            process_file(os.path.join(root, filename))
            
print("Done.")
