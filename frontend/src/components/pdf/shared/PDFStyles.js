import { StyleSheet } from '@react-pdf/renderer';

export const styles = StyleSheet.create({
  page: {
    paddingTop: 55,
    paddingBottom: 60,
    paddingLeft: 40,
    paddingRight: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  
  // Header styles
  header: {
    marginBottom: 20,
    borderBottom: '2pt solid #0176d3',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0176d3',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 10,
    color: '#706e6b',
    textAlign: 'center',
    marginBottom: 3,
  },
  referenceNumber: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: 'bold',
    marginTop: 5,
  },
  
  // Section styles
  section: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 3,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0176d3',
    marginBottom: 8,
    borderBottom: '1pt solid #dddbda',
    paddingBottom: 3,
  },
  
  // Text styles
  label: {
    fontSize: 9,
    color: '#706e6b',
    marginBottom: 2,
  },
  value: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  text: {
    fontSize: 10,
    lineHeight: 1.4,
    marginBottom: 4,
  },
  
  // Row styles
  row: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  rowLabel: {
    fontSize: 10,
    width: '45%',
    color: '#706e6b',
  },
  rowValue: {
    fontSize: 10,
    width: '55%',
    fontWeight: 'bold',
  },
  
  // Table styles
  table: {
    marginTop: 10,
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0176d3',
    padding: 6,
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1pt solid #dddbda',
    padding: 6,
    fontSize: 9,
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottom: '1pt solid #dddbda',
    backgroundColor: '#f3f2f2',
    padding: 6,
    fontSize: 9,
  },
  tableCol: {
    flex: 1,
  },
  tableColHeader: {
    flex: 1,
    fontWeight: 'bold',
  },
  
  // Info box styles
  infoBox: {
    backgroundColor: '#d8edff',
    border: '1pt solid #0176d3',
    padding: 10,
    marginVertical: 8,
    borderRadius: 3,
  },
  infoIcon: {
    color: '#0176d3',
    fontSize: 12,
    marginRight: 5,
  },
  infoText: {
    fontSize: 9,
    color: '#014486',
    lineHeight: 1.4,
  },
  
  // Warning box styles
  warningBox: {
    backgroundColor: '#fef7e5',
    border: '1pt solid #dd7a01',
    padding: 10,
    marginVertical: 8,
    borderRadius: 3,
  },
  warningText: {
    fontSize: 9,
    color: '#826100',
    lineHeight: 1.4,
  },
  
  // Footer styles
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTop: '1pt solid #dddbda',
    paddingTop: 8,
    fontSize: 8,
    color: '#706e6b',
    textAlign: 'center',
  },
  
  // Grid layout
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  gridItem: {
    width: '50%',
    marginBottom: 8,
    paddingRight: 10,
  },
  gridItemFull: {
    width: '100%',
    marginBottom: 8,
  },
  
  // Spacing utilities
  mb5: { marginBottom: 5 },
  mb10: { marginBottom: 10 },
  mb15: { marginBottom: 15 },
  mb20: { marginBottom: 20 },
  mt5: { marginTop: 5 },
  mt10: { marginTop: 10 },
  mt15: { marginTop: 15 },
  
  // Currency
  currency: {
    fontWeight: 'bold',
    color: '#080707',
  },
  
  // Highlighted value
  highlight: {
    backgroundColor: '#fef7e5',
    padding: 4,
    borderRadius: 2,
    fontWeight: 'bold',
  },
});
