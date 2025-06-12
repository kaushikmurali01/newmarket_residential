import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Audit, AuditPhoto } from '@shared/schema';

export interface PDFExportOptions {
  includePhotos?: boolean;
  photoQuality?: number;
  maxPhotoWidth?: number;
  maxPhotoHeight?: number;
  scaleFactor?: number;
}

export async function generateAuditPDF(
  audit: Audit,
  photos: AuditPhoto[],
  options: PDFExportOptions = {}
) {
  const {
    includePhotos = true,
    photoQuality = 1.0,
    maxPhotoWidth = 170,
    maxPhotoHeight = 130,
    scaleFactor = 8
  } = options;

  try {
    const pdf = new jsPDF();
    
    // Helper functions
    const addText = (text: string, x: number, y: number) => {
      pdf.text(text, x, y);
      return y;
    };

    const addKeyValue = (key: string, value: string, x: number, y: number, keyWidth: number = 30) => {
      pdf.setFont(undefined, 'bold');
      pdf.text(`${key}:`, x, y);
      pdf.setFont(undefined, 'normal');
      pdf.text(value, x + keyWidth, y);
      return y;
    };

    const addSectionHeader = (title: string, x: number, y: number) => {
      pdf.setFillColor(0, 51, 102);
      pdf.rect(x - 2, y - 8, 174, 12, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      pdf.text(title, x, y);
      pdf.setTextColor(0, 0, 0);
      return y + 5;
    };

    const checkNewPage = (currentY: number, requiredSpace: number) => {
      if (currentY + requiredSpace > 280) {
        pdf.addPage();
        return 20;
      }
      return currentY;
    };
    
    let yPosition = 30;
    
    // Professional Report Cover Page
    pdf.setFillColor(0, 51, 102);
    pdf.rect(20, 20, 170, 40, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(28);
    pdf.setFont(undefined, 'bold');
    addText('ENERVA', 30, 45);
    
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'normal');
    addText('Energy Solutions Inc.', 30, 52);
    
    pdf.setTextColor(0, 0, 0);
    yPosition = 80;
    
    // Report Title
    pdf.setFontSize(32);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(0, 51, 102);
    yPosition = addText('ENERGY AUDIT REPORT', 20, yPosition);
    
    // Subtitle
    pdf.setFontSize(16);
    pdf.setTextColor(100, 100, 100);
    pdf.setFont(undefined, 'normal');
    const auditTypeLabel = audit.auditType === 'before_upgrade' ? 'Pre-Retrofit Assessment' :
                          audit.auditType === 'after_upgrade' ? 'Post-Retrofit Verification' :
                          'Residential Energy Assessment';
    yPosition = addText(auditTypeLabel, 20, yPosition + 8);
    
    pdf.setTextColor(0, 0, 0);
    yPosition += 30;
    
    // Report Information Box
    pdf.setDrawColor(200, 200, 200);
    pdf.setFillColor(250, 250, 250);
    pdf.rect(20, yPosition, 170, 45, 'FD');
    
    yPosition += 10;
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'bold');
    addText('Report Details', 25, yPosition);
    
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    yPosition += 8;
    yPosition = addKeyValue('Audit ID', audit.id || 'Not specified', 25, yPosition, 40);
    yPosition = addKeyValue('Report Date', new Date().toLocaleDateString('en-CA'), 25, yPosition + 3, 40);
    yPosition = addKeyValue('Audit Date', (audit.auditDate ? new Date(audit.auditDate).toLocaleDateString('en-CA') : 'Not specified'), 25, yPosition + 3, 40);
    
    yPosition += 25;
    
    // Customer Information Box
    pdf.setDrawColor(200, 200, 200);
    pdf.setFillColor(245, 248, 252);
    pdf.rect(20, yPosition, 170, 65, 'FD');
    
    yPosition += 10;
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'bold');
    addText('Customer Information', 25, yPosition);
    
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    yPosition += 8;
    
    const customerName = `${audit.customerFirstName || ''} ${audit.customerLastName || ''}`.trim();
    yPosition = addKeyValue('Name', customerName || 'Not provided', 25, yPosition, 35);
    yPosition = addKeyValue('Email', audit.customerEmail || 'Not provided', 25, yPosition + 3, 35);
    yPosition = addKeyValue('Phone', audit.customerPhone || 'Not provided', 25, yPosition + 3, 35);
    yPosition = addKeyValue('Address', audit.customerAddress || 'Not provided', 25, yPosition + 3, 35);
    
    const cityInfo = [audit.customerCity, audit.customerProvince, audit.customerPostalCode]
      .filter(Boolean).join(', ') || 'Not provided';
    yPosition = addKeyValue('Location', cityInfo, 25, yPosition + 3, 35);
    
    yPosition += 20;
    
    // Property Details Box
    pdf.setDrawColor(200, 200, 200);
    pdf.setFillColor(248, 252, 245);
    pdf.rect(20, yPosition, 170, 35, 'FD');
    
    yPosition += 10;
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'bold');
    addText('Property Details', 25, yPosition);
    
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    yPosition += 8;
    
    const homeTypeLabel = audit.homeType === 'single_detached' ? 'Single Detached' :
                         audit.homeType === 'attached' ? 'Attached' :
                         audit.homeType === 'row_end' ? 'Row End Unit' :
                         audit.homeType === 'row_mid' ? 'Row Mid Unit' :
                         audit.homeType || 'Not specified';
    
    yPosition = addKeyValue('Home Type', homeTypeLabel, 25, yPosition, 35);
    yPosition = addKeyValue('Audit Type', auditTypeLabel, 25, yPosition + 3, 35);
    
    // Add new page for detailed audit data
    pdf.addPage();
    yPosition = 20;
    
    // Helper functions for two-column layout
    const leftColumnX = 20;
    const rightColumnX = 105;
    
    const addTwoColumnSection = (leftTitle: string, leftItems: Array<{label: string, value: string}>, 
                                rightTitle: string, rightItems: Array<{label: string, value: string}>, 
                                startY: number) => {
      let leftY = startY;
      let rightY = startY;
      
      // Left column
      if (leftTitle) {
        leftY = addSectionHeader(leftTitle, leftColumnX, leftY);
        leftItems.forEach(item => {
          leftY += 5; // Increased spacing between items
          leftY = addKeyValue(item.label, item.value, leftColumnX, leftY, 20); // Reduced key width for better fit
        });
      }
      
      // Right column
      if (rightTitle) {
        rightY = addSectionHeader(rightTitle, rightColumnX, rightY);
        rightItems.forEach(item => {
          rightY += 5; // Increased spacing between items
          rightY = addKeyValue(item.label, item.value, rightColumnX, rightY, 20); // Reduced key width for better fit
        });
      }
      
      return Math.max(leftY, rightY) + 15; // Increased bottom margin
    };
    
    // House Information - Two Column Layout
    yPosition = checkNewPage(yPosition, 60);
    
    const houseData = audit.houseInfo || {};
    const foundationData = audit.foundationInfo || {};
    
    yPosition = addTwoColumnSection(
      'House Information',
      [
        { label: 'House Type', value: (houseData as any).houseType || 'Not specified' },
        { label: 'Year Built', value: (houseData as any).yearBuilt || 'Not specified' },
        { label: 'Height', value: (houseData as any).aboveGradeHeight ? `${(houseData as any).aboveGradeHeight} ${(houseData as any).aboveGradeHeightUnit || 'm'}` : 'Not specified' },
        { label: 'Orientation', value: (houseData as any).frontOrientation || 'Not specified' },
      ],
      'Foundation Information',
      [
        { label: 'Type', value: Array.isArray((foundationData as any).foundationType) ? (foundationData as any).foundationType.join(', ') : (foundationData as any).foundationType || 'Not specified' },
        { label: 'Wall Height', value: (foundationData as any).wallHeight ? `${(foundationData as any).wallHeight} ${(foundationData as any).wallHeightUnit || 'm'}` : 'Not specified' },
        { label: 'Walls', value: (foundationData as any).walls || 'Not specified' },
        { label: 'Insulation', value: (foundationData as any).insulation || 'Not specified' },
      ],
      yPosition
    );
    
    // Walls and Ceiling Information - Two Column Layout
    const wallsData = audit.wallsInfo || {};
    const ceilingData = audit.ceilingInfo || {};
    
    yPosition = addTwoColumnSection(
      'Walls Information',
      [
        { label: 'Wall Framing', value: (wallsData as any).wallFraming || 'Not specified' },
        { label: 'Centers', value: (wallsData as any).centres || 'Not specified' },
        { label: 'Cavity Insulation', value: Array.isArray((wallsData as any).cavityInsulation) ? (wallsData as any).cavityInsulation.join(', ') : (wallsData as any).cavityInsulation || 'Not specified' },
        { label: 'Exterior Finish', value: (wallsData as any).exteriorFinish || 'Not specified' },
      ],
      'Ceiling Information',
      [
        { label: 'Attic Framing', value: (ceilingData as any).atticFraming || 'Not specified' },
        { label: 'Insulation Type', value: Array.isArray((ceilingData as any).atticInsulationType) ? (ceilingData as any).atticInsulationType.join(', ') : (ceilingData as any).atticInsulationType || 'Not specified' },
        { label: 'Insulation Thickness', value: (ceilingData as any).atticInsulationThickness || 'Not specified' },
        { label: 'Ceiling Type', value: (ceilingData as any).ceilingType || 'Not specified' },
      ],
      yPosition
    );
    
    // Windows and Doors Information - Two Column Layout
    const windowsData = audit.windowsInfo || {};
    const doorsData = audit.doorsInfo || {};
    
    yPosition = addTwoColumnSection(
      'Windows Information',
      [
        { label: 'Frame Material', value: (windowsData as any).frame || 'Not specified' },
        { label: 'Low-E Coating', value: (windowsData as any).lowECoating || 'Not specified' },
        { label: 'Gas Fill', value: (windowsData as any).gasFill || 'Not specified' },
        { label: 'Glazing', value: (windowsData as any).glazing || 'Not specified' },
      ],
      'Doors Information',
      [
        { label: 'Skin Material', value: (doorsData as any).skin || 'Not specified' },
        { label: 'Insulation', value: (doorsData as any).insulation || 'Not specified' },
      ],
      yPosition
    );
    
    // Heating and DHW Systems - Two Column Layout
    const heatingData = audit.heatingInfo || {};
    const dhwData = audit.domesticHotWaterInfo || {};
    
    yPosition = addTwoColumnSection(
      'Heating System',
      [
        { label: 'System Type', value: Array.isArray((heatingData as any).heatingSystemType) ? (heatingData as any).heatingSystemType.join(', ') : (heatingData as any).heatingSystemType || 'Not specified' },
        { label: 'Fuel Source', value: (heatingData as any).source || 'Not specified' },
        { label: 'Manufacturer', value: (heatingData as any).manufacturer || 'Not specified' },
        { label: 'Model', value: (heatingData as any).model || 'Not specified' },
      ],
      'Domestic Hot Water',
      [
        { label: 'System Type', value: (dhwData as any).domesticHotWaterType || 'Not specified' },
        { label: 'Fuel Type', value: (dhwData as any).fuel || 'Not specified' },
        { label: 'Manufacturer', value: (dhwData as any).manufacturer || 'Not specified' },
        { label: 'Tank Volume', value: (dhwData as any).tankVolume || 'Not specified' },
      ],
      yPosition
    );
    
    // Ventilation and Renewables - Two Column Layout
    const ventData = audit.ventilationInfo || {};
    const renewablesData = audit.renewablesInfo || {};
    
    yPosition = addTwoColumnSection(
      'Ventilation System',
      [
        { label: 'Ventilation Type', value: (ventData as any).ventilationType || 'Not specified' },
        { label: 'HRV Manufacturer', value: (ventData as any).hrvManufacturer || 'Not specified' },
        { label: 'HRV Model', value: (ventData as any).hrvModel || 'Not specified' },
        { label: 'HVI Certified', value: (ventData as any).hviCertified || 'Not specified' },
      ],
      'Renewable Systems',
      [
        { label: 'Solar PV Present', value: (renewablesData as any).solarPv?.present || 'Not specified' },
        { label: 'Solar DHW', value: (renewablesData as any).solarDhw?.manufacturer || 'Not specified' },
      ],
      yPosition
    );
    
    // Test Results Section
    if (audit.blowerDoorTest || audit.depressurizationTest) {
      yPosition = checkNewPage(yPosition, 60);
      
      yPosition = addSectionHeader('Test Results', 20, yPosition);
      yPosition += 10; // Add space after section header
      
      // Blower Door Test
      if (audit.blowerDoorTest) {
        pdf.setFontSize(12);
        pdf.setFont(undefined, 'bold');
        yPosition = addText('Blower Door Test', 25, yPosition);
        yPosition += 5;
        
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        
        if ((audit.blowerDoorTest as any).areasOfLeakage) {
          yPosition = addText('Areas of Leakage:', 30, yPosition);
          yPosition += 3;
          Object.entries((audit.blowerDoorTest as any).areasOfLeakage).forEach(([key, value]) => {
            if (value) {
              const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              yPosition = addText(`  • ${label}`, 35, yPosition);
              yPosition += 3;
            }
          });
        }
        
        if ((audit.blowerDoorTest as any).other) {
          yPosition = addText(`Other: ${(audit.blowerDoorTest as any).other}`, 30, yPosition);
          yPosition += 8;
        }
      }
      
      // Depressurization Test
      if (audit.depressurizationTest) {
        yPosition = checkNewPage(yPosition, 30);
        
        pdf.setFontSize(12);
        pdf.setFont(undefined, 'bold');
        yPosition = addText('Depressurization Test', 25, yPosition);
        yPosition += 5;
        
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        yPosition = addText(`Window Leakage: ${(audit.depressurizationTest as any).windowLeakage || 'Not specified'}`, 30, yPosition);
        yPosition += 4;
        yPosition = addText(`Other Leakage: ${(audit.depressurizationTest as any).otherLeakage || 'Not specified'}`, 30, yPosition);
        yPosition += 10;
      }
    }
    
    // Photos Section
    if (includePhotos && photos.length > 0) {
      yPosition = checkNewPage(yPosition, 60);
      
      yPosition = addSectionHeader('Audit Photos', 20, yPosition);
      
      for (const photo of photos) {
        yPosition = checkNewPage(yPosition, maxPhotoHeight + 30);
        
        try {
          // Fetch image with authentication
          const response = await fetch(`/api/photos/${photo.id}`, {
            credentials: 'include',
            headers: {
              'Accept': 'image/*'
            }
          });
          
          if (!response.ok) {
            throw new Error(`Failed to fetch photo: ${response.status}`);
          }
          
          const blob = await response.blob();
          const imageUrl = URL.createObjectURL(blob);
          
          // Create high-resolution image element
          const img = new Image();
          
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = imageUrl;
          });
          
          // Create high-resolution canvas
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          const targetWidth = maxPhotoWidth * scaleFactor;
          const targetHeight = maxPhotoHeight * scaleFactor;
          
          // Calculate aspect ratio scaling
          const aspectRatio = img.width / img.height;
          let canvasWidth = targetWidth;
          let canvasHeight = targetHeight;
          
          if (aspectRatio > (maxPhotoWidth / maxPhotoHeight)) {
            canvasHeight = canvasWidth / aspectRatio;
          } else {
            canvasWidth = canvasHeight * aspectRatio;
          }
          
          canvas.width = canvasWidth;
          canvas.height = canvasHeight;
          
          if (ctx) {
            // High-quality rendering
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
            
            // Convert to high-quality PNG
            const imageData = canvas.toDataURL('image/png', 1.0);
            
            // Clean up blob URL
            URL.revokeObjectURL(imageUrl);
            
            // Add photo to PDF
            pdf.setFontSize(12);
            pdf.setFont(undefined, 'bold');
            yPosition += 10;
            yPosition = addText(`${photo.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Photo`, 20, yPosition);
            
            pdf.setFontSize(10);
            pdf.setFont(undefined, 'normal');
            yPosition += 5;
            yPosition = addText(`File: ${photo.originalName}`, 20, yPosition);
            
            // Add image with border
            const imgWidth = canvasWidth / scaleFactor;
            const imgHeight = canvasHeight / scaleFactor;
            
            yPosition += 5;
            pdf.setDrawColor(200, 200, 200);
            pdf.rect(20, yPosition, imgWidth + 4, imgHeight + 4);
            pdf.addImage(imageData, 'PNG', 22, yPosition + 2, imgWidth, imgHeight);
            
            yPosition += imgHeight + 20;
          }
        } catch (error) {
          console.error('Error processing photo:', error);
          pdf.setFontSize(10);
          pdf.setFont(undefined, 'italic');
          yPosition += 10;
          yPosition = addText(`Photo could not be loaded: ${photo.originalName}`, 20, yPosition);
          yPosition += 15;
        }
      }
    }
    
    // Generate and download PDF
    const filename = `ENERVA_Audit_Report_${audit.id || 'unknown'}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(filename);
    
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error('Failed to generate PDF report');
  }
}