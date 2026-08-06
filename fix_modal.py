with open('src/components/NewSimConfirmModal.tsx', 'r') as f:
    content = f.read()

content = content.replace("recap?.topicTitle", "recap?.challenge")
content = content.replace("recap.topicTitle", "recap.challenge")
content = content.replace("recap?.prototypeTitle", "recap?.prototypeSummary")
content = content.replace("recap.prototypeTitle", "recap.prototypeSummary")

with open('src/components/NewSimConfirmModal.tsx', 'w') as f:
    f.write(content)
