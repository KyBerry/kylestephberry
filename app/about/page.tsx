import type { Metadata } from 'next'
import { Container } from '@/components/ui/Container'
import { site } from '@/lib/site'

export const metadata: Metadata = {
  title: 'About',
  description:
    'Kyle Berry is a design engineer in Denver building data-dense product UIs, design systems, and motion-forward, accessible interfaces.',
}

const skillGroups: { label: string; items: string[] }[] = [
  {
    label: 'Frontend',
    items: [
      'React',
      'Next.js',
      'Vue 2/3',
      'Nuxt',
      'Angular',
      'TypeScript',
      'JavaScript',
      'Tailwind CSS',
      'Web Components',
      'SSR',
    ],
  },
  {
    label: 'Backend',
    items: [
      'Node.js',
      'TypeScript',
      'TypeGraphQL',
      'GraphQL',
      'Apollo Server',
      'Apollo Federation',
      'REST',
      'Python',
      'Elixir',
      'PHP',
    ],
  },
  {
    label: 'Architecture',
    items: ['Micro-Frontends', 'Microservices', 'CI/CD Pipelines'],
  },
  {
    label: 'Infrastructure',
    items: ['AWS', 'DigitalOcean', 'Docker', 'Kubernetes'],
  },
  {
    label: 'Data & Monitoring',
    items: ['PostgreSQL', 'MongoDB', 'Highcharts', 'Datadog', 'FullStory'],
  },
  {
    label: 'Testing',
    items: ['React Testing Library', 'Jest', 'Vitest'],
  },
  {
    label: 'Design',
    items: ['Figma', 'Sketch', 'User Research', 'Prototyping', 'Design Systems'],
  },
]

const education: { institution: string; credential: string; year?: string }[] = [
  {
    institution: 'Southern New Hampshire University',
    credential: 'B.S., Computer Science (Online)',
    year: '2018',
  },
  {
    institution: 'Udacity',
    credential: 'Full Stack Web Development (Online)',
    year: '2020',
  },
  {
    institution: 'OpenClassrooms',
    credential: 'Back-End Developer: Java (Online)',
  },
]

export default function AboutPage() {
  return (
    <Container variant="grid" as="section" className="py-24 md:py-32">
      <header className="mb-12 md:mb-16">
        <p className="mb-4 font-mono text-xs tracking-[0.18em] text-(--color-fg-subtle) uppercase">
          About
        </p>
        <h1 className="text-4xl font-medium tracking-[-0.025em] text-balance text-(--color-fg) md:text-5xl">
          I design and build product interfaces
        </h1>
        <p className="mt-4 max-w-prose text-(--color-fg-muted)">
          Mostly data-dense dashboards, the design systems behind them, and the interaction
          details in between.
        </p>
      </header>

      {/* Bio: two tight first-person paragraphs, design-engineer framing */}
      <div className="max-w-[var(--container-prose)] space-y-5 text-lg leading-relaxed text-pretty text-(--color-fg-muted)">
        <p>
          I&rsquo;m a design engineer based in {site.location}. I care most about the things people
          actually use: data-dense dashboards, design systems, and interfaces that stay accessible
          when the data gets messy. Lately that&rsquo;s meant building the Accountant Console at
          BILL and real-time AI streaming interfaces at AirframeAI. Before that I led frontend and
          design systems at Truvy.
        </p>
        <p>
          I&rsquo;m comfortable well past the browser, too. I&rsquo;ve built GraphQL services and
          federated APIs, moved legacy systems onto modern architectures, and run my own cloud
          infrastructure. I don&rsquo;t treat that as a separate job; it just helps me make better
          product calls. I like working closely with designers, mentoring other engineers, and
          closing the gap between a Figma file and what actually ships.
        </p>
      </div>

      <p className="mt-6 max-w-prose font-mono text-xs text-(--color-fg-subtle)">
        <span className="mr-2 text-(--color-accent)">→</span>
        {site.currentFocus}
      </p>

      {/* Skills: grouped, scannable; chips match the WorkTimeline badge idiom */}
      <section className="mt-20 md:mt-24" aria-labelledby="about-skills">
        <h2
          id="about-skills"
          className="mb-8 font-mono text-xs tracking-[0.18em] text-(--color-fg-subtle) uppercase"
        >
          Skills
        </h2>
        <dl className="divide-y divide-(--color-border)">
          {skillGroups.map((group) => (
            <div
              key={group.label}
              className="grid grid-cols-1 gap-x-8 gap-y-3 py-5 md:grid-cols-[160px_1fr]"
            >
              <dt className="font-mono text-xs text-(--color-fg-subtle) md:pt-1">{group.label}</dt>
              <dd>
                <ul className="flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <li
                      key={item}
                      className="rounded-md border border-(--color-border) px-2.5 py-1 text-sm text-(--color-fg-muted)"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Education: institution + credential, font-mono years */}
      <section className="mt-20 md:mt-24" aria-labelledby="about-education">
        <h2
          id="about-education"
          className="mb-8 font-mono text-xs tracking-[0.18em] text-(--color-fg-subtle) uppercase"
        >
          Education
        </h2>
        <ol className="divide-y divide-(--color-border)">
          {education.map((entry) => (
            <li
              key={entry.institution}
              className="grid grid-cols-[1fr_auto] items-baseline gap-x-8 gap-y-1 py-5"
            >
              <div className="flex flex-col gap-1">
                <span className="font-medium text-(--color-fg)">{entry.institution}</span>
                <span className="text-sm text-(--color-fg-muted)">{entry.credential}</span>
              </div>
              {entry.year ? (
                <span className="font-mono text-xs text-(--color-fg-subtle)">{entry.year}</span>
              ) : null}
            </li>
          ))}
        </ol>
      </section>
    </Container>
  )
}
