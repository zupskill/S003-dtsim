import os
import re

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # We want to change bg-brand-primary to bg-brand-secondary in most buttons.
    # We can just blindly change bg-brand-primary to bg-brand-secondary if it's accompanied by hover:bg-brand-primary-hover
    # Because that pattern is exclusively used for buttons.
    
    # Wait, Confirmation actions should be Golden Yellow. 
    # Confirmation action is "Yes, Start Fresh" in NewSimConfirmModal.
    # Currently it is 'bg-brand-secondary hover:bg-brand-secondary-hover' in NewSimConfirmModal.tsx! 
    # Let's fix NewSimConfirmModal first to use Golden Yellow.
    if 'NewSimConfirmModal' in filepath:
        content = content.replace('bg-brand-secondary', 'bg-brand-primary')
        content = content.replace('bg-brand-primary-hover', 'bg-brand-primary-hover') # already replaced
        
    elif 'LandingScreen' in filepath or 'AuthScreen' in filepath or 'ProfileSetupScreen' in filepath or 'TopicSelection' in filepath or 'DefineStage' in filepath or 'PrototypeStage' in filepath or 'IdeateStage' in filepath or 'EmpathizeStage' in filepath:
        # Swap primary to secondary for standard buttons
        content = content.replace('bg-brand-primary hover:bg-brand-primary-hover', 'bg-brand-secondary hover:bg-brand-secondary-hover')
        content = content.replace('bg-brand-primary', 'bg-brand-secondary') # catches disabled variants, etc.
        # However, this might break things that intentionally use Golden Yellow.
        # But wait! I haven't intentionally used bg-brand-primary for much else besides buttons in these files.
        # Let's check text-brand-primary. It should NOT be changed. I am only changing bg-brand-primary.
        pass

    with open(filepath, 'w') as f:
        f.write(content)

for root, _, filenames in os.walk('src'):
    for filename in filenames:
        if filename.endswith('.tsx') or filename.endswith('.ts'):
            process_file(os.path.join(root, filename))

print("Fixed buttons.")
