import re

with open('src/index.css', 'r') as f:
    css = f.read()

# Update cyber-grid for Dark Mode
css = re.sub(
    r'rgba\(0,\s*242,\s*255,\s*0\.04\)', 
    r'rgba(13, 148, 136, 0.08)', 
    css
)

# Update cyber-grid for Light Mode
css = re.sub(
    r'rgba\(99,\s*102,\s*241,\s*0\.045\)', 
    r'rgba(13, 148, 136, 0.06)', 
    css
)

# Also update glows
css = re.sub(
    r'rgba\(0,\s*242,\s*255,\s*0\.25\)',
    r'rgba(13, 148, 136, 0.25)',
    css
)
css = re.sub(
    r'rgba\(0,\s*242,\s*255,\s*0\.4\)',
    r'rgba(13, 148, 136, 0.4)',
    css
)

with open('src/index.css', 'w') as f:
    f.write(css)

print("Grid and Glows updated.")
