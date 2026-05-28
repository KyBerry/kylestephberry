export const site = {
  name: 'Kyle Berry',
  role: 'Design Engineer',
  location: 'Denver, CO',
  currentFocus: 'Design systems, motion, and accessible interfaces',
  shortBio:
    'I build data-dense product UIs and design systems, and I care a lot about how they move and feel. Currently at BILL.',
  url: 'https://kylestephberry.com',
  email: 'kylestephberry@gmail.com',
  socials: [
    { label: 'X', href: 'https://x.com/kylestephberry' },
    { label: 'GitHub', href: 'https://github.com/KyBerry' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/kyleberryofficial' },
  ],
  nav: [
    { label: 'Components', href: '/components' },
    { label: 'Designs', href: '/designs' },
    { label: 'Writing', href: '/blog' },
    { label: 'About', href: '/about' },
  ],
} as const

export type SiteMetadata = typeof site
