import { Body, Container, Head, Heading, Html, Link, Section, Text } from "@react-email/components";

export function MagicLinkEmail({ link }: { link: string }) {
  return (
    <Html dir="rtl" lang="he">
      <Head />
      <Body style={{ background: "#0A0E14", color: "#F5F5F0", fontFamily: "Heebo, Inter, sans-serif", margin: 0 }}>
        <Container style={{ padding: 32, maxWidth: 540 }}>
          <Heading style={{ fontWeight: 900, fontSize: 28, color: "#F5F5F0" }}>
            תשלם לי
          </Heading>
          <Section style={{ background: "#0c1118", padding: 24, borderRadius: 16, marginTop: 24 }}>
            <Text style={{ fontSize: 16, color: "#F5F5F0" }}>
              הקליקי על הקישור כדי להיכנס לחשבון. הקישור תקף ל-15 דקות.
            </Text>
            <Link href={link} style={{ background: "#C6F432", color: "#0A0E14", padding: "12px 24px", borderRadius: 999, fontWeight: 700, textDecoration: "none", display: "inline-block", marginTop: 16 }}>
              כניסה לחשבון
            </Link>
          </Section>
          <Text style={{ color: "#74777f", fontSize: 12, marginTop: 32 }}>
            לא ביקשת? התעלמי מהמייל הזה.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
