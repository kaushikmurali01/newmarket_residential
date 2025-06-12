import React from 'react';
import { pdf, Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { Audit, AuditPhoto } from '@shared/schema';

// Define styles for the PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 20,
    fontFamily: 'Helvetica',
  },
  header: {
    backgroundColor: '#003366',
    color: 'white',
    padding: 20,
    marginBottom: 20,
    borderRadius: 5,
  },
  companyName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  companySubtitle: {
    fontSize: 14,
    fontWeight: 'normal',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#003366',
    textAlign: 'center',
    marginVertical: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 30,
  },
  infoBox: {
    backgroundColor: '#f8f9fa',
    border: '1px solid #dee2e6',
    borderRadius: 5,
    padding: 15,
    marginBottom: 15,
  },
  infoBoxTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#003366',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    width: 80,
  },
  infoValue: {
    fontSize: 10,
    flex: 1,
  },
  sectionHeader: {
    backgroundColor: '#003366',
    color: 'white',
    padding: 8,
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  twoColumnContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  column: {
    flex: 1,
    marginRight: 10,
  },
  columnLast: {
    flex: 1,
  },
  subsectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: '#e9ecef',
    padding: 5,
    marginBottom: 5,
    color: '#003366',
  },
  dataRow: {
    flexDirection: 'row',
    marginBottom: 2,
    paddingLeft: 5,
  },
  dataLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    width: 60,
  },
  dataValue: {
    fontSize: 9,
    flex: 1,
  },
  testSection: {
    marginTop: 15,
    marginBottom: 15,
  },
  testTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#003366',
  },
  testItem: {
    fontSize: 9,
    marginLeft: 10,
    marginBottom: 2,
  },
  photoSection: {
    marginTop: 20,
  },
  photoContainer: {
    marginBottom: 20,
    border: '1px solid #dee2e6',
    borderRadius: 5,
    padding: 10,
  },
  photoTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#003366',
  },
  photoFilename: {
    fontSize: 9,
    color: '#666666',
    marginBottom: 10,
  },
  photo: {
    maxWidth: 400,
    maxHeight: 300,
    objectFit: 'contain',
  },
  pageBreak: {
    marginTop: 20,
  },
});

// Helper function to format arrays
const formatArray = (value: any): string => {
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  return value || 'Not specified';
};

// Helper function to format boolean values
const formatBoolean = (value: any): string => {
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  return value || 'Not specified';
};

