import os

file = 'src/App.tsx'

placeholder = """          <div className="w-16 h-16 bg-gradient-to-tr from-brand-primary to-brand-primary/80 rounded-2xl flex items-center justify-center mx-auto text-xl font-mono text-black font-black shadow-[0_0_20px_rgba(0,181,230,0.3)]">
            ZS
          </div>"""

new_img = """          <img
            src="/zupskill-logo.png"
            alt="ZupSkill"
            className="h-16 w-auto object-contain mx-auto select-none"
          />"""

if os.path.exists(file):
    with open(file, 'r') as f:
        content = f.read()
    
    content = content.replace(placeholder, new_img)

    with open(file, 'w') as f:
        f.write(content)
