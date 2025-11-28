import { StyleSheet } from '@react-pdf/renderer';

/**
 * Styles specific to BTL DIP PDF - matches Excel DIP sheet formatting
 */
export const btlDipStyles = StyleSheet.create({
  // Date row
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottom: '1pt solid #dddbda',
  },
  dateText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0176d3',
  },
  dateValue: {
    fontSize: 10,
    color: '#706e6b',
  },

  // Summary rows (label: value format)
  summaryRow: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingBottom: 5,
    borderBottom: '0.5pt solid #f3f2f2',
  },
  summaryLabel: {
    width: '30%',
    fontSize: 9,
    fontWeight: 'bold',
    color: '#080707',
  },
  summaryValue: {
    width: '70%',
    fontSize: 9,
    color: '#3e3e3c',
    lineHeight: 1.4,
  },

  // Section headers
  sectionHeader: {
    marginTop: 15,
    marginBottom: 10,
    paddingBottom: 5,
    borderBottom: '2pt solid #0176d3',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0176d3',
    textTransform: 'uppercase',
  },

  // Introduction section
  introSection: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 3,
  },
  introText: {
    fontSize: 8,
    color: '#3e3e3c',
    lineHeight: 1.5,
    marginBottom: 5,
  },

  // Terms sections
  termsSection: {
    marginBottom: 10,
  },
  termsSubtitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#080707',
    marginBottom: 5,
  },
  termsText: {
    fontSize: 8,
    color: '#3e3e3c',
    lineHeight: 1.5,
    marginBottom: 5,
  },
  termsTextSmall: {
    fontSize: 7,
    color: '#706e6b',
    lineHeight: 1.4,
  },

  // Warning/Info boxes
  warningBox: {
    backgroundColor: '#fef7e5',
    border: '1pt solid #dd7a01',
    padding: 8,
    marginVertical: 8,
    borderRadius: 3,
  },
  warningText: {
    fontSize: 8,
    color: '#826100',
    lineHeight: 1.4,
    fontWeight: 'bold',
  },
  infoBox: {
    backgroundColor: '#d8edff',
    border: '1pt solid #0176d3',
    padding: 8,
    marginVertical: 8,
    borderRadius: 3,
  },
  infoText: {
    fontSize: 8,
    color: '#014486',
    lineHeight: 1.4,
  },

  // Tariff table
  tariffTable: {
    marginVertical: 10,
    border: '1pt solid #dddbda',
  },
  tariffHeader: {
    flexDirection: 'row',
    backgroundColor: '#0176d3',
    padding: 6,
  },
  tariffHeaderCell: {
    flex: 2,
    fontSize: 9,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  tariffHeaderCellRight: {
    flex: 1,
    fontSize: 9,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'right',
  },
  tariffSubHeader: {
    backgroundColor: '#f3f2f2',
    padding: 4,
  },
  tariffSubHeaderText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#3e3e3c',
  },
  tariffRow: {
    flexDirection: 'row',
    padding: 4,
    borderBottom: '0.5pt solid #dddbda',
  },
  tariffRowAlt: {
    flexDirection: 'row',
    padding: 4,
    borderBottom: '0.5pt solid #dddbda',
    backgroundColor: '#fafaf9',
  },
  tariffCell: {
    flex: 2,
    fontSize: 8,
    color: '#3e3e3c',
  },
  tariffCellRight: {
    flex: 1,
    fontSize: 8,
    color: '#3e3e3c',
    textAlign: 'right',
  },

  // Signature section
  signatureGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  signatureBlock: {
    width: '45%',
    marginBottom: 15,
  },
  signatureLine: {
    fontSize: 9,
    marginBottom: 8,
  },
  signatureLabel: {
    fontSize: 8,
    color: '#706e6b',
    marginBottom: 5,
  },

  // Highlights
  highlightValue: {
    fontWeight: 'bold',
    color: '#0176d3',
  },
  currencyValue: {
    fontWeight: 'bold',
    color: '#080707',
  },

  // Conditional row (for hidden/shown content)
  conditionalRow: {
    backgroundColor: '#fff8e6',
    borderLeft: '3pt solid #dd7a01',
    paddingLeft: 5,
  },
});