// Cover Page Component
const CoverPage: React.FC<{ audit: Audit }> = ({ audit }) => {
  const customerName = `${audit.customerFirstName || ''} ${audit.customerLastName || ''}`.trim();
  const cityInfo = [audit.customerCity, audit.customerProvince, audit.customerPostalCode]
    .filter(Boolean).join(', ') || 'Not provided';
  
  const auditTypeLabel = audit.auditType === 'before_upgrade' ? 'Pre-Retrofit Assessment' :
                        audit.auditType === 'after_upgrade' ? 'Post-Retrofit Verification' :
                        'Residential Energy Assessment';

  const homeTypeLabel = audit.homeType === 'single_detached' ? 'Single Detached' :
                       audit.homeType === 'attached' ? 'Attached' :
                       audit.homeType === 'row_end' ? 'Row End Unit' :
                       audit.homeType === 'row_mid' ? 'Row Mid Unit' :
                       audit.homeType || 'Not specified';

  return React.createElement(Page, { size: "A4", style: styles.page },
    React.createElement(View, { style: styles.header },
      React.createElement(Text, { style: styles.companyName }, "ENERVA"),
      React.createElement(Text, { style: styles.companySubtitle }, "Energy Solutions Inc.")
    ),
    React.createElement(Text, { style: styles.title }, "ENERGY AUDIT REPORT"),
    React.createElement(Text, { style: styles.subtitle }, auditTypeLabel),
    React.createElement(View, { style: styles.infoBox },
      React.createElement(Text, { style: styles.infoBoxTitle }, "Report Details"),
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, "Audit ID:"),
        React.createElement(Text, { style: styles.infoValue }, audit.id)
      ),
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, "Report Date:"),
        React.createElement(Text, { style: styles.infoValue }, new Date().toLocaleDateString('en-CA'))
      ),
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, "Audit Date:"),
        React.createElement(Text, { style: styles.infoValue }, 
          audit.auditDate ? new Date(audit.auditDate).toLocaleDateString('en-CA') : 'Not specified'
        )
      )
    ),
    React.createElement(View, { style: styles.infoBox },
      React.createElement(Text, { style: styles.infoBoxTitle }, "Customer Information"),
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, "Name:"),
        React.createElement(Text, { style: styles.infoValue }, customerName || 'Not provided')
      ),
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, "Email:"),
        React.createElement(Text, { style: styles.infoValue }, audit.customerEmail || 'Not provided')
      ),
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, "Phone:"),
        React.createElement(Text, { style: styles.infoValue }, audit.customerPhone || 'Not provided')
      ),
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, "Address:"),
        React.createElement(Text, { style: styles.infoValue }, audit.customerAddress || 'Not provided')
      ),
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, "Location:"),
        React.createElement(Text, { style: styles.infoValue }, cityInfo)
      )
    ),
    React.createElement(View, { style: styles.infoBox },
      React.createElement(Text, { style: styles.infoBoxTitle }, "Property Details"),
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, "Home Type:"),
        React.createElement(Text, { style: styles.infoValue }, homeTypeLabel)
      ),
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, "Audit Type:"),
        React.createElement(Text, { style: styles.infoValue }, auditTypeLabel)
      )
    )
  );
};

