export const ACTION_REGISTRY = {
  EMAIL: {
    label: 'Create Gmail Draft',
    description: 'Creates a Gmail draft from this Email artifact.',
    tool: 'GMAIL_CREATE_EMAIL_DRAFT',
    connector: 'gmail',
    requiresInput: [
      { key: 'recipient_email', label: 'Recipient email address', placeholder: 'name@example.com' },
    ],
    buildArgs(artifact, userInput = {}) {
      const sections = Array.isArray(artifact?.sections) ? artifact.sections : []
      const subjectSection = sections.find((section) => section?.label === 'Subject Line')
      const bodySection = sections.find((section) => section?.label === 'Body')

      return {
        recipient_email: userInput.recipient_email || '',
        subject: subjectSection?.content || artifact?.title || '',
        body: bodySection?.content || '',
        is_html: false,
      }
    },
  },

  TEAM_BRIEF: {
    label: 'Post to Slack',
    description: 'Posts this Team Brief to a Slack channel.',
    tool: 'SLACK_SEND_MESSAGE',
    connector: 'slack',
    requiresInput: [
      { key: 'channel', label: 'Slack channel', placeholder: '#general or channel ID' },
    ],
    buildArgs(artifact, userInput = {}) {
      const sections = Array.isArray(artifact?.sections) ? artifact.sections : []
      const markdown = sections
        .map((section) => `*${section.label || 'Section'}*\n${section.content || ''}`)
        .join('\n\n')

      return {
        channel: userInput.channel || '',
        markdown_text: `*${artifact?.title || 'Team Brief'}*\n\n${markdown}`.trim(),
        fallback_text: artifact?.summary || artifact?.title || 'Team Brief',
      }
    },
  },

  ACTION_PLAN: {
    label: 'Push to Notion',
    description: 'Creates a Notion page from this Action Plan.',
    tool: 'NOTION_CREATE_NOTION_PAGE',
    connector: 'notion',
    requiresInput: [
      { key: 'parent_id', label: 'Notion page or database ID', placeholder: 'Paste Notion page ID' },
    ],
    buildArgs(artifact, userInput = {}) {
      const sections = Array.isArray(artifact?.sections) ? artifact.sections : []
      const markdown = sections
        .map((section) => `## ${section.label || 'Section'}\n\n${section.content || ''}`)
        .join('\n\n')

      return {
        parent_id: userInput.parent_id || '',
        title: artifact?.title || 'Action Plan',
        markdown,
      }
    },
  },
}

export function getActionForArtifact(artifactType) {
  return ACTION_REGISTRY[artifactType] ?? null
}
