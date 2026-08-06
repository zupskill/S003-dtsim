import os

file = 'src/utils/pdfGenerator.ts'

old_src = 'https://res.cloudinary.com/dmyxvewda/image/upload/v1731665476/ZupSkill_Blue_rxyo7c.png'
new_src = '/zupskill-logo.png'

if os.path.exists(file):
    with open(file, 'r') as f:
        content = f.read()
    
    content = content.replace(old_src, new_src)

    with open(file, 'w') as f:
        f.write(content)
