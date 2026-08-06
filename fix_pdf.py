import os

file = 'src/utils/pdfGenerator.ts'

old_src = 'logoImg.src = "/zupskill-logo.png";'
new_src = 'import zupskillLogo from "../assets/zupskill-logo.png";\n    logoImg.src = zupskillLogo;'

if os.path.exists(file):
    with open(file, 'r') as f:
        content = f.read()
    
    if 'import zupskillLogo' not in content:
        lines = content.split('\n')
        last_import = -1
        for i, line in enumerate(lines):
            if line.startswith('import '):
                last_import = i
        
        if last_import != -1:
            lines.insert(last_import + 1, 'import zupskillLogo from "../assets/zupskill-logo.png";')
            content = '\n'.join(lines)
            
    content = content.replace('logoImg.src = "/zupskill-logo.png";', 'logoImg.src = zupskillLogo;')

    with open(file, 'w') as f:
        f.write(content)
