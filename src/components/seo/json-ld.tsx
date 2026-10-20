type Props = {
  // schema-dts types are interfaces, which `Record<string, unknown>` rejects.
  data: object;
};

/**
 * Renders schema.org structured data as a `<script type="application/ld+json">`.
 * `<` is escaped so a value containing `</script>` can't break out of the tag.
 */
export function JsonLd({ data }: Props) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
