import re

with open('src/components/ProfileSection.tsx', 'r') as f:
    content = f.read()

# Replace brand-secondary with brand-primary for XP and Achievements
content = content.replace(
    'text-3xl font-bold text-brand-secondary mb-1">{profile.xp}',
    'text-3xl font-bold text-brand-primary mb-1">{profile.xp}'
)

content = content.replace(
    'text-xl font-black uppercase text-brand-secondary block tracking-tight">{profile.level}',
    'text-xl font-black uppercase text-brand-primary block tracking-tight">{profile.level}'
)

content = content.replace(
    'bg-brand-secondary/20 px-3.5 py-1.5 rounded-full border border-brand-secondary/20 text-brand-secondary text-xs',
    'bg-brand-primary/20 px-3.5 py-1.5 rounded-full border border-brand-primary/20 text-brand-primary text-xs'
)

content = content.replace(
    '<span className="text-brand-secondary">{profile.xp}',
    '<span className="text-brand-primary">{profile.xp}'
)

content = content.replace(
    'bg-gradient-to-r from-brand-secondary to-brand-secondary/80 rounded-full',
    'bg-gradient-to-r from-brand-primary to-brand-primary/80 rounded-full shadow-[0_0_8px_rgba(255,200,61,0.4)]'
)

# Achievements Grid colors
content = content.replace(
    'isUnlocked\n                          ? "bg-brand-secondary/20 border-brand-secondary/25 text-brand-secondary"',
    'isUnlocked\n                          ? "bg-brand-primary/10 border-brand-primary/30 text-brand-primary"'
)

content = content.replace(
    'isUnlocked ? "bg-brand-secondary/30 border-brand-secondary/30 text-brand-secondary"',
    'isUnlocked ? "bg-brand-primary/20 border-brand-primary/40 text-brand-primary"'
)

with open('src/components/ProfileSection.tsx', 'w') as f:
    f.write(content)

