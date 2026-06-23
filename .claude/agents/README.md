# Custom agents

Drop one `.md` file per agent here. Each file needs YAML frontmatter plus the agent's system prompt:

```markdown
---
name: my-agent
description: When to use this agent (shown to the orchestrator when picking an agent)
tools: Read, Grep, Glob   # optional — omit to inherit all tools
model: sonnet             # optional — sonnet | opus | haiku | fable
---

The agent's system prompt / instructions go here.
```

The file name (without `.md`) becomes the agent's invocable name.
