import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { styles } from './PDFStyles';

const PDFHeader = ({ title, subtitle, referenceNumber }) => (
  <View style={styles.header}>
    <Text style={styles.title}>{title}</Text>
    {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    {referenceNumber && (
      <Text style={styles.referenceNumber}>
        Reference Number: {referenceNumber}
      </Text>
    )}
  </View>
);

export default PDFHeader;
