import re

# EmpathizeStage.tsx
with open('src/components/EmpathizeStage.tsx', 'r') as f:
    content = f.read()

target_textarea = """                    <textarea
                      rows={3}"""

replacement_textarea = """                    <textarea
                      rows={3}
                      maxLength={512}"""

content = content.replace(target_textarea, replacement_textarea)

with open('src/components/EmpathizeStage.tsx', 'w') as f:
    f.write(content)


# IdeateStage.tsx
with open('src/components/IdeateStage.tsx', 'r') as f:
    content = f.read()

target_ideate_input = """                      <input
                        type="text"
                        placeholder="e.g. Provide a specialized shuttle vehicle..."
                        value={singleInput}"""

replacement_ideate_input = """                      <input
                        type="text"
                        maxLength={126}
                        placeholder="e.g. Provide a specialized shuttle vehicle..."
                        value={singleInput}"""

content = content.replace(target_ideate_input, replacement_ideate_input)

with open('src/components/IdeateStage.tsx', 'w') as f:
    f.write(content)


# ProfileSetupScreen.tsx
with open('src/components/ProfileSetupScreen.tsx', 'r') as f:
    content = f.read()

content = re.sub(r'(<input\s*\n\s*type="(text|email|tel)"\s*\n\s*required\s*\n\s*value=\{)', r'\1', content)
# wait, it's easier to just do a string replacement for each input type

target_profile_input = """                <input
                  type="text"
                  required
                  value="""

replacement_profile_input = """                <input
                  type="text"
                  maxLength={126}
                  required
                  value="""
content = content.replace(target_profile_input, replacement_profile_input)

target_profile_email = """                <input
                  type="email"
                  required
                  value="""
replacement_profile_email = """                <input
                  type="email"
                  maxLength={126}
                  required
                  value="""
content = content.replace(target_profile_email, replacement_profile_email)

target_profile_tel = """                <input
                  type="tel"
                  required
                  value="""
replacement_profile_tel = """                <input
                  type="tel"
                  maxLength={126}
                  required
                  value="""
content = content.replace(target_profile_tel, replacement_profile_tel)

with open('src/components/ProfileSetupScreen.tsx', 'w') as f:
    f.write(content)