// Technical Details Page Component
const TechnicalDetailsPage: React.FC<{ audit: Audit }> = ({ audit }) => {
  const houseData = audit.houseInfo || {};
  const foundationData = audit.foundationInfo || {};
  const wallsData = audit.wallsInfo || {};
  const ceilingData = audit.ceilingInfo || {};
  const windowsData = audit.windowsInfo || {};
  const doorsData = audit.doorsInfo || {};

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.sectionHeader}>Building Information</Text>
      
      <View style={styles.twoColumnContainer}>
        <View style={styles.column}>
          <Text style={styles.subsectionTitle}>House Information</Text>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Type:</Text>
            <Text style={styles.dataValue}>{(houseData as any).houseType || 'Not specified'}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Year Built:</Text>
            <Text style={styles.dataValue}>{(houseData as any).yearBuilt || 'Not specified'}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Height:</Text>
            <Text style={styles.dataValue}>
              {(houseData as any).aboveGradeHeight ? 
                `${(houseData as any).aboveGradeHeight} ${(houseData as any).aboveGradeHeightUnit || 'm'}` : 
                'Not specified'}
            </Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Orientation:</Text>
            <Text style={styles.dataValue}>{(houseData as any).frontOrientation || 'Not specified'}</Text>
          </View>
        </View>

        <View style={styles.columnLast}>
          <Text style={styles.subsectionTitle}>Foundation Information</Text>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Type:</Text>
            <Text style={styles.dataValue}>{formatArray((foundationData as any).foundationType)}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Wall Height:</Text>
            <Text style={styles.dataValue}>
              {(foundationData as any).wallHeight ? 
                `${(foundationData as any).wallHeight} ${(foundationData as any).wallHeightUnit || 'm'}` : 
                'Not specified'}
            </Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Walls:</Text>
            <Text style={styles.dataValue}>{(foundationData as any).walls || 'Not specified'}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Insulation:</Text>
            <Text style={styles.dataValue}>{(foundationData as any).insulation || 'Not specified'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.twoColumnContainer}>
        <View style={styles.column}>
          <Text style={styles.subsectionTitle}>Walls Information</Text>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Framing:</Text>
            <Text style={styles.dataValue}>{(wallsData as any).wallFraming || 'Not specified'}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Centers:</Text>
            <Text style={styles.dataValue}>{(wallsData as any).centres || 'Not specified'}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Insulation:</Text>
            <Text style={styles.dataValue}>{formatArray((wallsData as any).cavityInsulation)}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Exterior:</Text>
            <Text style={styles.dataValue}>{(wallsData as any).exteriorFinish || 'Not specified'}</Text>
          </View>
        </View>

        <View style={styles.columnLast}>
          <Text style={styles.subsectionTitle}>Ceiling Information</Text>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Framing:</Text>
            <Text style={styles.dataValue}>{(ceilingData as any).atticFraming || 'Not specified'}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Insulation:</Text>
            <Text style={styles.dataValue}>{formatArray((ceilingData as any).atticInsulationType)}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Thickness:</Text>
            <Text style={styles.dataValue}>{(ceilingData as any).atticInsulationThickness || 'Not specified'}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Type:</Text>
            <Text style={styles.dataValue}>{(ceilingData as any).ceilingType || 'Not specified'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.twoColumnContainer}>
        <View style={styles.column}>
          <Text style={styles.subsectionTitle}>Windows Information</Text>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Frame:</Text>
            <Text style={styles.dataValue}>{(windowsData as any).frame || 'Not specified'}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Low-E:</Text>
            <Text style={styles.dataValue}>{(windowsData as any).lowECoating || 'Not specified'}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Gas Fill:</Text>
            <Text style={styles.dataValue}>{formatBoolean((windowsData as any).gasFill)}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Glazing:</Text>
            <Text style={styles.dataValue}>{(windowsData as any).glazing || 'Not specified'}</Text>
          </View>
        </View>

        <View style={styles.columnLast}>
          <Text style={styles.subsectionTitle}>Doors Information</Text>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Skin:</Text>
            <Text style={styles.dataValue}>{(doorsData as any).skin || 'Not specified'}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Insulation:</Text>
            <Text style={styles.dataValue}>{(doorsData as any).insulation || 'Not specified'}</Text>
          </View>
        </View>
      </View>
    </Page>
  );
};

