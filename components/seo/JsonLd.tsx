interface JsonLdProps {
  data: Record<string, unknown>
}

export function JsonLd({ data }: JsonLdProps) {
  // Serialize and pre-escape `<` so a stray `</script>` in user data cannot
  // terminate the inline script early. Output is server-controlled.
  const json = JSON.stringify(data).replace(/</g, '\\u003c')
  // json is server-controlled, type-restricted to plain objects, and pre-escapes `<`.
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
}
