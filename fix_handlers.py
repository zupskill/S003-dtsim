import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Replace the inner definition of signInWithGoogle
content = re.sub(r'  const signInWithGoogle = async \(\) => \{.*?  \};', '', content, flags=re.DOTALL)

# Replace the inner definition of signOut
content = re.sub(r'  const signOut = async \(\) => \{.*?  \};', '', content, flags=re.DOTALL)

with open('src/App.tsx', 'w') as f:
    f.write(content)
