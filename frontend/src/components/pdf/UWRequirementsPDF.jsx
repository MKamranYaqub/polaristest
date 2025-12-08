import React from 'react';
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';

// Logo path from public folder
const MFS_LOGO_PATH = '/assets/mfs-logo.png';

// PDF Styles for UW Requirements Checklist
const styles = StyleSheet.create({
  page: {
    paddingTop: 50,
    paddingBottom: 50,
    paddingLeft: 40,
    paddingRight: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottom: '2pt solid #00205B',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    width: 90,
    alignItems: 'flex-end',
  },
  logo: {
    width: 80,
    height: 32,
    objectFit: 'contain',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00205B',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: '#706e6b',
    marginBottom: 2,
  },
  referenceNumber: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#3e3e3c',
    marginTop: 4,
  },
  
  // Summary box
  summaryBox: {
    flexDirection: 'row',
    backgroundColor: '#f3f3f3',
    padding: 12,
    marginBottom: 15,
    borderRadius: 4,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 8,
    color: '#706e6b',
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00205B',
  },
  summaryValueComplete: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2e844a',
  },
  summaryValueIncomplete: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#c23934',
  },
  
  // Progress bar
  progressContainer: {
    marginBottom: 20,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#e5e5e5',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 8,
    backgroundColor: '#0176d3',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 9,
    color: '#706e6b',
    marginTop: 4,
    textAlign: 'right',
  },
  
  // Category section
  category: {
    marginBottom: 12,
  },
  categoryHeader: {
    backgroundColor: '#00205B',
    padding: 8,
    marginBottom: 0,
  },
  categoryTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  categoryCount: {
    fontSize: 9,
    color: '#a0d2ff',
    marginLeft: 8,
  },
  
  // Requirements table
  table: {
    border: '1pt solid #dddbda',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f3f3',
    borderBottom: '1pt solid #dddbda',
  },
  tableHeaderCell: {
    padding: 6,
    fontSize: 8,
    fontWeight: 'bold',
    color: '#3e3e3c',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '0.5pt solid #e5e5e5',
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottom: '0.5pt solid #e5e5e5',
    backgroundColor: '#fafafa',
  },
  tableCell: {
    padding: 6,
    fontSize: 9,
  },
  
  // Column widths
  colStatus: {
    width: '12%',
    textAlign: 'center',
  },
  colDescription: {
    width: '58%',
  },
  colStage: {
    width: '15%',
    textAlign: 'center',
  },
  colRequired: {
    width: '15%',
    textAlign: 'center',
  },
  
  // Status indicators
  statusReceived: {
    color: '#2e844a',
    fontWeight: 'bold',
  },
  statusPending: {
    color: '#c23934',
  },
  statusOptional: {
    color: '#706e6b',
    fontStyle: 'italic',
  },
  
  // Checkbox icons (text-based)
  checkboxChecked: {
    fontSize: 10,
    color: '#ffffff',
    backgroundColor: '#2e844a',
    padding: '2 4',
    borderRadius: 2,
    fontWeight: 'bold',
  },
  checkboxUnchecked: {
    fontSize: 10,
    color: '#706e6b',
    backgroundColor: '#f3f3f3',
    padding: '2 4',
    borderRadius: 2,
    border: '1pt solid #dddbda',
  },
  
  // Stage badges
  stageDIP: {
    backgroundColor: '#fe9339',
    color: '#ffffff',
    padding: '2 6',
    borderRadius: 3,
    fontSize: 8,
  },
  stageIndicative: {
    backgroundColor: '#2e844a',
    color: '#ffffff',
    padding: '2 6',
    borderRadius: 3,
    fontSize: 8,
  },
  stageBoth: {
    backgroundColor: '#706e6b',
    color: '#ffffff',
    padding: '2 6',
    borderRadius: 3,
    fontSize: 8,
  },
  
  // Footer
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 40,
    right: 40,
    borderTop: '1pt solid #dddbda',
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 8,
    color: '#706e6b',
  },
  pageNumber: {
    fontSize: 8,
    color: '#3e3e3c',
  },
  
  // Notes section
  notesSection: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#fffbe6',
    border: '1pt solid #ffd666',
    borderRadius: 4,
  },
  notesTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#595959',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 9,
    color: '#595959',
    lineHeight: 1.4,
  },
});

