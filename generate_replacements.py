import re
import os

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Backgrounds
    content = re.sub(r'\bbg-slate-950\b', 'bg-background', content)
    content = re.sub(r'\bbg-slate-900\b', 'bg-surface', content)
    content = re.sub(r'\bbg-slate-850\b', 'bg-surface-hover', content)
    content = re.sub(r'\bbg-slate-800\b', 'bg-surface-hover', content)

    # Primary buttons (originally cyan-400 for primary, blue-600 for google, indigo for something else)
    content = re.sub(r'\bbg-cyan-400\b', 'bg-brand-primary', content)
    content = re.sub(r'\bhover:bg-cyan-300\b', 'hover:bg-brand-primary-hover', content)
    
    # Secondary buttons / general background highlights
    content = re.sub(r'\bbg-cyan-500\b', 'bg-brand-secondary', content)
    content = re.sub(r'\bhover:bg-cyan-400\b', 'hover:bg-brand-secondary-hover', content)
    
    # Blue/Indigo to secondary
    content = re.sub(r'\bbg-blue-600\b', 'bg-brand-secondary', content)
    content = re.sub(r'\bhover:bg-blue-700\b', 'hover:bg-brand-secondary-hover', content)
    content = re.sub(r'\bbg-indigo-600\b', 'bg-brand-secondary', content)
    content = re.sub(r'\bhover:bg-indigo-500\b', 'hover:bg-brand-secondary-hover', content)

    # Text
    content = re.sub(r'\btext-white\b', 'text-text-primary', content)
    content = re.sub(r'\btext-slate-100\b', 'text-text-primary', content)
    content = re.sub(r'\btext-slate-200\b', 'text-text-primary', content)
    content = re.sub(r'\btext-slate-300\b', 'text-text-secondary', content)
    content = re.sub(r'\btext-slate-400\b', 'text-text-secondary', content)
    content = re.sub(r'\btext-slate-500\b', 'text-text-tertiary', content)
    content = re.sub(r'\btext-slate-600\b', 'text-text-tertiary', content)

    # Borders
    content = re.sub(r'\bborder-slate-900\b', 'border-border', content)
    content = re.sub(r'\bborder-slate-800\b', 'border-border', content)
    content = re.sub(r'\bborder-slate-700\b', 'border-border-subtle', content)

    # Accent Texts (cyan to brand-secondary)
    content = re.sub(r'\btext-cyan-400\b', 'text-brand-secondary', content)
    content = re.sub(r'\btext-cyan-500\b', 'text-brand-secondary', content)
    content = re.sub(r'\btext-indigo-400\b', 'text-brand-secondary', content)
    content = re.sub(r'\btext-indigo-500\b', 'text-brand-secondary', content)
    
    # Golden/Amber to brand-primary
    content = re.sub(r'\btext-amber-400\b', 'text-brand-primary', content)
    content = re.sub(r'\btext-amber-500\b', 'text-brand-primary', content)
    content = re.sub(r'\btext-yellow-400\b', 'text-brand-primary', content)
    content = re.sub(r'\btext-yellow-500\b', 'text-brand-primary', content)

    # Border accents
    content = re.sub(r'\bborder-cyan-400\b', 'border-brand-secondary', content)
    content = re.sub(r'\bborder-cyan-500\b', 'border-brand-secondary', content)
    content = re.sub(r'\bborder-amber-400\b', 'border-brand-primary', content)
    content = re.sub(r'\bborder-amber-500\b', 'border-brand-primary', content)

    # Shadow/Glow
    content = re.sub(r'\bshadow-cyan-500\b', 'shadow-brand-secondary', content)
    content = re.sub(r'\bshadow-amber-500\b', 'shadow-brand-primary', content)

    return content

print(process_file('src/components/LandingScreen.tsx')[:2000])
