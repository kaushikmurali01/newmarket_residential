import { Document, Page, Text, View, Image, pdf, StyleSheet } from '@react-pdf/renderer';
import React from 'react';
import type { Audit, AuditPhoto } from '@shared/schema';

// Styles for the streamlined PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
    borderBottom: '2px solid #003366',
    paddingBottom: 10,
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#003366',
    marginBottom: 5,
  },
  companySubtitle: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#003366',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#003366',
    marginTop: 20,
    marginBottom: 15,
    borderBottom: '1px solid #cccccc',
    paddingBottom: 5,
  },
  subsectionHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#003366',
    marginTop: 15,
    marginBottom: 10,
  },
  infoBox: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    border: '1px solid #dee2e6',
    borderRadius: 5,
    marginBottom: 15,
  },
  infoBoxTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#003366',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 5,
    alignItems: 'flex-start',
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    width: 120,
    color: '#333333',
  },
  infoValue: {
    fontSize: 10,
    flex: 1,
    color: '#666666',
  },
  checklistContainer: {
    marginBottom: 20,
  },
  checklistItem: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 12,
    height: 12,
    border: '1px solid #333',
    marginRight: 8,
    marginTop: 1,
    textAlign: 'center',
    fontSize: 8,
  },
  checkboxChecked: {
    backgroundColor: '#22c55e',
    color: 'white',
  },
  checkboxUnchecked: {
    backgroundColor: '#ffffff',
  },
  checklistLabel: {
    fontSize: 10,
    flex: 1,
    color: '#333333',
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
    maxWidth: 500,
    maxHeight: 400,
    objectFit: 'contain',
  },
});

// Helper function to convert image to base64 with better format handling
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
    const contentType = response.headers.get('content-type') || blob.type;
    
    if (!contentType.startsWith('image/')) {
      console.warn(`Invalid image type for photo ${photoId}: ${contentType}`);
      return null;
    }

    // Convert to canvas-compatible format to solve React-PDF issues
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        if (result && result.startsWith('data:image/')) {
          // For browser environment, use HTMLImageElement
          if (typeof window !== 'undefined' && window.Image) {
            const img = document.createElement('img');
            img.onload = () => {
              try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                if (!ctx) {
                  resolve(result);
                  return;
                }

                // Set canvas size
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                
                // Draw image and convert to PNG for React-PDF compatibility
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                
                // Convert to PNG with high quality
                const pngDataUrl = canvas.toDataURL('image/png', 1.0);
                resolve(pngDataUrl);
              } catch (canvasError) {
                console.warn(`Canvas conversion failed for ${photoId}, using original:`, canvasError);
                resolve(result);
              }
            };
            img.onerror = () => {
              console.warn(`Image loading failed for ${photoId}, using original`);
              resolve(result);
            };
            img.src = result;
          } else {
            // Fallback for non-browser environments
            resolve(result);
          }
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