/**
 * UW Requirements Checklist PDF
 * 
 * Props:
 * - requirements: Array of requirement objects
 * - checkedItems: Array of checked requirement IDs
 * - quoteData: Quote data for header info
 * - stage: 'DIP' or 'Indicative' (optional filter)
 * - generatedDate: Date string when PDF was generated
 * - showGuidance: Whether to include internal guidance notes
 */
const UWRequirementsPDF = ({ 
  requirements = [], 
  checkedItems = [], 
  quoteData = {},
  stage = null,
  generatedDate = new Date().toLocaleDateString('en-GB'),
  showGuidance = false
}) => {
  // Group requirements by category
  const groupedRequirements = {};
  requirements.forEach(req => {
    if (!groupedRequirements[req.category]) {
      groupedRequirements[req.category] = [];
    }
    groupedRequirements[req.category].push(req);
  });

  // Sort each group by order
  Object.keys(groupedRequirements).forEach(cat => {
    groupedRequirements[cat].sort((a, b) => a.order - b.order);
  });

  // Calculate stats
  const totalCount = requirements.length;
  const checkedCount = requirements.filter(r => checkedItems.includes(r.id)).length;
  const requiredCount = requirements.filter(r => r.required).length;
  const requiredCheckedCount = requirements.filter(r => r.required && checkedItems.includes(r.id)).length;
  const progressPercent = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;
  const isComplete = checkedCount === totalCount;
  const isRequiredComplete = requiredCheckedCount === requiredCount;

  // Category order
  const categoryOrder = [
    'Assumptions',
    'Broker',
    'Borrower',
    'Company',
    'Property',
    'Property - HMO',
    'Property - Holiday Let',
    'Property - Commercial/Semi-Commercial',
    'Additional Requirements'
  ];

  // Get borrower name from quote data
  const borrowerName = quoteData.quote_borrower_name || quoteData.borrower_name || 'Not specified';

  // Get property address
  const propertyAddress = quoteData.property_address || quoteData.security_address || 'Not specified';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>UW Requirements Checklist</Text>
            <Text style={styles.subtitle}>
              {stage ? `${stage} Stage` : 'All Stages'} • Generated: {generatedDate}
            </Text>
            {quoteData.reference_number && (
              <Text style={styles.referenceNumber}>
                Reference: {quoteData.reference_number}
              </Text>
            )}
          </View>
          <View style={styles.headerRight}>
            <Image style={styles.logo} src={MFS_LOGO_PATH} />
          </View>
        </View>

        {/* Quote Summary */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>BORROWER</Text>
            <Text style={styles.summaryValue}>{borrowerName}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>TOTAL ITEMS</Text>
            <Text style={styles.summaryValue}>{totalCount}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>RECEIVED</Text>
            <Text style={isComplete ? styles.summaryValueComplete : styles.summaryValue}>
              {checkedCount}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>OUTSTANDING</Text>
            <Text style={(totalCount - checkedCount) > 0 ? styles.summaryValueIncomplete : styles.summaryValueComplete}>
              {totalCount - checkedCount}
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {progressPercent}% Complete • {requiredCheckedCount}/{requiredCount} Required Items Received
          </Text>
        </View>

        {/* Requirements by Category */}
        {categoryOrder.map(category => {
          const catReqs = groupedRequirements[category];
          // Skip if no requirements in this category OR if Assumptions category and stage is DIP
          if (!catReqs || catReqs.length === 0) return null;
          if (category === 'Assumptions' && stage === 'DIP') return null;

          const catChecked = catReqs.filter(r => checkedItems.includes(r.id)).length;
          const isAssumptions = category === 'Assumptions';

          return (
            <View key={category} style={styles.category} wrap={false}>
              {/* Category Header */}
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryTitle}>
                  {category}
                  {!isAssumptions && (
                    <Text style={styles.categoryCount}> ({catChecked}/{catReqs.length})</Text>
                  )}
                </Text>
              </View>

              {/* Assumptions: Plain text list without table */}
              {isAssumptions ? (
                <View style={{ paddingLeft: 15, paddingRight: 15, paddingBottom: 10 }}>
                  {catReqs.map((req, idx) => (
                    <View key={req.id} style={{ marginBottom: 6 }}>
                      <Text style={{ fontSize: 9, color: '#3e3e3c', lineHeight: 1.4, fontStyle: 'italic' }}>
                        • {req.description}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                /* Regular requirements table */
                <View style={styles.table}>
                  {/* Table Header */}
                  <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeaderCell, styles.colStatus]}>Status</Text>
                    <Text style={[styles.tableHeaderCell, styles.colDescription]}>Requirement</Text>
                    <Text style={[styles.tableHeaderCell, styles.colStage]}>Stage</Text>
                    <Text style={[styles.tableHeaderCell, styles.colRequired]}>Required</Text>
                  </View>

                  {/* Table Rows */}
                  {catReqs.map((req, idx) => {
                    const isChecked = checkedItems.includes(req.id);
                    const rowStyle = idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt;
                    
                    // Determine display stage: if stage is 'Both', show the currently selected stage filter
                    const displayStage = req.stage === 'Both' ? (stage || 'Both') : req.stage;

                    return (
                      <View key={req.id} style={rowStyle}>
                        <View style={[styles.tableCell, styles.colStatus]}>
                          <Text style={isChecked ? styles.checkboxChecked : styles.checkboxUnchecked}>
                            {isChecked ? 'YES' : 'NO'}
                          </Text>
                        </View>
                        <View style={[styles.tableCell, styles.colDescription]}>
                          <Text style={isChecked ? styles.statusReceived : (req.required ? styles.statusPending : styles.statusOptional)}>
                            {req.description}
                          </Text>
                          {showGuidance && req.guidance && (
                            <Text style={{ fontSize: 7, color: '#706e6b', marginTop: 2, fontStyle: 'italic' }}>
                              Note: {req.guidance}
                            </Text>
                          )}
                        </View>
                        <View style={[styles.tableCell, styles.colStage]}>
                          <Text style={
                            displayStage === 'DIP' ? styles.stageDIP :
                            displayStage === 'Indicative' ? styles.stageIndicative :
                            styles.stageBoth
                          }>
                            {displayStage}
                          </Text>
                        </View>
                        <View style={[styles.tableCell, styles.colRequired]}>
                          <Text style={{ color: req.required ? '#c23934' : '#706e6b' }}>
                            {req.required ? 'Yes' : 'Optional'}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}

        {/* Status Summary Note */}
        <View style={styles.notesSection}>
          <Text style={styles.notesTitle}>Status Summary</Text>
          <Text style={styles.notesText}>
            {isComplete 
              ? '✓ All requirements have been received. This case is ready for underwriting review.'
              : isRequiredComplete
                ? `✓ All required items received (${requiredCheckedCount}/${requiredCount}). ${totalCount - checkedCount} optional item(s) outstanding.`
                : `⚠ ${requiredCount - requiredCheckedCount}  required item(s) and ${totalCount - checkedCount - (requiredCount - requiredCheckedCount)} optional item(s) outstanding.`
            }
          </Text>
          {propertyAddress !== 'Not specified' && (
            <Text style={[styles.notesText, { marginTop: 4 }]}>
              Property: {propertyAddress}
            </Text>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Market Financial Solutions Underwriting Requirements Checklist • {generatedDate}
          </Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
            `Page ${pageNumber} of ${totalPages}`
          )} />
        </View>
      </Page>
    </Document>
  );
};

export default UWRequirementsPDF;