// Systems Page Component
const SystemsPage: React.FC<{ audit: Audit }> = ({ audit }) => {
  const heatingData = audit.heatingInfo || {};
  const dhwData = audit.domesticHotWaterInfo || {};
  const ventData = audit.ventilationInfo || {};
  const renewablesData = audit.renewablesInfo || {};

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.sectionHeader}>Mechanical Systems</Text>
      
      <View style={styles.twoColumnContainer}>
        <View style={styles.column}>
          <Text style={styles.subsectionTitle}>Heating System</Text>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Type:</Text>
            <Text style={styles.dataValue}>{formatArray((heatingData as any).heatingSystemType)}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Fuel:</Text>
            <Text style={styles.dataValue}>{(heatingData as any).source || 'Not specified'}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Make:</Text>
            <Text style={styles.dataValue}>{(heatingData as any).manufacturer || 'Not specified'}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Model:</Text>
            <Text style={styles.dataValue}>{(heatingData as any).model || 'Not specified'}</Text>
          </View>
        </View>

        <View style={styles.columnLast}>
          <Text style={styles.subsectionTitle}>Domestic Hot Water</Text>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Type:</Text>
            <Text style={styles.dataValue}>{(dhwData as any).domesticHotWaterType || 'Not specified'}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Fuel:</Text>
            <Text style={styles.dataValue}>{(dhwData as any).fuel || 'Not specified'}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Make:</Text>
            <Text style={styles.dataValue}>{(dhwData as any).manufacturer || 'Not specified'}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Volume:</Text>
            <Text style={styles.dataValue}>{(dhwData as any).tankVolume || 'Not specified'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.twoColumnContainer}>
        <View style={styles.column}>
          <Text style={styles.subsectionTitle}>Ventilation System</Text>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Type:</Text>
            <Text style={styles.dataValue}>{(ventData as any).ventilationType || 'Not specified'}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>HRV Make:</Text>
            <Text style={styles.dataValue}>{(ventData as any).hrvManufacturer || 'Not specified'}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>HRV Model:</Text>
            <Text style={styles.dataValue}>{(ventData as any).hrvModel || 'Not specified'}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>HVI Cert:</Text>
            <Text style={styles.dataValue}>{formatBoolean((ventData as any).hviCertified)}</Text>
          </View>
        </View>

        <View style={styles.columnLast}>
          <Text style={styles.subsectionTitle}>Renewable Systems</Text>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Solar PV:</Text>
            <Text style={styles.dataValue}>{formatBoolean((renewablesData as any).solarPv?.present)}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Solar DHW:</Text>
            <Text style={styles.dataValue}>{(renewablesData as any).solarDhw?.manufacturer || 'Not specified'}</Text>
          </View>
        </View>
      </View>

      {(audit.blowerDoorTest || audit.depressurizationTest) && (
        <View style={styles.testSection}>
          <Text style={styles.sectionHeader}>Test Results</Text>
          
          {audit.blowerDoorTest && (
            <View>
              <Text style={styles.testTitle}>Blower Door Test</Text>
              {(audit.blowerDoorTest as any).areasOfLeakage && (
                <View>
                  <Text style={styles.testItem}>Areas of Leakage:</Text>
                  {Object.entries((audit.blowerDoorTest as any).areasOfLeakage).map(([key, value]) => {
                    if (value) {
                      const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                      return (
                        <Text key={key} style={styles.testItem}>• {label}</Text>
                      );
                    }
                    return null;
                  })}
                </View>
              )}
              {(audit.blowerDoorTest as any).other && (
                <Text style={styles.testItem}>Other: {(audit.blowerDoorTest as any).other}</Text>
              )}
            </View>
          )}

          {audit.depressurizationTest && (
            <View>
              <Text style={styles.testTitle}>Depressurization Test</Text>
              <Text style={styles.testItem}>
                Window Leakage: {(audit.depressurizationTest as any).windowLeakage || 'Not specified'}
              </Text>
              <Text style={styles.testItem}>
                Other Leakage: {(audit.depressurizationTest as any).otherLeakage || 'Not specified'}
              </Text>
            </View>
          )}
        </View>
      )}
    </Page>
  );
};

// Photos Page Component
const PhotosPage: React.FC<{ photos: AuditPhoto[] }> = ({ photos }) => {
  if (!photos.length) return null;

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.sectionHeader}>Audit Photos</Text>
      
      {photos.map((photo, index) => (
        <View key={photo.id} style={styles.photoContainer} break={index > 0 && index % 2 === 0}>
          <Text style={styles.photoTitle}>
            {photo.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Photo
          </Text>
          <Text style={styles.photoFilename}>File: {photo.originalName}</Text>
          <Image
            style={styles.photo}
            src={`/api/photos/${photo.id}`}
          />
        </View>
      ))}
    </Page>
  );
};

// Main PDF Document Component
const AuditReportDocument: React.FC<{ audit: Audit; photos: AuditPhoto[] }> = ({ audit, photos }) => (
  <Document>
    <CoverPage audit={audit} />
    <TechnicalDetailsPage audit={audit} />
    <SystemsPage audit={audit} />
    <PhotosPage photos={photos} />
  </Document>
);

export async function generateAuditPDFNew(audit: Audit, photos: AuditPhoto[]) {
  try {
    const doc = <AuditReportDocument audit={audit} photos={photos} />;
    const asPdf = pdf(doc);
    const blob = await asPdf.toBlob();
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ENERVA_Audit_Report_${audit.id}_${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error('Failed to generate PDF report');
  }
}