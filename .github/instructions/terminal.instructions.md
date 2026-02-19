---
description: Global instructions when using with terminal
applyTo: "**/*.agent.md"
---

Never run any long command in the terminal.
If possible, put the payload/input into a file in `./.tmp` (using internal writting tools, instead of using terminal) and run the command with the file as input. Don't forget to clean up the file after use.