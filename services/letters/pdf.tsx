import React from "react";
import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import type { Letter } from "./schema";

Font.register({ family: "Heebo", src: "https://fonts.gstatic.com/s/heebo/v26/NGSpv5_NC0k9P_v6Z8E.ttf" });
Font.register({ family: "Inter", src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.ttf" });

const s = StyleSheet.create({
  page: { padding: 48, fontSize: 10, fontFamily: "Inter", color: "#0a0e14" },
  he: { fontFamily: "Heebo", direction: "rtl", fontSize: 11 },
  hr: { borderBottom: "1pt solid #74777f", marginVertical: 12 },
  block: { marginBottom: 8 },
  letterhead: { fontSize: 9, color: "#44474e" },
  amount: { fontSize: 24, fontWeight: 700, color: "#0a0e14" },
});

export function DemandLetterPDF({ letter }: { letter: Letter }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View>
          <Text style={s.letterhead}>{letter.letterhead.firm}</Text>
          <Text style={s.letterhead}>{letter.letterhead.lawyer} · רישיון {letter.letterhead.bar_license}</Text>
          <Text style={s.letterhead}>{letter.letterhead.address}</Text>
          <Text style={s.letterhead}>{letter.letterhead.phone} · {letter.letterhead.email}</Text>
        </View>
        <View style={s.hr} />
        <View>
          <Text style={[s.he, { fontSize: 14, fontWeight: 700 }]}>{letter.subject_he}</Text>
          <Text style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>{letter.subject_en}</Text>
        </View>
        <View style={s.hr} />

        <View style={s.block}>
          <Text style={s.he}>{letter.facts_paragraph_he}</Text>
        </View>
        <View style={s.block}>
          <Text>{letter.facts_paragraph_en}</Text>
        </View>

        <View style={s.hr} />
        {letter.legal_grounds.map((g, i) => (
          <View key={i} style={s.block}>
            <Text style={{ fontWeight: 700 }}>{g.citation}{g.article ? ` · ${g.article}` : ""} ({g.jurisdiction})</Text>
            <Text style={s.he}>{g.applied_to_facts_he}</Text>
            <Text>{g.applied_to_facts_en}</Text>
          </View>
        ))}

        <View style={s.hr} />
        <View style={s.block}>
          <Text style={s.amount}>₪ {letter.demand_amount_ils.toLocaleString()}</Text>
          <Text style={s.he}>{letter.payment_terms_he}</Text>
          <Text>{letter.payment_terms_en}</Text>
          <Text>Deadline: {letter.deadline_iso}</Text>
        </View>

        <View style={s.hr} />
        <View>
          <Text style={s.he}>{letter.sign_off_he}</Text>
          <Text>{letter.sign_off_en}</Text>
          <Text style={{ marginTop: 16 }}>{letter.letterhead.lawyer}</Text>
        </View>
      </Page>
    </Document>
  );
}
