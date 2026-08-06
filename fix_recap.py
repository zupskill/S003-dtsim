import re

with open('src/components/RecapScreen.tsx', 'r') as f:
    content = f.read()

# Make download button Azure Blue (brand-secondary)
content = content.replace(
    "? 'bg-surface border-border-subtle hover:bg-surface-hover text-text-primary'",
    "? 'bg-brand-secondary text-text-primary hover:bg-brand-secondary-hover border-brand-secondary'"
)
content = content.replace(
    ": 'bg-background border-slate-300 hover:bg-surface text-slate-900'",
    ": 'bg-brand-secondary text-white hover:bg-brand-secondary-hover border-brand-secondary'"
)

with open('src/components/RecapScreen.tsx', 'w') as f:
    f.write(content)
