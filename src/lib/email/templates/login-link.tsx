import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export type LoginLinkEmailProps = {
  locale: "ar" | "en";
  url: string;
  siteName: string;
  texts: {
    preview: string;
    heading: string;
    body: string;
    button: string;
    ignore: string;
  };
};

export function LoginLinkEmail({
  locale,
  url,
  siteName,
  texts,
}: LoginLinkEmailProps) {
  const dir = locale === "ar" ? "rtl" : "ltr";
  return (
    <Html lang={locale} dir={dir}>
      <Head />
      <Preview>{texts.preview}</Preview>
      <Body
        style={{
          backgroundColor: "#f6f7f9",
          fontFamily: "Arial, sans-serif",
          direction: dir,
        }}
      >
        <Container
          style={{
            backgroundColor: "#ffffff",
            margin: "24px auto",
            padding: "24px",
            maxWidth: 480,
          }}
        >
          <Heading as="h1" style={{ fontSize: 20 }}>
            {siteName}
          </Heading>
          <Text style={{ fontSize: 16 }}>{texts.heading}</Text>
          <Text>{texts.body}</Text>
          <Section style={{ textAlign: "center", margin: "24px 0" }}>
            <Button
              href={url}
              style={{
                backgroundColor: "#3730a3",
                color: "#ffffff",
                padding: "12px 24px",
                borderRadius: 6,
              }}
            >
              {texts.button}
            </Button>
          </Section>
          <Text style={{ color: "#6b7280", fontSize: 13 }}>{texts.ignore}</Text>
        </Container>
      </Body>
    </Html>
  );
}
