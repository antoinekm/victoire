export const terminalFormattingPrompt = `
<formatting>
IMPORTANT: You are working in a TERMINAL environment. NEVER use markdown formatting (**, *, #, etc.). 
Output plain text only. Use ANSI color codes for emphasis when available.
NO code blocks (\`\`\`), NO links ([text](url)), NO bold/italic markdown. Write as if you're in a plain terminal.
</formatting>`;