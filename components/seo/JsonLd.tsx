interface JsonLdProps {
  data: Record<string, unknown>
}

export function JsonLd({ data }: JsonLdProps) {
  // Serialize and pre-escape `<` so a stray `</script>` in user data cannot
  // terminate the inline script early. Output is server-controlled.
  const json = JSON.stringify(data).replace(/</g, '\\u003c')
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger -- json-ld is server-generated, type-restricted, with `<` pre-escaped
      dangerouslySetInnerHTML={{ __html: json }}
    />
  )
}
