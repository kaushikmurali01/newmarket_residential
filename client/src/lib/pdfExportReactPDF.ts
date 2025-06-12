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
  sectionHeader: {
    backgroundColor: '#003366',
    color: 'white',
    padding: 8,
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
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
  twoColumnContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  column: {
    flex: 1,
    marginRight: 10,
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
});

// Helper functions
const formatArray = (value: any): string => {
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  return value || 'Not specified';
};

const formatBoolean = (value: any): string => {
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  return value || 'Not specified';
};

// Create PDF Document using React.createElement
function createPDFDocument(audit: Audit, photos: AuditPhoto[]) {
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

  // Cover Page
  const coverPage = React.createElement(Page, { size: "A4", style: styles.page },
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
    
    React.createElement(View, { style: styles.twoColumnContainer },
      React.createElement(View, { style: styles.column },
        React.createElement(Text, { style: styles.infoBoxTitle }, "Customer Information"),
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "First Name:"),
          React.createElement(Text, { style: styles.dataValue }, audit.customerFirstName || 'Not provided')
        ),
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "Last Name:"),
          React.createElement(Text, { style: styles.dataValue }, audit.customerLastName || 'Not provided')
        ),
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "Email:"),
          React.createElement(Text, { style: styles.dataValue }, audit.customerEmail || 'Not provided')
        ),
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "Phone:"),
          React.createElement(Text, { style: styles.dataValue }, audit.customerPhone || 'Not provided')
        )
      ),
      React.createElement(View, { style: styles.column },
        React.createElement(Text, { style: styles.infoBoxTitle }, "Property Information"),
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "Address:"),
          React.createElement(Text, { style: styles.dataValue }, audit.customerAddress || 'Not provided')
        ),
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "City:"),
          React.createElement(Text, { style: styles.dataValue }, audit.customerCity || 'Not provided')
        ),
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "Province:"),
          React.createElement(Text, { style: styles.dataValue }, audit.customerProvince || 'Not provided')
        ),
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "Postal Code:"),
          React.createElement(Text, { style: styles.dataValue }, audit.customerPostalCode || 'Not provided')
        )
      )
    ),
    
    React.createElement(View, { style: styles.infoBox },
      React.createElement(Text, { style: styles.infoBoxTitle }, "Audit Details"),
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, "Audit Type:"),
        React.createElement(Text, { style: styles.infoValue }, auditTypeLabel)
      ),
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, "Home Type:"),
        React.createElement(Text, { style: styles.infoValue }, homeTypeLabel)
      )
    )
  );

  // Pre-Audit Information Page
  const eligibilityData = audit.eligibilityCriteria || {};
  const preAuditData = audit.preAuditDiscussion || {};
  const atypicalLoadsData = audit.atypicalLoads || {};

  const preAuditPage = React.createElement(Page, { size: "A4", style: styles.page },
    React.createElement(Text, { style: styles.sectionHeader }, "Pre-Audit Information"),
    
    React.createElement(Text, { style: styles.subsectionTitle }, "Eligibility Criteria"),
    React.createElement(View, { style: styles.twoColumnContainer },
      React.createElement(View, { style: styles.column },
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "Registered:"),
          React.createElement(Text, { style: styles.dataValue }, formatBoolean((eligibilityData as any).registered))
        ),
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "Documents:"),
          React.createElement(Text, { style: styles.dataValue }, formatBoolean((eligibilityData as any).documents))
        ),
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "≤3 Storeys:"),
          React.createElement(Text, { style: styles.dataValue }, formatBoolean((eligibilityData as any).storeys))
        ),
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "<600 m²:"),
          React.createElement(Text, { style: styles.dataValue }, formatBoolean((eligibilityData as any).size))
        ),
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "Foundation:"),
          React.createElement(Text, { style: styles.dataValue }, formatBoolean((eligibilityData as any).foundation))
        )
      ),
      React.createElement(View, { style: styles.column },
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "Mechanical:"),
          React.createElement(Text, { style: styles.dataValue }, formatBoolean((eligibilityData as any).mechanical))
        ),
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "Doors/Windows:"),
          React.createElement(Text, { style: styles.dataValue }, formatBoolean((eligibilityData as any).doors_windows))
        ),
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "Envelope:"),
          React.createElement(Text, { style: styles.dataValue }, formatBoolean((eligibilityData as any).envelope))
        ),
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "No Renovations:"),
          React.createElement(Text, { style: styles.dataValue }, formatBoolean((eligibilityData as any).renovations))
        ),
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "Electrical:"),
          React.createElement(Text, { style: styles.dataValue }, formatBoolean((eligibilityData as any).electrical))
        )
      )
    ),
    
    React.createElement(Text, { style: styles.subsectionTitle }, "Pre-audit Discussion"),
    React.createElement(View, { style: styles.twoColumnContainer },
      React.createElement(View, { style: styles.column },
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "Authorization:"),
          React.createElement(Text, { style: styles.dataValue }, formatBoolean((preAuditData as any).authorization))
        ),
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "Process:"),
          React.createElement(Text, { style: styles.dataValue }, formatBoolean((preAuditData as any).process))
        )
      ),
      React.createElement(View, { style: styles.column },
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "Access:"),
          React.createElement(Text, { style: styles.dataValue }, formatBoolean((preAuditData as any).access))
        ),
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "Documents:"),
          React.createElement(Text, { style: styles.dataValue }, formatBoolean((preAuditData as any).documents))
        )
      )
    ),
    
    React.createElement(Text, { style: styles.subsectionTitle }, "Atypical Loads"),
    React.createElement(View, { style: styles.twoColumnContainer },
      React.createElement(View, { style: styles.column },
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "Deicing:"),
          React.createElement(Text, { style: styles.dataValue }, formatBoolean((atypicalLoadsData as any).deicing))
        ),
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "Lighting:"),
          React.createElement(Text, { style: styles.dataValue }, formatBoolean((atypicalLoadsData as any).lighting))
        ),
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "Hot Tub:"),
          React.createElement(Text, { style: styles.dataValue }, formatBoolean((atypicalLoadsData as any).hot_tub))
        )
      ),
      React.createElement(View, { style: styles.column },
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "Air Conditioner:"),
          React.createElement(Text, { style: styles.dataValue }, formatBoolean((atypicalLoadsData as any).air_conditioner))
        ),
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "Pool:"),
          React.createElement(Text, { style: styles.dataValue }, formatBoolean((atypicalLoadsData as any).pool))
        )
      )
    )
  );

  // Technical Details Page
  const houseData = audit.houseInfo || {};
  const foundationData = audit.foundationInfo || {};
  const wallsData = audit.wallsInfo || {};
  const heatingData = audit.heatingInfo || {};
  const dhwData = audit.domesticHotWaterInfo || {};

  const technicalPage = React.createElement(Page, { size: "A4", style: styles.page },
    React.createElement(Text, { style: styles.sectionHeader }, "Building Information"),
    React.createElement(View, { style: styles.twoColumnContainer },
      React.createElement(View, { style: styles.column },
        React.createElement(Text, { style: styles.subsectionTitle }, "House Information"),
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "Type:"),
          React.createElement(Text, { style: styles.dataValue }, (houseData as any).houseType || 'Not specified')
        ),
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "Year Built:"),
          React.createElement(Text, { style: styles.dataValue }, (houseData as any).yearBuilt || 'Not specified')
        ),
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "Height:"),
          React.createElement(Text, { style: styles.dataValue }, 
            (houseData as any).aboveGradeHeight ? 
              `${(houseData as any).aboveGradeHeight} ${(houseData as any).aboveGradeHeightUnit || 'm'}` : 
              'Not specified'
          )
        )
      ),
      React.createElement(View, { style: styles.column },
        React.createElement(Text, { style: styles.subsectionTitle }, "Foundation Information"),
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "Type:"),
          React.createElement(Text, { style: styles.dataValue }, formatArray((foundationData as any).foundationType))
        ),
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "Walls:"),
          React.createElement(Text, { style: styles.dataValue }, (foundationData as any).walls || 'Not specified')
        ),
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "Insulation:"),
          React.createElement(Text, { style: styles.dataValue }, (foundationData as any).insulation || 'Not specified')
        )
      )
    ),
    React.createElement(Text, { style: styles.sectionHeader }, "Mechanical Systems"),
    React.createElement(View, { style: styles.twoColumnContainer },
      React.createElement(View, { style: styles.column },
        React.createElement(Text, { style: styles.subsectionTitle }, "Heating System"),
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "Type:"),
          React.createElement(Text, { style: styles.dataValue }, formatArray((heatingData as any).heatingSystemType))
        ),
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "Fuel:"),
          React.createElement(Text, { style: styles.dataValue }, (heatingData as any).source || 'Not specified')
        ),
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "Make:"),
          React.createElement(Text, { style: styles.dataValue }, (heatingData as any).manufacturer || 'Not specified')
        )
      ),
      React.createElement(View, { style: styles.column },
        React.createElement(Text, { style: styles.subsectionTitle }, "Domestic Hot Water"),
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "Type:"),
          React.createElement(Text, { style: styles.dataValue }, (dhwData as any).domesticHotWaterType || 'Not specified')
        ),
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "Fuel:"),
          React.createElement(Text, { style: styles.dataValue }, (dhwData as any).fuel || 'Not specified')
        ),
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "Volume:"),
          React.createElement(Text, { style: styles.dataValue }, (dhwData as any).tankVolume || 'Not specified')
        )
      )
    )
  );

  // Create Document
  const pages = [coverPage, preAuditPage, technicalPage];

  return React.createElement(Document, {}, ...pages);
}

