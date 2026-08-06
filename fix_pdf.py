import re

with open('src/utils/pdfGenerator.ts', 'r') as f:
    content = f.read()

content = content.replace('6, 182, 212', '0, 181, 230')
content = content.replace('240, 253, 250', '230, 247, 253') # Light azure bg
content = content.replace('20, 184, 166', '0, 181, 230') # Border azure
content = content.replace('15, 118, 110', '0, 158, 209') # Dark azure text

with open('src/utils/pdfGenerator.ts', 'w') as f:
    f.write(content)

