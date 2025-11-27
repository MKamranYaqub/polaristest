import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { styles } from './PDFStyles';

const PDFFooter = ({ pageNumber, totalPages, generatedDate }) => (
  <View style={styles.footer} fixed>
    <Text>
      Page {pageNumber} of {totalPages} | Generated: {generatedDate || new Date().toLocaleDateString('en-GB')}
    </Text>
    <Text style={{ marginTop: 3, fontSize: 7 }}>
      This document is for informational purposes only and does not constitute a formal offer.
    </Text>
  </View>
);

export default PDFFooter;
