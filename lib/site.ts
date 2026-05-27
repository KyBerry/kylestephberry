export const site = {
  name: 'Kyle Berry',
  role: 'Design Engineer',
  shortBio:
    'Design engineer building thoughtful interfaces. I work across product design, frontend craft, and motion.',
  url: 'https://kylestephberry.com',
  email: 'kylestephberry@gmail.com',
  socials: [
    { label: 'X', href: 'https://x.com/kylestephberry' },
    { label: 'GitHub', href: 'https://github.com/kylestephberry' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/kylestephberry' },
    { label: 'Figma', href: 'https://www.figma.com/@kylestephberry' },
  ],
  nav: [
    { label: 'Components', href: '/components' },
    { label: 'Designs', href: '/designs' },
    { label: 'Writing', href: '/blog' },
  ],
} as const

export type SiteMetadata = typeof site
