import os

files = [
    'src/App.tsx',
    'src/components/LandingScreen.tsx',
    'src/components/AuthScreen.tsx',
    'src/components/ProfileSetupScreen.tsx'
]

old_img_1 = """            <img 
              src="/zupskill-logo.png" 
              alt="ZupSkill" 
              className="h-[36px] w-auto max-w-[180px] object-contain block" 
            />"""

old_img_2 = """          <img 
            src="/zupskill-logo.png" 
            alt="ZupSkill" 
            className="h-[36px] w-auto max-w-[180px] object-contain block" 
          />"""

placeholder_1 = """          <div className="w-10 h-10 bg-gradient-to-br from-brand-primary to-brand-primary/80 rounded-lg flex items-center justify-center font-black text-black text-lg shadow-[0_0_15px_rgba(0,181,230,0.4)]">
            ZS
          </div>"""

placeholder_2 = """          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-brand-primary to-brand-primary/80 rounded-lg flex items-center justify-center font-black text-black text-sm sm:text-lg shadow-[0_0_15px_rgba(0,181,230,0.4)]">
            ZS
          </div>"""

new_img = """          <img
            src="/zupskill-logo.png"
            alt="ZupSkill"
            className="h-10 w-auto object-contain select-none"
          />"""

for file in files:
    if os.path.exists(file):
        with open(file, 'r') as f:
            content = f.read()
        
        # Replace the ones I added
        content = content.replace(old_img_1, new_img)
        content = content.replace(old_img_2, new_img)
        # Replace the placeholders
        content = content.replace(placeholder_1, new_img)
        content = content.replace(placeholder_2, new_img)

        with open(file, 'w') as f:
            f.write(content)
