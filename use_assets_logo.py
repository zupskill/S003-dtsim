import os

files = [
    'src/App.tsx',
    'src/components/LandingScreen.tsx',
    'src/components/AuthScreen.tsx',
    'src/components/ProfileSetupScreen.tsx'
]

old_img = """          <img
            src="/zupskill-logo.png"
            alt="ZupSkill"
            className="h-10 w-auto object-contain select-none"
          />"""

new_img = """          <img
            src={zupskillLogo}
            alt="ZupSkill"
            className="h-10 w-auto object-contain select-none"
          />"""
          
old_img_app = """          <img
            src="/zupskill-logo.png"
            alt="ZupSkill"
            className="h-16 w-auto object-contain mx-auto select-none"
          />"""

new_img_app = """          <img
            src={zupskillLogo}
            alt="ZupSkill"
            className="h-16 w-auto object-contain mx-auto select-none"
          />"""

import_statement = 'import zupskillLogo from "@/assets/zupskill-logo.png";\n'
import_statement2 = 'import zupskillLogo from "../assets/zupskill-logo.png";\n'

for file in files:
    if os.path.exists(file):
        with open(file, 'r') as f:
            content = f.read()
            
        if 'import zupskillLogo' not in content:
            # Find the last import
            lines = content.split('\n')
            last_import = -1
            for i, line in enumerate(lines):
                if line.startswith('import '):
                    last_import = i
            
            if last_import != -1:
                # Add import after last import
                if file == 'src/App.tsx':
                     lines.insert(last_import + 1, import_statement)
                else:
                     lines.insert(last_import + 1, import_statement2)
                content = '\n'.join(lines)
        
        content = content.replace(old_img, new_img)
        content = content.replace(old_img_app, new_img_app)

        with open(file, 'w') as f:
            f.write(content)

