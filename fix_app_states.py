import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

replacement = """  const { 
    user, profile, setProfile, isLoading: loadingAuth, 
    saveStageLocally, syncCompletion, signOut, signInWithGoogle 
  } = useRuntime();

  const [showAccountChooser, setShowAccountChooser] = useState<boolean>(false);
  const [showNewSimConfirm, setShowNewSimConfirm] = useState<boolean>(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);
"""

content = content.replace("""  const { 
    user, profile, setProfile, isLoading: loadingAuth, 
    saveStageLocally, syncCompletion, signOut, signInWithGoogle 
  } = useRuntime();
""", replacement)

with open('src/App.tsx', 'w') as f:
    f.write(content)