// Create PDF Document with Photos
function createPDFDocumentWithPhotos(audit: Audit, photoData: Array<{ photo: AuditPhoto; base64: string | null }>) {
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

  // Cover Page
  const coverPage = React.createElement(Page, { size: "A4", style: styles.page },
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
    
    React.createElement(View, { style: styles.twoColumnContainer },
      React.createElement(View, { style: styles.column },
        React.createElement(Text, { style: styles.infoBoxTitle }, "Customer Information"),
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "First Name:"),
          React.createElement(Text, { style: styles.dataValue }, audit.customerFirstName || 'Not provided')
        ),
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "Last Name:"),
          React.createElement(Text, { style: styles.dataValue }, audit.customerLastName || 'Not provided')
        ),
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "Email:"),
          React.createElement(Text, { style: styles.dataValue }, audit.customerEmail || 'Not provided')
        ),
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "Phone:"),
          React.createElement(Text, { style: styles.dataValue }, audit.customerPhone || 'Not provided')
        )
      ),
      React.createElement(View, { style: styles.column },
        React.createElement(Text, { style: styles.infoBoxTitle }, "Property Information"),
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "Address:"),
          React.createElement(Text, { style: styles.dataValue }, audit.customerAddress || 'Not provided')
        ),
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "City:"),
          React.createElement(Text, { style: styles.dataValue }, audit.customerCity || 'Not provided')
        ),
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "Province:"),
          React.createElement(Text, { style: styles.dataValue }, audit.customerProvince || 'Not provided')
        ),
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "Postal Code:"),
          React.createElement(Text, { style: styles.dataValue }, audit.customerPostalCode || 'Not provided')
        )
      )
    ),
    
    React.createElement(View, { style: styles.infoBox },
      React.createElement(Text, { style: styles.infoBoxTitle }, "Audit Details"),
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, "Audit Type:"),
        React.createElement(Text, { style: styles.infoValue }, auditTypeLabel)
      ),
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, "Home Type:"),
        React.createElement(Text, { style: styles.infoValue }, homeTypeLabel)
      )
    )
  );

  // Pre-Audit Information Page
  const eligibilityData = audit.eligibilityCriteria || {};
  const preAuditData = audit.preAuditDiscussion || {};
  const atypicalLoadsData = audit.atypicalLoads || {};

  const preAuditPage = React.createElement(Page, { size: "A4", style: styles.page },
    React.createElement(Text, { style: styles.sectionHeader }, "Pre-Audit Information"),
    
    React.createElement(Text, { style: styles.subsectionTitle }, "Eligibility Criteria"),
    React.createElement(View, { style: styles.twoColumnContainer },
      React.createElement(View, { style: styles.column },
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "Registered:"),
          React.createElement(Text, { style: styles.dataValue }, formatBoolean((eligibilityData as any).registered))
        ),
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "Documents:"),
          React.createElement(Text, { style: styles.dataValue }, formatBoolean((eligibilityData as any).documents))
        ),
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "≤3 Storeys:"),
          React.createElement(Text, { style: styles.dataValue }, formatBoolean((eligibilityData as any).storeys))
        ),
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "<600 m²:"),
          React.createElement(Text, { style: styles.dataValue }, formatBoolean((eligibilityData as any).size))
        ),
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "Foundation:"),
          React.createElement(Text, { style: styles.dataValue }, formatBoolean((eligibilityData as any).foundation))
        )
      ),
      React.createElement(View, { style: styles.column },
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "Mechanical:"),
          React.createElement(Text, { style: styles.dataValue }, formatBoolean((eligibilityData as any).mechanical))
        ),
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "Doors/Windows:"),
          React.createElement(Text, { style: styles.dataValue }, formatBoolean((eligibilityData as any).doors_windows))
        ),
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "Envelope:"),
          React.createElement(Text, { style: styles.dataValue }, formatBoolean((eligibilityData as any).envelope))
        ),
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "No Renovations:"),
          React.createElement(Text, { style: styles.dataValue }, formatBoolean((eligibilityData as any).renovations))
        ),
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "Electrical:"),
          React.createElement(Text, { style: styles.dataValue }, formatBoolean((eligibilityData as any).electrical))
        )
      )
    ),
    
    React.createElement(Text, { style: styles.subsectionTitle }, "Pre-audit Discussion"),
    React.createElement(View, { style: styles.twoColumnContainer },
      React.createElement(View, { style: styles.column },
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "Authorization:"),
          React.createElement(Text, { style: styles.dataValue }, formatBoolean((preAuditData as any).authorization))
        ),
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "Process:"),
          React.createElement(Text, { style: styles.dataValue }, formatBoolean((preAuditData as any).process))
        )
      ),
      React.createElement(View, { style: styles.column },
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "Access:"),
          React.createElement(Text, { style: styles.dataValue }, formatBoolean((preAuditData as any).access))
        ),
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "Documents:"),
          React.createElement(Text, { style: styles.dataValue }, formatBoolean((preAuditData as any).documents))
        )
      )
    ),
    
    React.createElement(Text, { style: styles.subsectionTitle }, "Atypical Loads"),
    React.createElement(View, { style: styles.twoColumnContainer },
      React.createElement(View, { style: styles.column },
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "Deicing:"),
          React.createElement(Text, { style: styles.dataValue }, formatBoolean((atypicalLoadsData as any).deicing))
        ),
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "Lighting:"),
          React.createElement(Text, { style: styles.dataValue }, formatBoolean((atypicalLoadsData as any).lighting))
        ),
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "Hot Tub:"),
          React.createElement(Text, { style: styles.dataValue }, formatBoolean((atypicalLoadsData as any).hot_tub))
        )
      ),
      React.createElement(View, { style: styles.column },
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "Air Conditioner:"),
          React.createElement(Text, { style: styles.dataValue }, formatBoolean((atypicalLoadsData as any).air_conditioner))
        ),
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "Pool:"),
          React.createElement(Text, { style: styles.dataValue }, formatBoolean((atypicalLoadsData as any).pool))
        )
      )
    )
  );

  // Technical Details Page
  const houseData = audit.houseInfo || {};
  const foundationData = audit.foundationInfo || {};
  const heatingData = audit.heatingInfo || {};
  const dhwData = audit.domesticHotWaterInfo || {};

  const technicalPage = React.createElement(Page, { size: "A4", style: styles.page },
    React.createElement(Text, { style: styles.sectionHeader }, "Building Information"),
    React.createElement(View, { style: styles.twoColumnContainer },
      React.createElement(View, { style: styles.column },
        React.createElement(Text, { style: styles.subsectionTitle }, "House Information"),
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "Type:"),
          React.createElement(Text, { style: styles.dataValue }, (houseData as any).houseType || 'Not specified')
        ),
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "Year Built:"),
          React.createElement(Text, { style: styles.dataValue }, (houseData as any).yearBuilt || 'Not specified')
        ),
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "Height:"),
          React.createElement(Text, { style: styles.dataValue }, 
            (houseData as any).aboveGradeHeight ? 
              `${(houseData as any).aboveGradeHeight} ${(houseData as any).aboveGradeHeightUnit || 'm'}` : 
              'Not specified'
          )
        )
      ),
      React.createElement(View, { style: styles.column },
        React.createElement(Text, { style: styles.subsectionTitle }, "Foundation Information"),
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "Type:"),
          React.createElement(Text, { style: styles.dataValue }, formatArray((foundationData as any).foundationType))
        ),
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "Walls:"),
          React.createElement(Text, { style: styles.dataValue }, (foundationData as any).walls || 'Not specified')
        ),
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "Insulation:"),
          React.createElement(Text, { style: styles.dataValue }, (foundationData as any).insulation || 'Not specified')
        )
      )
    ),
    React.createElement(Text, { style: styles.sectionHeader }, "Mechanical Systems"),
    React.createElement(View, { style: styles.twoColumnContainer },
      React.createElement(View, { style: styles.column },
        React.createElement(Text, { style: styles.subsectionTitle }, "Heating System"),
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "Type:"),
          React.createElement(Text, { style: styles.dataValue }, formatArray((heatingData as any).heatingSystemType))
        ),
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "Fuel:"),
          React.createElement(Text, { style: styles.dataValue }, (heatingData as any).source || 'Not specified')
        ),
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "Make:"),
          React.createElement(Text, { style: styles.dataValue }, (heatingData as any).manufacturer || 'Not specified')
        )
      ),
      React.createElement(View, { style: styles.column },
        React.createElement(Text, { style: styles.subsectionTitle }, "Domestic Hot Water"),
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "Type:"),
          React.createElement(Text, { style: styles.dataValue }, (dhwData as any).domesticHotWaterType || 'Not specified')
        ),
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "Fuel:"),
          React.createElement(Text, { style: styles.dataValue }, (dhwData as any).fuel || 'Not specified')
        ),
        React.createElement(View, { style: styles.dataRow },
          React.createElement(Text, { style: styles.dataLabel }, "Volume:"),
          React.createElement(Text, { style: styles.dataValue }, (dhwData as any).tankVolume || 'Not specified')
        )
      )
    )
  );

  // Photos Page (if photos exist)
  const pages = [coverPage, preAuditPage, technicalPage];
  
  if (photoData.length > 0) {
    const validPhotos = photoData.filter(item => item.base64 !== null);
    
    if (validPhotos.length > 0) {
      console.log(`Adding ${validPhotos.length} photos to PDF`);
      
      const photosPage = React.createElement(Page, { size: "A4", style: styles.page },
        React.createElement(Text, { style: styles.sectionHeader }, "Audit Photos"),
        ...validPhotos.slice(0, 3).map((item, index) => {
          console.log(`Processing photo ${index + 1}: ${item.photo.category}`);
          return React.createElement(View, { key: item.photo.id, style: styles.photoContainer },
            React.createElement(Text, { style: styles.photoTitle },
              item.photo.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) + ' Photo'
            ),
            React.createElement(Text, { style: styles.photoFilename }, `File: ${item.photo.originalName}`),
            // Try to render image without React-PDF validation issues
            item.base64 ? React.createElement(Image, {
              style: { ...styles.photo, border: '1px solid #ccc' },
              src: item.base64,
              debug: true
            }) : React.createElement(Text, { style: { fontSize: 10, fontStyle: 'italic' } }, 'Image could not be loaded')
          );
        })
      );
      pages.push(photosPage);
    } else {
      console.log('No valid photos found for PDF');
    }
  } else {
    console.log('No photos provided for PDF');
  }

  return React.createElement(Document, {}, ...pages);
}

