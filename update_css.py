import re

with open('src/index.css', 'r') as f:
    css = f.read()

theme_tokens = """
@theme {
  --color-brand-primary: var(--brand-primary);
  --color-brand-primary-hover: var(--brand-primary-hover);
  --color-brand-secondary: var(--brand-secondary);
  --color-brand-secondary-hover: var(--brand-secondary-hover);
  --color-background: var(--background);
  --color-surface: var(--surface);
  --color-surface-hover: var(--surface-hover);
  --color-border: var(--border);
  --color-border-subtle: var(--border-subtle);
  --color-text-primary: var(--text-primary);
  --color-text-secondary: var(--text-secondary);
  --color-text-tertiary: var(--text-tertiary);
}

:root {
  /* DARK MODE DEFAULTS */
  --brand-primary: #eab308; /* Golden Yellow */
  --brand-primary-hover: #facc15;
  --brand-secondary: #0d9488; /* Teal Blue */
  --brand-secondary-hover: #14b8a6;
  
  --background: #05070a; /* Deep Navy with teal gradient overlay handled separately */
  --surface: #0f172a; 
  --surface-hover: #1e293b;
  
  --border: rgba(13, 148, 136, 0.3); /* Soft teal border */
  --border-subtle: rgba(13, 148, 136, 0.15);
  
  --text-primary: #ffffff;
  --text-secondary: #94a3b8; /* Cool Gray */
  --text-tertiary: #64748b;
}

.light, .light body {
  /* LIGHT MODE OVERRIDES */
  --background: #f8fafc; /* Soft White */
  --surface: #ffffff;
  --surface-hover: #f1f5f9;
  
  --border: rgba(13, 148, 136, 0.2); /* Soft blue/teal border */
  --border-subtle: rgba(13, 148, 136, 0.1);
  
  --text-primary: #0f172a; /* Dark Navy */
  --text-secondary: #64748b; /* Gray */
  --text-tertiary: #94a3b8;
}
"""

if "@theme {" not in css:
    css = css.replace('@import "tailwindcss";', '@import "tailwindcss";\n\n' + theme_tokens)

with open('src/index.css', 'w') as f:
    f.write(css)

print("CSS updated.")