// Create streamlined PDF document
function createStreamlinedPDF(audit: Audit, photoData: Array<{ photo: AuditPhoto; base64: string | null }>) {
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

  // Format audit date correctly from the audit data
  const auditDate = audit.auditDate ? 
    (typeof audit.auditDate === 'string' ? audit.auditDate : audit.auditDate.toISOString().split('T')[0]) :
    new Date().toISOString().split('T')[0];

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
        React.createElement(Text, { style: styles.infoValue }, new Date().toISOString().split('T')[0])
      ),
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, "Audit Date:"),
        React.createElement(Text, { style: styles.infoValue }, auditDate)
      )
    ),

    React.createElement(View, { style: styles.infoBox },
      React.createElement(Text, { style: styles.infoBoxTitle }, "Customer Information"),
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, "First Name:"),
        React.createElement(Text, { style: styles.infoValue }, audit.customerFirstName || 'Not provided')
      ),
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, "Last Name:"),
        React.createElement(Text, { style: styles.infoValue }, audit.customerLastName || 'Not provided')
      ),
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, "Email:"),
        React.createElement(Text, { style: styles.infoValue }, audit.customerEmail || 'Not provided')
      ),
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, "Phone:"),
        React.createElement(Text, { style: styles.infoValue }, audit.customerPhone || 'Not provided')
      )
    ),

    React.createElement(View, { style: styles.infoBox },
      React.createElement(Text, { style: styles.infoBoxTitle }, "Property Information"),
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, "Address:"),
        React.createElement(Text, { style: styles.infoValue }, audit.customerAddress || 'Not provided')
      ),
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, "City:"),
        React.createElement(Text, { style: styles.infoValue }, audit.customerCity || 'Not provided')
      ),
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, "Province:"),
        React.createElement(Text, { style: styles.infoValue }, audit.customerProvince || 'Not provided')
      ),
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, "Postal Code:"),
        React.createElement(Text, { style: styles.infoValue }, audit.customerPostalCode || 'Not provided')
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

  // Complete eligibility criteria checklist
  const eligibilityOptions = [
    { key: 'registered', label: 'Energy Advisor Registered' },
    { key: 'documents', label: 'Required Documents Available' },
    { key: 'storeys', label: 'Home is ≤3 Storeys Above Grade' },
    { key: 'size', label: 'Home is <600 m²' },
    { key: 'foundation', label: 'Foundation Accessible' },
    { key: 'mechanical', label: 'Mechanical Systems Accessible' },
    { key: 'doors_windows', label: 'Doors/Windows Accessible' },
    { key: 'envelope', label: 'Building Envelope Accessible' },
    { key: 'renovations', label: 'No Recent Major Renovations' },
    { key: 'ashes', label: 'No Wood Ash Storage' },
    { key: 'electrical', label: 'Electrical Panel Accessible' }
  ];

  // Pre-audit discussion options
  const discussionOptions = [
    { key: 'authorization', label: 'Homeowner Authorization Obtained' },
    { key: 'process', label: 'Audit Process Explained' },
    { key: 'access', label: 'Home Access Requirements Discussed' },
    { key: 'documents', label: 'Required Documentation Reviewed' }
  ];

  // Atypical loads options
  const atypicalLoadOptions = [
    { key: 'deicing', label: 'Deicing Cables' },
    { key: 'lighting', label: 'High-Intensity Lighting' },
    { key: 'hot_tub', label: 'Hot Tub/Spa' },
    { key: 'air_conditioner', label: 'Room Air Conditioner' },
    { key: 'pool', label: 'Swimming Pool Equipment' }
  ];

  const preAuditPage = React.createElement(Page, { size: "A4", style: styles.page },
    React.createElement(Text, { style: styles.sectionHeader }, "Pre-Audit Information"),
    
    React.createElement(Text, { style: styles.subsectionHeader }, "Eligibility Criteria"),
    React.createElement(View, { style: styles.checklistContainer },
      ...eligibilityOptions.map(option => {
        const isChecked = (eligibilityData as any)[option.key] === true;
        return React.createElement(View, { key: option.key, style: styles.checklistItem },
          React.createElement(View, { 
            style: [
              styles.checkbox, 
              isChecked ? styles.checkboxChecked : styles.checkboxUnchecked
            ] 
          },
            React.createElement(Text, { style: { fontSize: 8, color: isChecked ? 'white' : 'transparent' } }, "✓")
          ),
          React.createElement(Text, { style: styles.checklistLabel }, option.label)
        );
      })
    ),

    React.createElement(Text, { style: styles.subsectionHeader }, "Pre-audit Discussion"),
    React.createElement(View, { style: styles.checklistContainer },
      ...discussionOptions.map(option => {
        const isChecked = (preAuditData as any)[option.key] === true;
        return React.createElement(View, { key: option.key, style: styles.checklistItem },
          React.createElement(View, { 
            style: [
              styles.checkbox, 
              isChecked ? styles.checkboxChecked : styles.checkboxUnchecked
            ] 
          },
            React.createElement(Text, { style: { fontSize: 8, color: isChecked ? 'white' : 'transparent' } }, "✓")
          ),
          React.createElement(Text, { style: styles.checklistLabel }, option.label)
        );
      })
    ),

    // Add confirm email field if it exists
    audit.customerEmail && React.createElement(View, { style: styles.infoRow },
      React.createElement(Text, { style: styles.infoLabel }, "Confirmed Email:"),
      React.createElement(Text, { style: styles.infoValue }, audit.customerEmail)
    ),

    React.createElement(Text, { style: styles.subsectionHeader }, "Atypical Loads"),
    React.createElement(View, { style: styles.checklistContainer },
      ...atypicalLoadOptions.map(option => {
        const isChecked = (atypicalLoadsData as any)[option.key] === true;
        return React.createElement(View, { key: option.key, style: styles.checklistItem },
          React.createElement(View, { 
            style: [
              styles.checkbox, 
              isChecked ? styles.checkboxChecked : styles.checkboxUnchecked
            ] 
          },
            React.createElement(Text, { style: { fontSize: 8, color: isChecked ? 'white' : 'transparent' } }, "✓")
          ),
          React.createElement(Text, { style: styles.checklistLabel }, option.label)
        );
      })
    )
  );

  // Photos Pages
  const pages = [coverPage, preAuditPage];
  
  if (photoData.length > 0) {
    const validPhotos = photoData.filter(item => item.base64 !== null);
    
    if (validPhotos.length > 0) {
      console.log(`Adding ${validPhotos.length} photos to PDF with 2 photos per page`);
      
      // Create pages with 2 photos each
      for (let i = 0; i < validPhotos.length; i += 2) {
        const photo1 = validPhotos[i];
        const photo2 = validPhotos[i + 1]; // might be undefined for odd number of photos
        const pageNumber = Math.floor(i / 2) + 1;
        const totalPages = Math.ceil(validPhotos.length / 2);
        
        console.log(`Creating page ${pageNumber} with photos ${i + 1}${photo2 ? ` and ${i + 2}` : ''}`);
        
        const pageElements = [
          React.createElement(Text, { style: styles.sectionHeader }, 
            `Audit Photos (Page ${pageNumber} of ${totalPages})`),
        ];

        // First photo
        const photo1Elements = [
          React.createElement(View, { style: { marginBottom: 20 } },
            React.createElement(Text, { style: styles.photoTitle },
              photo1.photo.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) + ' Photo'
            ),
            React.createElement(Text, { style: styles.photoFilename }, 
              `File: ${photo1.photo.originalName}`)
          )
        ];

        // Add first image
        try {
          if (photo1.base64 && photo1.base64.length > 100) {
            photo1Elements.push(
              React.createElement(View, { style: { textAlign: 'center', marginBottom: 30 } },
                React.createElement(Image, {
                  style: {
                    width: 500,
                    height: 280,
                    objectFit: 'contain'
                  },
                  src: photo1.base64
                })
              )
            );
            console.log(`Image 1 added successfully for ${photo1.photo.originalName}`);
          } else {
            photo1Elements.push(
              React.createElement(Text, { 
                style: { fontSize: 12, color: '#ff0000', textAlign: 'center', marginBottom: 30 } 
              }, 'Image data is invalid or corrupted')
            );
          }
        } catch (imageError) {
          console.warn(`Failed to render first image:`, imageError);
          photo1Elements.push(
            React.createElement(Text, { 
              style: { fontSize: 12, color: '#ff0000', textAlign: 'center', marginBottom: 30 } 
            }, 'Image could not be rendered in PDF')
          );
        }

        pageElements.push(...photo1Elements);

        // Second photo (if exists)
        if (photo2) {
          const photo2Elements = [
            React.createElement(View, { style: { marginBottom: 15 } },
              React.createElement(Text, { style: styles.photoTitle },
                photo2.photo.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) + ' Photo'
              ),
              React.createElement(Text, { style: styles.photoFilename }, 
                `File: ${photo2.photo.originalName}`)
            )
          ];

          // Add second image
          try {
            if (photo2.base64 && photo2.base64.length > 100) {
              photo2Elements.push(
                React.createElement(View, { style: { textAlign: 'center' } },
                  React.createElement(Image, {
                    style: {
                      width: 500,
                      height: 280,
                      objectFit: 'contain'
                    },
                    src: photo2.base64
                  })
                )
              );
              console.log(`Image 2 added successfully for ${photo2.photo.originalName}`);
            } else {
              photo2Elements.push(
                React.createElement(Text, { 
                  style: { fontSize: 12, color: '#ff0000', textAlign: 'center' } 
                }, 'Image data is invalid or corrupted')
              );
            }
          } catch (imageError) {
            console.warn(`Failed to render second image:`, imageError);
            photo2Elements.push(
              React.createElement(Text, { 
                style: { fontSize: 12, color: '#ff0000', textAlign: 'center' } 
              }, 'Image could not be rendered in PDF')
            );
          }

          pageElements.push(...photo2Elements);
        }

        const photosPage = React.createElement(Page, { size: "A4", style: styles.page }, ...pageElements);
        pages.push(photosPage);
        console.log(`Added photo page ${pageNumber} with ${photo2 ? '2' : '1'} image(s)`);
      }
    }
  }

  // Always add House Information page
  console.log('Adding house information page (always included)');
  
  // Parse audit data sections
  let houseInfoData: any = {};
  let foundationInfoData: any = {};
  let wallsInfoData: any = {};
  let ceilingInfoData: any = {};
  let windowsInfoData: any = {};
  let doorsInfoData: any = {};
  let ventilationInfoData: any = {};
  let heatingInfoData: any = {};
  let domesticHotWaterInfoData: any = {};
  let renewablesInfoData: any = {};
  let blowerDoorTestData: any = {};
  let depressurizationTestData: any = {};

  try {
    houseInfoData = typeof audit.houseInfo === 'string' ? JSON.parse(audit.houseInfo) : audit.houseInfo || {};
    foundationInfoData = typeof audit.foundationInfo === 'string' ? JSON.parse(audit.foundationInfo) : audit.foundationInfo || {};
    wallsInfoData = typeof audit.wallsInfo === 'string' ? JSON.parse(audit.wallsInfo) : audit.wallsInfo || {};
    ceilingInfoData = typeof audit.ceilingInfo === 'string' ? JSON.parse(audit.ceilingInfo) : audit.ceilingInfo || {};
    windowsInfoData = typeof audit.windowsInfo === 'string' ? JSON.parse(audit.windowsInfo) : audit.windowsInfo || {};
    doorsInfoData = typeof audit.doorsInfo === 'string' ? JSON.parse(audit.doorsInfo) : audit.doorsInfo || {};
    ventilationInfoData = typeof audit.ventilationInfo === 'string' ? JSON.parse(audit.ventilationInfo) : audit.ventilationInfo || {};
    heatingInfoData = typeof audit.heatingInfo === 'string' ? JSON.parse(audit.heatingInfo) : audit.heatingInfo || {};
    domesticHotWaterInfoData = typeof audit.domesticHotWaterInfo === 'string' ? JSON.parse(audit.domesticHotWaterInfo) : audit.domesticHotWaterInfo || {};
    renewablesInfoData = typeof audit.renewablesInfo === 'string' ? JSON.parse(audit.renewablesInfo) : audit.renewablesInfo || {};
    blowerDoorTestData = typeof audit.blowerDoorTest === 'string' ? JSON.parse(audit.blowerDoorTest) : audit.blowerDoorTest || {};
    depressurizationTestData = typeof audit.depressurizationTest === 'string' ? JSON.parse(audit.depressurizationTest) : audit.depressurizationTest || {};
  } catch (e) {
    console.log('Error parsing house info data:', e);
  }

  // Foundation Type options with actual selections
  const foundationTypeOptions = [
    { key: 'basement', label: 'Basement', selected: foundationInfoData.foundationType?.includes('basement') || false },
    { key: 'crawlspace', label: 'Crawlspace', selected: foundationInfoData.foundationType?.includes('crawlspace') || false },
    { key: 'slab', label: 'Slab', selected: foundationInfoData.foundationType?.includes('slab') || false }
  ];

  // Cavity Insulation options with actual selections
  const cavityInsulationOptions = [
    { key: 'R10', label: 'R10', selected: wallsInfoData.cavityInsulation?.includes('R10') || false },
    { key: 'R12', label: 'R12', selected: wallsInfoData.cavityInsulation?.includes('R12') || false },
    { key: 'R18', label: 'R18', selected: wallsInfoData.cavityInsulation?.includes('R18') || false },
    { key: 'R19', label: 'R19', selected: wallsInfoData.cavityInsulation?.includes('R19') || false },
    { key: 'R22', label: 'R22', selected: wallsInfoData.cavityInsulation?.includes('R22') || false },
    { key: 'R24', label: 'R24', selected: wallsInfoData.cavityInsulation?.includes('R24') || false },
    { key: 'other', label: 'Other', selected: wallsInfoData.cavityInsulation?.includes('other') || false }
  ];

  // Exterior Insulation Type options with actual selections
  const exteriorInsulationOptions = [
    { key: 'eps', label: 'EPS', selected: wallsInfoData.exteriorInsulationType?.includes('eps') || false },
    { key: 'xps', label: 'XPS', selected: wallsInfoData.exteriorInsulationType?.includes('xps') || false },
    { key: 'mineral_wool', label: 'Mineral Wool', selected: wallsInfoData.exteriorInsulationType?.includes('mineral_wool') || false }
  ];

  // Attic Insulation Type options with actual selections
  const atticInsulationOptions = [
    { key: 'fibreglass', label: 'Fibreglass', selected: ceilingInfoData.atticInsulationType?.includes('fibreglass') || false },
    { key: 'cellulose', label: 'Cellulose', selected: ceilingInfoData.atticInsulationType?.includes('cellulose') || false },
    { key: 'foam', label: 'Foam', selected: ceilingInfoData.atticInsulationType?.includes('foam') || false }
  ];

  // Heating System Type options with actual selections
  const heatingSystemTypeOptions = [
    { key: 'furnace', label: 'Furnace', selected: heatingInfoData.heatingSystemType?.includes('furnace') || false },
    { key: 'boiler', label: 'Boiler', selected: heatingInfoData.heatingSystemType?.includes('boiler') || false },
    { key: 'combo', label: 'Combo', selected: heatingInfoData.heatingSystemType?.includes('combo') || false },
    { key: 'integrated', label: 'Integrated', selected: heatingInfoData.heatingSystemType?.includes('integrated') || false },
    { key: 'csa_p9_11', label: 'CSA P.9-11', selected: heatingInfoData.heatingSystemType?.includes('csa_p9_11') || false },
    { key: 'heat_pump', label: 'Heat Pump', selected: heatingInfoData.heatingSystemType?.includes('heat_pump') || false }
  ];

  // Solar PV Module Type options with actual selections
  const solarPvModuleTypeOptions = [
    { key: 'mono_si', label: 'Mono-Si', selected: renewablesInfoData.solarPv?.moduleType?.includes('mono_si') || false },
    { key: 'poly_si', label: 'Poly-Si', selected: renewablesInfoData.solarPv?.moduleType?.includes('poly_si') || false },
    { key: 'a_si', label: 'a-Si', selected: renewablesInfoData.solarPv?.moduleType?.includes('a_si') || false },
    { key: 'cd_te', label: 'CdTe', selected: renewablesInfoData.solarPv?.moduleType?.includes('cd_te') || false },
    { key: 'cis', label: 'CIS', selected: renewablesInfoData.solarPv?.moduleType?.includes('cis') || false }
  ];

  // Blower Door Test Areas of Leakage options with actual selections
  const areasOfLeakageOptions = [
    { key: 'rims', label: 'Rims', selected: blowerDoorTestData.areasOfLeakage?.rims || false },
    { key: 'electric_outlet', label: 'Electric Outlet', selected: blowerDoorTestData.areasOfLeakage?.electric_outlet || false },
    { key: 'doors', label: 'Doors', selected: blowerDoorTestData.areasOfLeakage?.doors || false },
    { key: 'wall_intersections', label: 'Wall Intersections', selected: blowerDoorTestData.areasOfLeakage?.wall_intersections || false },
    { key: 'baseboards', label: 'Baseboards', selected: blowerDoorTestData.areasOfLeakage?.baseboards || false },
    { key: 'ceiling_fixtures', label: 'Ceiling Fixtures', selected: blowerDoorTestData.areasOfLeakage?.ceiling_fixtures || false },
    { key: 'window_frames', label: 'Window Frames', selected: blowerDoorTestData.areasOfLeakage?.window_frames || false },
    { key: 'electric_panel', label: 'Electric Panel', selected: blowerDoorTestData.areasOfLeakage?.electric_panel || false },
    { key: 'attic_access', label: 'Attic Access', selected: blowerDoorTestData.areasOfLeakage?.attic_access || false }
  ];

  const houseInfoElements = [
    React.createElement(Text, { style: styles.sectionHeader }, 'House Information'),
    
    // House Details section
    React.createElement(Text, { style: styles.subsectionHeader }, 'House Details'),
    React.createElement(View, { style: styles.infoBox },
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'House Type:'),
        React.createElement(Text, { style: styles.infoValue }, 
          houseInfoData.houseType ? houseInfoData.houseType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : 'Not specified'
        )
      ),
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'Year Built:'),
        React.createElement(Text, { style: styles.infoValue }, houseInfoData.yearBuilt || 'Not specified')
      ),
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'Above Grade Height:'),
        React.createElement(Text, { style: styles.infoValue }, 
          houseInfoData.aboveGradeHeightUnit === 'ft' && houseInfoData.aboveGradeFeet && houseInfoData.aboveGradeInches
            ? `${houseInfoData.aboveGradeFeet} ft ${houseInfoData.aboveGradeInches} in`
            : houseInfoData.aboveGradeHeight 
              ? `${houseInfoData.aboveGradeHeight} ${houseInfoData.aboveGradeHeightUnit || 'ft'}`
              : 'Not specified'
        )
      ),
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'Front Orientation:'),
        React.createElement(Text, { style: styles.infoValue }, houseInfoData.frontOrientation || 'Not specified')
      )
    ),
    
    // Foundation section
    React.createElement(Text, { style: styles.subsectionHeader }, 'Foundation'),
    React.createElement(Text, { style: styles.infoBoxTitle }, 'Foundation Type:'),
    React.createElement(View, { style: styles.checklistContainer },
      ...foundationTypeOptions.map(option => {
        return React.createElement(View, { key: option.key, style: styles.checklistItem },
          React.createElement(View, { 
            style: [
              styles.checkbox, 
              option.selected ? styles.checkboxChecked : styles.checkboxUnchecked
            ] 
          },
            React.createElement(Text, { style: { fontSize: 8, color: option.selected ? 'white' : 'transparent' } }, "✓")
          ),
          React.createElement(Text, { style: styles.checklistLabel }, option.label)
        );
      })
    ),
    React.createElement(View, { style: styles.infoBox },
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'Crawlspace Type:'),
        React.createElement(Text, { style: styles.infoValue }, 
          foundationInfoData.crawlspaceType ? foundationInfoData.crawlspaceType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : 'Not specified'
        )
      ),
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'Pony Wall?:'),
        React.createElement(Text, { style: styles.infoValue }, 
          foundationInfoData.ponyWall ? (foundationInfoData.ponyWall === 'yes' ? 'Yes' : 'No') : 'Not specified'
        )
      )
    ),
    
    // Walls section
    React.createElement(Text, { style: styles.subsectionHeader }, 'Walls'),
    React.createElement(View, { style: styles.infoBox },
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'Wall Framing:'),
        React.createElement(Text, { style: styles.infoValue }, wallsInfoData.wallFraming || 'Not specified')
      ),
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'Centres:'),
        React.createElement(Text, { style: styles.infoValue }, 
          wallsInfoData.centres ? 
            (wallsInfoData.centres === '19.2' ? '488 mm (19.2")' : 
             wallsInfoData.centres === '16' ? '406 mm (16")' :
             wallsInfoData.centres === '24' ? '610 mm (24")' :
             wallsInfoData.centres) : 'Not specified'
        )
      )
    ),
    
    // Wall Heights by Floor - only show if floors data exists
    wallsInfoData.floors && wallsInfoData.floors.length > 0 && React.createElement(Text, { style: styles.infoBoxTitle }, 'Wall Heights by Floor:'),
    wallsInfoData.floors && wallsInfoData.floors.length > 0 && React.createElement(View, { style: styles.infoBox },
      ...wallsInfoData.floors.map((floor: any) => {
        if (!floor.wallHeight) return null;
        const heightText = floor.wallHeightUnit === 'ft' && floor.wallHeightFeet && floor.wallHeightInches
          ? `${floor.wallHeightFeet} ft ${floor.wallHeightInches} in`
          : `${floor.wallHeight} ${floor.wallHeightUnit || 'ft'}`;
        
        return React.createElement(View, { key: floor.id || floor.name, style: styles.infoRow },
          React.createElement(Text, { style: styles.infoLabel }, 
            floor.name ? floor.name.replace(/\b\w/g, (l: string) => l.toUpperCase()) + ':' : 'Floor:'
          ),
          React.createElement(Text, { style: styles.infoValue }, heightText)
        );
      }).filter(Boolean)
    ),
    
    React.createElement(Text, { style: styles.infoBoxTitle }, 'Cavity Insulation:'),
    React.createElement(View, { style: styles.checklistContainer },
      ...cavityInsulationOptions.map(option => {
        return React.createElement(View, { key: option.key, style: styles.checklistItem },
          React.createElement(View, { 
            style: [
              styles.checkbox, 
              option.selected ? styles.checkboxChecked : styles.checkboxUnchecked
            ] 
          },
            React.createElement(Text, { style: { fontSize: 8, color: option.selected ? 'white' : 'transparent' } }, "✓")
          ),
          React.createElement(Text, { style: styles.checklistLabel }, option.label)
        );
      })
    ),
    
    React.createElement(Text, { style: styles.infoBoxTitle }, 'Exterior Insulation Type:'),
    React.createElement(View, { style: styles.checklistContainer },
      ...exteriorInsulationOptions.map(option => {
        return React.createElement(View, { key: option.key, style: styles.checklistItem },
          React.createElement(View, { 
            style: [
              styles.checkbox, 
              option.selected ? styles.checkboxChecked : styles.checkboxUnchecked
            ] 
          },
            React.createElement(Text, { style: { fontSize: 8, color: option.selected ? 'white' : 'transparent' } }, "✓")
          ),
          React.createElement(Text, { style: styles.checklistLabel }, option.label)
        );
      })
    ),
    
    React.createElement(View, { style: styles.infoBox },
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'Exterior Sheathing:'),
        React.createElement(Text, { style: styles.infoValue }, 
          wallsInfoData.exteriorSheathing ? wallsInfoData.exteriorSheathing.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : 'Not specified'
        )
      ),
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'Exterior Finish:'),
        React.createElement(Text, { style: styles.infoValue }, 
          wallsInfoData.exteriorFinish ? 
            (wallsInfoData.exteriorFinish === 'other' && wallsInfoData.exteriorFinishOther
              ? `Other - ${wallsInfoData.exteriorFinishOther}`
              : wallsInfoData.exteriorFinish.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
            ) : 'Not specified'
        )
      )
    ),
    
    // Windows section
    React.createElement(Text, { style: styles.subsectionHeader }, 'Windows'),
    React.createElement(View, { style: styles.infoBox },
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'Frame:'),
        React.createElement(Text, { style: styles.infoValue }, 
          windowsInfoData.frame ? windowsInfoData.frame.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : 'Not specified'
        )
      ),
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'Low-E Coating:'),
        React.createElement(Text, { style: styles.infoValue }, windowsInfoData.lowECoating || 'Not specified')
      ),
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'Gas Fill:'),
        React.createElement(Text, { style: styles.infoValue }, 
          windowsInfoData.gasFill ? (windowsInfoData.gasFill === 'yes' ? 'Yes' : 'No') : 'Not specified'
        )
      ),
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'Glazing:'),
        React.createElement(Text, { style: styles.infoValue }, windowsInfoData.glazing || 'Not specified')
      )
    ),
    
    // Doors section
    React.createElement(Text, { style: styles.subsectionHeader }, 'Doors'),
    React.createElement(View, { style: styles.infoBox },
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'Skin:'),
        React.createElement(Text, { style: styles.infoValue }, 
          doorsInfoData.skin ? doorsInfoData.skin.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : 'Not specified'
        )
      ),
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'Insulation:'),
        React.createElement(Text, { style: styles.infoValue }, 
          doorsInfoData.insulation ? doorsInfoData.insulation.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : 'Not specified'
        )
      )
    ),
    
    // Ceiling section
    React.createElement(Text, { style: styles.subsectionHeader }, 'Ceiling'),
    React.createElement(View, { style: styles.infoBox },
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'Attic Framing:'),
        React.createElement(Text, { style: styles.infoValue }, 
          ceilingInfoData.atticFraming ? ceilingInfoData.atticFraming.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : 'Not specified'
        )
      ),
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'Ceiling Type:'),
        React.createElement(Text, { style: styles.infoValue }, 
          ceilingInfoData.ceilingType ? ceilingInfoData.ceilingType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : 'Not specified'
        )
      ),
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'Spacing:'),
        React.createElement(Text, { style: styles.infoValue }, 
          ceilingInfoData.spacing ? 
            (ceilingInfoData.spacing === '19.2' ? '488 mm (19.2")' : 
             ceilingInfoData.spacing === '16' ? '406 mm (16")' :
             ceilingInfoData.spacing === '24' ? '610 mm (24")' :
             ceilingInfoData.spacing) : 'Not specified'
        )
      )
    ),
    
    React.createElement(Text, { style: styles.infoBoxTitle }, 'Attic Insulation Type:'),
    React.createElement(View, { style: styles.checklistContainer },
      ...atticInsulationOptions.map(option => {
        return React.createElement(View, { key: option.key, style: styles.checklistItem },
          React.createElement(View, { 
            style: [
              styles.checkbox, 
              option.selected ? styles.checkboxChecked : styles.checkboxUnchecked
            ] 
          },
            React.createElement(Text, { style: { fontSize: 8, color: option.selected ? 'white' : 'transparent' } }, "✓")
          ),
          React.createElement(Text, { style: styles.checklistLabel }, option.label)
        );
      })
    ),
    
    // Ventilation section
    React.createElement(Text, { style: styles.subsectionHeader }, 'Ventilation'),
    React.createElement(View, { style: styles.infoBox },
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'Ventilation Type:'),
        React.createElement(Text, { style: styles.infoValue }, 
          ventilationInfoData.ventilationType ? 
            ventilationInfoData.ventilationType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : 'Not specified'
        )
      ),
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'HRV Manufacturer:'),
        React.createElement(Text, { style: styles.infoValue }, ventilationInfoData.hrvManufacturer || 'Not specified')
      ),
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'HRV Model:'),
        React.createElement(Text, { style: styles.infoValue }, ventilationInfoData.hrvModel || 'Not specified')
      ),
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'HVI Certified:'),
        React.createElement(Text, { style: styles.infoValue }, 
          ventilationInfoData.hviCertified ? (ventilationInfoData.hviCertified === 'yes' ? 'Yes' : 'No') : 'Not specified'
        )
      )
    ),
    
    // HRV CFM section
    ventilationInfoData.hrvCfm && (ventilationInfoData.hrvCfm.supply || ventilationInfoData.hrvCfm.exhaust) && 
    React.createElement(Text, { style: styles.infoBoxTitle }, 'HRV CFM:'),
    ventilationInfoData.hrvCfm && (ventilationInfoData.hrvCfm.supply || ventilationInfoData.hrvCfm.exhaust) && 
    React.createElement(View, { style: styles.infoBox },
      ventilationInfoData.hrvCfm.supply && React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'Supply:'),
        React.createElement(Text, { style: styles.infoValue }, `${ventilationInfoData.hrvCfm.supply} CFM`)
      ),
      ventilationInfoData.hrvCfm.exhaust && React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'Exhaust:'),
        React.createElement(Text, { style: styles.infoValue }, `${ventilationInfoData.hrvCfm.exhaust} CFM`)
      )
    ),
    
    // Fan Power section
    ventilationInfoData.fanPower && (ventilationInfoData.fanPower.at0C || ventilationInfoData.fanPower.atMinus25) &&
    React.createElement(Text, { style: styles.infoBoxTitle }, 'Fan Power (Watts):'),
    ventilationInfoData.fanPower && (ventilationInfoData.fanPower.at0C || ventilationInfoData.fanPower.atMinus25) &&
    React.createElement(View, { style: styles.infoBox },
      ventilationInfoData.fanPower.at0C && React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'At 0°C:'),
        React.createElement(Text, { style: styles.infoValue }, `${ventilationInfoData.fanPower.at0C} W`)
      ),
      ventilationInfoData.fanPower.atMinus25 && React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'At -25°C:'),
        React.createElement(Text, { style: styles.infoValue }, `${ventilationInfoData.fanPower.atMinus25} W`)
      )
    ),
    
    // Sensible Efficiency section
    ventilationInfoData.sensibleEfficiency && (ventilationInfoData.sensibleEfficiency.at0C || ventilationInfoData.sensibleEfficiency.atMinus25C) &&
    React.createElement(Text, { style: styles.infoBoxTitle }, 'Sensible Efficiency (%):'),
    ventilationInfoData.sensibleEfficiency && (ventilationInfoData.sensibleEfficiency.at0C || ventilationInfoData.sensibleEfficiency.atMinus25C) &&
    React.createElement(View, { style: styles.infoBox },
      ventilationInfoData.sensibleEfficiency.at0C && React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'At 0°C:'),
        React.createElement(Text, { style: styles.infoValue }, `${ventilationInfoData.sensibleEfficiency.at0C}%`)
      ),
      ventilationInfoData.sensibleEfficiency.atMinus25C && React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'At -25°C:'),
        React.createElement(Text, { style: styles.infoValue }, `${ventilationInfoData.sensibleEfficiency.atMinus25C}%`)
      )
    ),
    
    // Ventilation Devices section
    React.createElement(Text, { style: styles.infoBoxTitle }, 'Ventilation Devices:'),
    
    // Bath Fan device and details
    ventilationInfoData.device?.bathFan?.cfm && React.createElement(View, { style: styles.infoBox },
      React.createElement(Text, { style: { fontSize: 11, fontWeight: 'bold', marginBottom: 8, color: '#003366' } }, 'Bath Fan'),
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'CFM:'),
        React.createElement(Text, { style: styles.infoValue }, ventilationInfoData.device.bathFan.cfm)
      ),
      ventilationInfoData.bathFanDetails?.manufacturer && React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'Manufacturer:'),
        React.createElement(Text, { style: styles.infoValue }, ventilationInfoData.bathFanDetails.manufacturer)
      ),
      ventilationInfoData.bathFanDetails?.model && React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'Model:'),
        React.createElement(Text, { style: styles.infoValue }, ventilationInfoData.bathFanDetails.model)
      ),
      ventilationInfoData.bathFanDetails?.exhaustFlow && React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'Exhaust Flow:'),
        React.createElement(Text, { style: styles.infoValue }, `${ventilationInfoData.bathFanDetails.exhaustFlow} CFM`)
      ),
      ventilationInfoData.bathFanDetails?.fanPower && React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'Fan Power:'),
        React.createElement(Text, { style: styles.infoValue }, `${ventilationInfoData.bathFanDetails.fanPower} W`)
      )
    ),
    
    // Range Hood device and details
    ventilationInfoData.device?.rangeHood?.cfm && React.createElement(View, { style: styles.infoBox },
      React.createElement(Text, { style: { fontSize: 11, fontWeight: 'bold', marginBottom: 8, color: '#003366' } }, 'Range Hood'),
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'CFM:'),
        React.createElement(Text, { style: styles.infoValue }, ventilationInfoData.device.rangeHood.cfm)
      ),
      ventilationInfoData.rangeHoodDetails?.manufacturer && React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'Manufacturer:'),
        React.createElement(Text, { style: styles.infoValue }, ventilationInfoData.rangeHoodDetails.manufacturer)
      )
    ),
    
    // Utility Fan device and details
    ventilationInfoData.device?.utilityFan?.cfm && React.createElement(View, { style: styles.infoBox },
      React.createElement(Text, { style: { fontSize: 11, fontWeight: 'bold', marginBottom: 8, color: '#003366' } }, 'Utility Fan'),
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'CFM:'),
        React.createElement(Text, { style: styles.infoValue }, ventilationInfoData.device.utilityFan.cfm)
      ),
      ventilationInfoData.utilityFanDetails?.manufacturer && React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'Manufacturer:'),
        React.createElement(Text, { style: styles.infoValue }, ventilationInfoData.utilityFanDetails.manufacturer)
      ),
      ventilationInfoData.utilityFanDetails?.flowRate && React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'Flow Rate:'),
        React.createElement(Text, { style: styles.infoValue }, `${ventilationInfoData.utilityFanDetails.flowRate} CFM`)
      )
    ),
    
    // Heating System section
    React.createElement(Text, { style: styles.subsectionHeader }, 'Heating System'),
    
    // Heating System Type with checkboxes
    React.createElement(Text, { style: styles.infoBoxTitle }, 'Heating System Type:'),
    React.createElement(View, { style: styles.checklistContainer },
      ...heatingSystemTypeOptions.map(option => {
        return React.createElement(View, { key: option.key, style: styles.checklistItem },
          React.createElement(View, { 
            style: [
              styles.checkbox, 
              option.selected ? styles.checkboxChecked : styles.checkboxUnchecked
            ] 
          },
            React.createElement(Text, { style: { fontSize: 8, color: option.selected ? 'white' : 'transparent' } }, "✓")
          ),
          React.createElement(Text, { style: styles.checklistLabel }, option.label)
        );
      })
    ),
    
    // Basic Heating System Information
    React.createElement(View, { style: styles.infoBox },
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'Source:'),
        React.createElement(Text, { style: styles.infoValue }, 
          heatingInfoData.source ? 
            (heatingInfoData.source === 'ng' ? 'Natural Gas' :
             heatingInfoData.source === 'propane' ? 'Propane' :
             heatingInfoData.source.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())) : 'Not specified'
        )
      ),
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'Manufacturer:'),
        React.createElement(Text, { style: styles.infoValue }, heatingInfoData.manufacturer || 'Not specified')
      ),
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'Model:'),
        React.createElement(Text, { style: styles.infoValue }, heatingInfoData.model || 'Not specified')
      )
    ),
    
    // Rated Efficiency section
    heatingInfoData.ratedEfficiency && (heatingInfoData.ratedEfficiency.overall || heatingInfoData.ratedEfficiency.afue || heatingInfoData.ratedEfficiency.steadyState) &&
    React.createElement(Text, { style: styles.infoBoxTitle }, 'Rated Efficiency:'),
    heatingInfoData.ratedEfficiency && (heatingInfoData.ratedEfficiency.overall || heatingInfoData.ratedEfficiency.afue || heatingInfoData.ratedEfficiency.steadyState) &&
    React.createElement(View, { style: styles.infoBox },
      heatingInfoData.ratedEfficiency.overall && React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'Overall (%):'),
        React.createElement(Text, { style: styles.infoValue }, `${heatingInfoData.ratedEfficiency.overall}%`)
      ),
      heatingInfoData.ratedEfficiency.afue && React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'AFUE (%):'),
        React.createElement(Text, { style: styles.infoValue }, `${heatingInfoData.ratedEfficiency.afue}%`)
      ),
      heatingInfoData.ratedEfficiency.steadyState && React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'Steady State (%):'),
        React.createElement(Text, { style: styles.infoValue }, `${heatingInfoData.ratedEfficiency.steadyState}%`)
      )
    ),
    
    // System Configuration
    React.createElement(View, { style: styles.infoBox },
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'Ignition Type:'),
        React.createElement(Text, { style: styles.infoValue }, 
          heatingInfoData.ignitionType ? 
            heatingInfoData.ignitionType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : 'Not specified'
        )
      ),
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'Automatic Vent (Flue Damper):'),
        React.createElement(Text, { style: styles.infoValue }, 
          heatingInfoData.automaticVentDamper ? 
            (heatingInfoData.automaticVentDamper === 'yes_motorized' ? 'Yes - Motorized' :
             heatingInfoData.automaticVentDamper === 'no_fixed_barometric' ? 'No - Fixed Barometric' :
             heatingInfoData.automaticVentDamper === 'na_sealed_combustion' ? 'N/A - Sealed Combustion' :
             heatingInfoData.automaticVentDamper.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())) : 'Not specified'
        )
      ),
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'Dedicated Combustion Air Duct:'),
        React.createElement(Text, { style: styles.infoValue }, 
          heatingInfoData.dedicatedCombustionAirDuct ? 
            (heatingInfoData.dedicatedCombustionAirDuct === 'yes' ? 'Yes' : 'No') : 'Not specified'
        )
      ),
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'Fan/Pump Motor Type:'),
        React.createElement(Text, { style: styles.infoValue }, 
          heatingInfoData.fanPumpMotorType ? 
            (heatingInfoData.fanPumpMotorType === 'ecm_motor' ? 'ECM Motor' :
             heatingInfoData.fanPumpMotorType === 'psc_motor' ? 'PSC Motor' :
             heatingInfoData.fanPumpMotorType === 'vfd_motor' ? 'VFD Motor' :
             heatingInfoData.fanPumpMotorType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())) : 'Not specified'
        )
      ),
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'Venting Configuration:'),
        React.createElement(Text, { style: styles.infoValue }, 
          heatingInfoData.ventingConfiguration ? 
            heatingInfoData.ventingConfiguration.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : 'Not specified'
        )
      )
    ),
    
    // Heat Pump and Additional Equipment (if applicable)
    (heatingInfoData.heatPumpManufacturer || heatingInfoData.heatPumpModel || heatingInfoData.supplementaryHeatingSystem || heatingInfoData.acCoil || heatingInfoData.condenserUnit) &&
    React.createElement(Text, { style: styles.infoBoxTitle }, 'Additional Equipment:'),
    (heatingInfoData.heatPumpManufacturer || heatingInfoData.heatPumpModel || heatingInfoData.supplementaryHeatingSystem || heatingInfoData.acCoil || heatingInfoData.condenserUnit) &&
    React.createElement(View, { style: styles.infoBox },
      heatingInfoData.heatPumpManufacturer && React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'Heat Pump Manufacturer:'),
        React.createElement(Text, { style: styles.infoValue }, heatingInfoData.heatPumpManufacturer)
      ),
      heatingInfoData.heatPumpModel && React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'Heat Pump Model:'),
        React.createElement(Text, { style: styles.infoValue }, heatingInfoData.heatPumpModel)
      ),
      heatingInfoData.supplementaryHeatingSystem && React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'Supplementary Heating System:'),
        React.createElement(Text, { style: styles.infoValue }, heatingInfoData.supplementaryHeatingSystem)
      ),
      heatingInfoData.acCoil && React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'A/C Coil:'),
        React.createElement(Text, { style: styles.infoValue }, heatingInfoData.acCoil)
      ),
      heatingInfoData.condenserUnit && React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'Condenser Unit:'),
        React.createElement(Text, { style: styles.infoValue }, heatingInfoData.condenserUnit)
      )
    ),
    
    // Domestic Hot Water (DHW) section
    React.createElement(Text, { style: styles.subsectionHeader }, 'Domestic Hot Water (DHW)'),
    React.createElement(View, { style: styles.infoBox },
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'DHW Type:'),
        React.createElement(Text, { style: styles.infoValue }, 
          domesticHotWaterInfoData.domesticHotWaterType ? 
            domesticHotWaterInfoData.domesticHotWaterType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : 'Not specified'
        )
      ),
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'Fuel:'),
        React.createElement(Text, { style: styles.infoValue }, 
          domesticHotWaterInfoData.fuel ? 
            (domesticHotWaterInfoData.fuel === 'nat_gas' ? 'Natural Gas' :
             domesticHotWaterInfoData.fuel.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())) : 'Not specified'
        )
      ),
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'Manufacturer:'),
        React.createElement(Text, { style: styles.infoValue }, domesticHotWaterInfoData.manufacturer || 'Not specified')
      ),
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'Model:'),
        React.createElement(Text, { style: styles.infoValue }, domesticHotWaterInfoData.model || 'Not specified')
      ),
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'Tank Volume (L):'),
        React.createElement(Text, { style: styles.infoValue }, 
          domesticHotWaterInfoData.tankVolume ? `${domesticHotWaterInfoData.tankVolume} L` : 'Not specified'
        )
      ),
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'Efficiency Factor:'),
        React.createElement(Text, { style: styles.infoValue }, domesticHotWaterInfoData.efficiencyFactor || 'Not specified')
      ),
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'COP:'),
        React.createElement(Text, { style: styles.infoValue }, domesticHotWaterInfoData.cop || 'Not specified')
      ),
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'Pilot:'),
        React.createElement(Text, { style: styles.infoValue }, 
          domesticHotWaterInfoData.pilot ? (domesticHotWaterInfoData.pilot === 'yes' ? 'Yes' : 'No') : 'Not specified'
        )
      ),
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'Co-Vented:'),
        React.createElement(Text, { style: styles.infoValue }, 
          domesticHotWaterInfoData.coVented ? (domesticHotWaterInfoData.coVented === 'yes' ? 'Yes' : 'No') : 'Not specified'
        )
      ),
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'Flue Diameter (inches):'),
        React.createElement(Text, { style: styles.infoValue }, 
          domesticHotWaterInfoData.flueDiameter ? `${domesticHotWaterInfoData.flueDiameter}"` : 'Not specified'
        )
      ),
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, '# of Showers to Main Stack:'),
        React.createElement(Text, { style: styles.infoValue }, domesticHotWaterInfoData.showersToMainStack || 'Not specified')
      ),
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, '# of Low Flush Toilets:'),
        React.createElement(Text, { style: styles.infoValue }, domesticHotWaterInfoData.lowFlushToilets || 'Not specified')
      )
    ),
    
    // DWHR section (if present)
    domesticHotWaterInfoData.dwhr && (domesticHotWaterInfoData.dwhr.present === 'yes' || domesticHotWaterInfoData.dwhr.manufacturer || domesticHotWaterInfoData.dwhr.model || domesticHotWaterInfoData.dwhr.size) &&
    React.createElement(Text, { style: styles.infoBoxTitle }, 'DWHR (Drain Water Heat Recovery):'),
    domesticHotWaterInfoData.dwhr && (domesticHotWaterInfoData.dwhr.present === 'yes' || domesticHotWaterInfoData.dwhr.manufacturer || domesticHotWaterInfoData.dwhr.model || domesticHotWaterInfoData.dwhr.size) &&
    React.createElement(View, { style: styles.infoBox },
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'DWHR Present:'),
        React.createElement(Text, { style: styles.infoValue }, 
          domesticHotWaterInfoData.dwhr.present ? (domesticHotWaterInfoData.dwhr.present === 'yes' ? 'Yes' : 'No') : 'Not specified'
        )
      ),
      domesticHotWaterInfoData.dwhr.manufacturer && React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'DWHR Manufacturer:'),
        React.createElement(Text, { style: styles.infoValue }, domesticHotWaterInfoData.dwhr.manufacturer)
      ),
      domesticHotWaterInfoData.dwhr.model && React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'DWHR Model:'),
        React.createElement(Text, { style: styles.infoValue }, domesticHotWaterInfoData.dwhr.model)
      ),
      domesticHotWaterInfoData.dwhr.size && React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'DWHR Size (Inches):'),
        React.createElement(Text, { style: styles.infoValue }, `${domesticHotWaterInfoData.dwhr.size}"`)
      ),
      domesticHotWaterInfoData.dwhrToShower && React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'DWHR to Shower:'),
        React.createElement(Text, { style: styles.infoValue }, 
          domesticHotWaterInfoData.dwhrToShower === 'yes' ? 'Yes' : 'No'
        )
      )
    ),
    
    // Renewables section
    React.createElement(Text, { style: styles.subsectionHeader }, 'Renewables'),
    
    // Solar PV section
    React.createElement(Text, { style: styles.infoBoxTitle }, 'Solar PV:'),
    React.createElement(View, { style: styles.infoBox },
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'Present:'),
        React.createElement(Text, { style: styles.infoValue }, 
          renewablesInfoData.solarPv?.present ? (renewablesInfoData.solarPv.present === 'yes' ? 'Yes' : 'No') : 'Not specified'
        )
      ),
      renewablesInfoData.solarPv?.manufacturer && React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'Manufacturer:'),
        React.createElement(Text, { style: styles.infoValue }, renewablesInfoData.solarPv.manufacturer)
      ),
      renewablesInfoData.solarPv?.area && React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'Area (m²):'),
        React.createElement(Text, { style: styles.infoValue }, `${renewablesInfoData.solarPv.area} m²`)
      ),
      renewablesInfoData.solarPv?.slope && React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'Slope (degrees):'),
        React.createElement(Text, { style: styles.infoValue }, `${renewablesInfoData.solarPv.slope}°`)
      ),
      renewablesInfoData.solarPv?.azimuth && React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'Azimuth (degrees):'),
        React.createElement(Text, { style: styles.infoValue }, `${renewablesInfoData.solarPv.azimuth}°`)
      )
    ),
    
    // Solar PV Module Type with checkboxes
    renewablesInfoData.solarPv?.moduleType && renewablesInfoData.solarPv.moduleType.length > 0 &&
    React.createElement(Text, { style: styles.infoBoxTitle }, 'Solar PV Module Type:'),
    renewablesInfoData.solarPv?.moduleType && renewablesInfoData.solarPv.moduleType.length > 0 &&
    React.createElement(View, { style: styles.checklistContainer },
      ...solarPvModuleTypeOptions.map(option => {
        return React.createElement(View, { key: option.key, style: styles.checklistItem },
          React.createElement(View, { 
            style: [
              styles.checkbox, 
              option.selected ? styles.checkboxChecked : styles.checkboxUnchecked
            ] 
          },
            React.createElement(Text, { style: { fontSize: 8, color: option.selected ? 'white' : 'transparent' } }, "✓")
          ),
          React.createElement(Text, { style: styles.checklistLabel }, option.label)
        );
      })
    ),
    
    // Solar DHW section
    (renewablesInfoData.solarDhw?.manufacturer || renewablesInfoData.solarDhw?.model || renewablesInfoData.solarDhw?.csaF379Rating || renewablesInfoData.solarDhw?.slope || renewablesInfoData.solarDhw?.azimuth) &&
    React.createElement(Text, { style: styles.infoBoxTitle }, 'Solar DHW:'),
    (renewablesInfoData.solarDhw?.manufacturer || renewablesInfoData.solarDhw?.model || renewablesInfoData.solarDhw?.csaF379Rating || renewablesInfoData.solarDhw?.slope || renewablesInfoData.solarDhw?.azimuth) &&
    React.createElement(View, { style: styles.infoBox },
      renewablesInfoData.solarDhw?.manufacturer && React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'Manufacturer:'),
        React.createElement(Text, { style: styles.infoValue }, renewablesInfoData.solarDhw.manufacturer)
      ),
      renewablesInfoData.solarDhw?.model && React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'Model:'),
        React.createElement(Text, { style: styles.infoValue }, renewablesInfoData.solarDhw.model)
      ),
      renewablesInfoData.solarDhw?.csaF379Rating && React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'CSA F379 Rating:'),
        React.createElement(Text, { style: styles.infoValue }, renewablesInfoData.solarDhw.csaF379Rating)
      ),
      renewablesInfoData.solarDhw?.slope && React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'Slope (degrees):'),
        React.createElement(Text, { style: styles.infoValue }, `${renewablesInfoData.solarDhw.slope}°`)
      ),
      renewablesInfoData.solarDhw?.azimuth && React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'Azimuth (degrees):'),
        React.createElement(Text, { style: styles.infoValue }, `${renewablesInfoData.solarDhw.azimuth}°`)
      )
    ),
    
    // Blower Door Test section
    React.createElement(Text, { style: styles.subsectionHeader }, 'Blower Door Test'),
    
    // Areas of Leakage with checkboxes
    React.createElement(Text, { style: styles.infoBoxTitle }, 'Areas of Leakage:'),
    React.createElement(View, { style: styles.checklistContainer },
      ...areasOfLeakageOptions.map(option => {
        return React.createElement(View, { key: option.key, style: styles.checklistItem },
          React.createElement(View, { 
            style: [
              styles.checkbox, 
              option.selected ? styles.checkboxChecked : styles.checkboxUnchecked
            ] 
          },
            React.createElement(Text, { style: { fontSize: 8, color: option.selected ? 'white' : 'transparent' } }, "✓")
          ),
          React.createElement(Text, { style: styles.checklistLabel }, option.label)
        );
      })
    ),
    
    // Window Component and Other sections
    React.createElement(View, { style: styles.infoBox },
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'Window Component:'),
        React.createElement(Text, { style: styles.infoValue }, blowerDoorTestData.windowComponent || 'Not specified')
      ),
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'Other:'),
        React.createElement(Text, { style: styles.infoValue }, blowerDoorTestData.other || 'Not specified')
      )
    ),
    
    // Depressurization Test & Completion section
    React.createElement(Text, { style: styles.subsectionHeader }, 'Depressurization Test & Completion'),
    React.createElement(View, { style: styles.infoBox },
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'Is there leakage from window component?'),
        React.createElement(Text, { style: styles.infoValue }, 
          depressurizationTestData.depressurizationTest?.windowLeakage || 'Not specified'
        )
      ),
      React.createElement(View, { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, 'Is there leakage from other areas?'),
        React.createElement(Text, { style: styles.infoValue }, 
          depressurizationTestData.depressurizationTest?.otherLeakage || 'Not specified'
        )
      )
    )
  ].filter(Boolean);

  const houseInfoPage = React.createElement(Page, { size: "A4", style: styles.page }, ...houseInfoElements);
  pages.push(houseInfoPage);

  return React.createElement(Document, {}, ...pages);
}

export async function generateStreamlinedAuditPDF(audit: Audit, photos: AuditPhoto[]) {
  try {
    console.log('Generating streamlined PDF with audit date:', audit.auditDate);
    
    // Convert photos to base64
    const photoData: Array<{ photo: AuditPhoto; base64: string | null }> = [];
    
    if (photos.length > 0) {
      console.log(`Converting ${photos.length} photos to base64...`);
      for (const photo of photos) {
        console.log(`Converting photo: ${photo.id} (${photo.category})`);
        const base64 = await convertImageToBase64(photo.id);
        photoData.push({ photo, base64 });
        console.log(`Photo ${photo.id} converted:`, base64 ? 'SUCCESS' : 'FAILED');
      }
    }

    // Create PDF document
    const doc = createStreamlinedPDF(audit, photoData);
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