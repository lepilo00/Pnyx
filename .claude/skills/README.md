# Custom skills

Each skill is a subdirectory containing a `SKILL.md` file:

```
.claude/skills/
  my-skill/
    SKILL.md
```

`SKILL.md` format:

```markdown
---
name: my-skill
description: One-line summary shown when the skill is matched/invoked
---

Instructions for what the skill should do when invoked, written as you'd
brief Claude directly.
```

Invoke with `/my-skill` (optionally followed by arguments) once it's in place.