// Helper function to convert image to base64 with proper format
async function convertImageToBase64(photoId: string): Promise<string | null> {
  try {
    const response = await fetch(`/api/photos/${photoId}`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      console.warn(`Failed to fetch photo ${photoId}:`, response.status);
      return null;
    }
    
    const blob = await response.blob();
    
    // Ensure we have a valid image type
    const contentType = response.headers.get('content-type') || blob.type;
    if (!contentType.startsWith('image/')) {
      console.warn(`Invalid image type for photo ${photoId}: ${contentType}`);
      return null;
    }
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Ensure proper data URL format for React-PDF
        if (result && result.startsWith('data:image/')) {
          resolve(result);
        } else {
          console.warn(`Invalid data URL format for photo ${photoId}`);
          resolve(null);
        }
      };
      reader.onerror = () => {
        console.warn(`FileReader error for photo ${photoId}`);
        resolve(null);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn(`Error converting photo ${photoId} to base64:`, error);
    return null;
  }
}

export async function generateAuditPDFNew(audit: Audit, photos: AuditPhoto[]) {
  try {
    // Debug audit data structure
    console.log('Audit data for PDF:', {
      eligibilityCriteria: audit.eligibilityCriteria,
      preAuditDiscussion: audit.preAuditDiscussion,
      atypicalLoads: audit.atypicalLoads
    });
    
    // Convert photos to base64 if any exist
    const photoData: Array<{ photo: AuditPhoto; base64: string | null }> = [];
    
    if (photos.length > 0) {
      console.log(`Converting ${photos.length} photos to base64...`);
      for (const photo of photos.slice(0, 4)) { // Limit to 4 photos for PDF size
        console.log(`Converting photo: ${photo.id} (${photo.category})`);
        const base64 = await convertImageToBase64(photo.id);
        photoData.push({ photo, base64 });
        console.log(`Photo ${photo.id} converted:`, base64 ? 'SUCCESS' : 'FAILED');
      }
    }

    // Create PDF document with photo data
    const doc = createPDFDocumentWithPhotos(audit, photoData);
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