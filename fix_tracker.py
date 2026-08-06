import re

with open('src/components/ProgressTracker.tsx', 'r') as f:
    content = f.read()

# Fix Completed Missions to Golden Yellow (brand-primary)
content = content.replace(
    'isCompleted\n                    ? "bg-surface-hover/80 text-brand-secondary font-medium cursor-pointer hover:bg-surface-hover border border-brand-secondary/20 shadow-[0_0_8px_rgba(6,182,212,0.1)]"',
    'isCompleted\n                    ? "bg-surface-hover/80 text-brand-primary font-medium cursor-pointer hover:bg-surface-hover border border-brand-primary/20 shadow-[0_0_8px_rgba(255,200,61,0.1)]"'
)
content = content.replace(
    'isCompleted\n                      ? "bg-brand-secondary/20 text-brand-secondary"',
    'isCompleted\n                      ? "bg-brand-primary/20 text-brand-primary"'
)
# Connector Lines: Subtle Azure
content = content.replace(
    'stage.num < currentStage\n                      ? "bg-gradient-to-r from-brand-secondary to-brand-secondary/80 shadow-[0_0_6px_rgba(59,130,246,0.3)]"',
    'stage.num < currentStage\n                      ? "bg-gradient-to-r from-brand-secondary/50 to-brand-secondary/30 shadow-[0_0_6px_rgba(0,181,230,0.3)]"'
)

with open('src/components/ProgressTracker.tsx', 'w') as f:
    f.write(content)
