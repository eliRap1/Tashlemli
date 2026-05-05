import React from "react";
import { Document, Page, Text, StyleSheet, Font } from "@react-pdf/renderer";

Font.register({ family: "Heebo", src: "https://fonts.gstatic.com/s/heebo/v26/NGSpv5_NC0k9P_v6Z8E.ttf" });

const s = StyleSheet.create({
  page: { padding: 48, fontFamily: "Heebo", direction: "rtl", fontSize: 11, color: "#0a0e14" },
  h1: { fontSize: 18, fontWeight: 700, marginBottom: 16 },
});

export function PoaPDF(p: { full_name: string; israeli_id: string; date_of_birth: string; address: string; phone: string; claim_id: string; lawyer_name: string; bar_license_number: string }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.h1}>ייפוי כוח</Text>
        <Text>אני הח״מ {p.full_name}, ת״ז {p.israeli_id}, ילוד/ה {p.date_of_birth}, מרחוב {p.address}, טלפון {p.phone},</Text>
        <Text style={{ marginTop: 12 }}>ממנה בזאת את עו״ד {p.lawyer_name}, רישיון לשכת עורכי הדין מספר {p.bar_license_number}, לטפל בתיק הפיצוי שלי (מזהה {p.claim_id}) מול חברת התעופה.</Text>
        <Text style={{ marginTop: 24 }}>חתימה: ___________________________________</Text>
        <Text>תאריך: ___________________________________</Text>
      </Page>
    </Document>
  );
}
