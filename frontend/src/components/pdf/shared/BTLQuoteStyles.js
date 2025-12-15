import { StyleSheet } from '@react-pdf/renderer';

/**
 * Styles for BTL Quote PDF - matches template formatting
 */
export const btlQuoteStyles = StyleSheet.create({
  // Header section
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 5,
    borderBottom: '1pt solid #dddbda',
  },
  headerTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#003087',
  },

  // Summary section
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    borderBottom: '1pt solid #dddbda',
    paddingBottom: 6,
    gap: 8,
  },
  mainContentArea: {
    marginRight: 160,
  },
  summaryColumn: {
    flex: 1,
    paddingRight: 5,
  },
  summaryLabel: {
    fontSize: 9,
    color: '#706e6b',
    marginBottom: 1,
  },
  summaryValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 5,
  },

  // Tier range boxes
  tierRangeContainer: {
    flexDirection: 'row',
    marginBottom: 6,
    gap: 4,
  },
  tierBox: {
    flex: 1,
    backgroundColor: '#d8edff',
    border: '1pt solid #0070d2',
    padding: 3,
    borderRadius: 2,
  },
  tierLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#014486',
    textAlign: 'center',
  },

  // Results table
  resultsTable: {
    marginTop: 6,
    marginBottom: 8,
    border: '1pt solid #c9c9c9',
  },
  
  // Table header
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottom: '1pt solid #0070d2',
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  tableHeaderCell: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  tableHeaderCellLabel: {
    width: '22%',
  },
  tableHeaderCellValue: {
    width: '19.5%',
    textAlign: 'right',
  },

  // Table rows
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1pt solid #e6e6e6',
    paddingVertical: 3,
    paddingHorizontal: 4,
    backgroundColor: '#ffffff',
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottom: '1pt solid #e6e6e6',
    paddingVertical: 3,
    paddingHorizontal: 4,
    backgroundColor: '#fbfbfb',
  },
  tableRowSectionHeader: {
    flexDirection: 'row',
    borderBottom: '1pt solid #e0e0e0',
    paddingVertical: 4,
    paddingHorizontal: 4,
    backgroundColor: '#f2f2f2',
  },
  tableCellLabel: {
    width: '22%',
    fontSize: 9,
    color: '#000000',
    paddingRight: 4,
  },
  tableCellValue: {
    width: '19.5%',
    fontSize: 9,
    color: '#000000',
    textAlign: 'center',
    paddingRight: 4,
  },
  tableCellValueHighlight: {
    width: '19.5%',
    fontSize: 9,
    color: '#000000',
    textAlign: 'center',
    fontWeight: 'bold',
    paddingRight: 4,
  },

  // Terms section
  termsSection: {
    marginTop: 8,
    paddingTop: 5,
    borderTop: '1pt solid #dddbda',
  },
  termsTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  termsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  termsColumn: {
    flex: 1,
  },
  termsRow: {
    marginBottom: 4,
  },
  termsLabel: {
    fontSize: 8,
    color: '#706e6b',
    marginBottom: 1,
  },
  termsValue: {
    fontSize: 9,
    color: '#000000',
    lineHeight: 1.3,
  },

  // Broker details box
  brokerDetailsBox: {
    width: 140,
    backgroundColor: '#f9f9f9',
    border: '1pt solid #dddbda',
    padding: 6,
    borderRadius: 3,
  },
  brokerDetailsContainer: {
    position: 'absolute',
    top: 90,
    right: 40,
    width: 140,
  },
  brokerDetailsTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
    borderBottom: '1pt solid #dddbda',
    paddingBottom: 2,
  },
  brokerDetailsRow: {
    marginBottom: 3,
  },
  brokerDetailsLabel: {
    fontSize: 8,
    color: '#706e6b',
  },
  brokerDetailsValue: {
    fontSize: 9,
    color: '#000000',
  },

  // Fee boxes in results
  feeBoxHighlight: {
    backgroundColor: '#d8edff',
    padding: 2,
    borderRadius: 1,
  },

  // Full term row
  fullTermRow: {
    fontSize: 9,
    color: '#000000',
    lineHeight: 1.3,
    marginBottom: 8,
  },
});
