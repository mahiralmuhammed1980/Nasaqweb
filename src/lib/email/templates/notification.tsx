import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export type NotificationEmailProps = {
  locale: "ar" | "en";
  siteName: string;
  preview: string;
  heading: string;
  intro?: string;
  /** جدول مفاتيح/قيم (تفاصيل الطلب...) */
  details?: { label: string; value: string }[];
  /** نص حر (رسالة، ردّ المدير) يُعرض بحفظ أسطره */
  body?: string;
  cta?: { label: string; url: string };
  footer?: string;
};

/** قالب واحد لكل رسائل النظام: عربي RTL أو إنجليزي LTR بنفس الهوية. */
export function NotificationEmail({
  locale,
  siteName,
  preview,
  heading,
  intro,
  details,
  body,
  cta,
  footer,
}: NotificationEmailProps) {
  const dir = locale === "ar" ? "rtl" : "ltr";
  const align = locale === "ar" ? "right" : "left";
  return (
    <Html lang={locale} dir={dir}>
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: "#f6f7f9",
          fontFamily: "Arial, sans-serif",
          direction: dir,
          textAlign: align,
        }}
      >
        <Container
          style={{
            backgroundColor: "#ffffff",
            margin: "24px auto",
            padding: "24px",
            maxWidth: 560,
          }}
        >
          <Text style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
            {siteName}
          </Text>
          <Heading as="h1" style={{ fontSize: 20, margin: "8px 0 16px" }}>
            {heading}
          </Heading>
          {intro && <Text style={{ fontSize: 15 }}>{intro}</Text>}
          {details && details.length > 0 && (
            <Section>
              {details.map((row) => (
                <Text key={row.label} style={{ fontSize: 14, margin: "4px 0" }}>
                  <strong>{row.label}:</strong> {row.value}
                </Text>
              ))}
            </Section>
          )}
          {body && (
            <>
              <Hr />
              <Text style={{ fontSize: 14, whiteSpace: "pre-wrap" }}>
                {body}
              </Text>
            </>
          )}
          {cta && (
            <Section style={{ textAlign: "center", margin: "24px 0" }}>
              <Button
                href={cta.url}
                style={{
                  backgroundColor: "#3730a3",
                  color: "#ffffff",
                  padding: "12px 24px",
                  borderRadius: 6,
                }}
              >
                {cta.label}
              </Button>
            </Section>
          )}
          {footer && (
            <Text style={{ color: "#6b7280", fontSize: 12 }}>{footer}</Text>
          )}
        </Container>
      </Body>
    </Html>
  );
}
