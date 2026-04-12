type Props = {
  data: unknown;
};

export default function JsonLdScript({ data }: Props) {
  if (!data) return null;

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
