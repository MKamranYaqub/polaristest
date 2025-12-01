import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';

const footerStyles = StyleSheet.create({
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 40,
    right: 40,
    borderTop: '1pt solid #dddbda',
    paddingTop: 8,
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageNumber: {
    fontSize: 8,
    color: '#3e3e3c',
  },
  generatedDate: {
    fontSize: 8,
    color: '#706e6b',
  },
  disclaimer: {
    marginTop: 4,
    fontSize: 7,
    color: '#706e6b',
    textAlign: 'center',
  },
});

/**
 * PDF Footer with dynamic page numbering
 * Uses @react-pdf/renderer's render props for dynamic page numbers
 */
const PDFFooter = ({ generatedDate }) => (
  <View style={footerStyles.footer} fixed>
    <View style={footerStyles.footerContent}>
      <Text style={footerStyles.pageNumber} render={({ pageNumber, totalPages }) => (
        `Page ${pageNumber} of ${totalPages}`
      )} />
    </View>
  </View>
);

export default PDFFooter;
