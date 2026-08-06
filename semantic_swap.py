import os

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # We want to swap 'brand-primary' and 'brand-secondary'
    # To do this safely, we use a temporary placeholder
    content = content.replace('brand-primary', 'brand-TEMP_PRI')
    content = content.replace('brand-secondary', 'brand-primary')
    content = content.replace('brand-TEMP_PRI', 'brand-secondary')

    with open(filepath, 'w') as f:
        f.write(content)

for root, _, filenames in os.walk('src'):
    for filename in filenames:
        if filename.endswith(('.tsx', '.ts', '.css')):
            process_file(os.path.join(root, filename))

print("Swapped primary and secondary semantics.")
