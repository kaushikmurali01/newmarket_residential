import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { insertAuditSchema, insertPhotoSchema, createUserSchema, updatePasswordSchema, updateUserSchema } from "@shared/schema";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

function requireUserManagement(req: any, res: any, next: any) {
  if (!req.user || (!req.user.canManageUsers && req.user.role !== 'admin')) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }
  next();
}
import multer from "multer";
import path from "path";
import { z } from "zod";
// Removed html-pdf-node import - using client-side PDF generation instead
import fs from "fs";

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

export function registerRoutes(app: Express): Server {
  // Auth middleware
  setupAuth(app);

  // Initialization route - only works if no admin users exist
  app.post("/api/initialize", async (req, res) => {
    try {
      // Check if any admin users already exist
      const existingAdmins = await storage.getAllUsers();
      const hasAdmin = existingAdmins.some(user => user.role === 'admin');
      
      if (hasAdmin) {
        return res.status(400).json({ 
          message: "System already initialized. Admin user already exists." 
        });
      }

      const { username, email, password } = req.body;
      
      if (!username || !email || !password) {
        return res.status(400).json({ 
          message: "Username, email, and password are required" 
        });
      }

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Create the initial admin user
      const hashedPassword = await hashPassword(password);
      const adminUser = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        role: 'admin',
        canManageUsers: true,
        isActive: true
      });

      // Remove password from response
      const { password: _, ...userResponse } = adminUser;
      
      res.status(201).json({ 
        message: "System initialized successfully", 
        user: userResponse 
      });
    } catch (error) {
      console.error("Error initializing system:", error);
      res.status(500).json({ message: "Failed to initialize system" });
    }
  });

  // Serve uploaded files statically
  app.use("/uploads", express.static("uploads"));

  // Audit routes
  app.post("/api/audits", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const requestData = { ...req.body, userId };
      
      // Convert auditDate string to Date object if provided
      if (requestData.auditDate && typeof requestData.auditDate === 'string') {
        requestData.auditDate = new Date(requestData.auditDate);
      }
      
      const auditData = insertAuditSchema.parse(requestData);
      const audit = await storage.createAudit(auditData);
      res.json(audit);
    } catch (error) {
      console.error("Error creating audit:", error);
      res.status(400).json({ message: "Failed to create audit" });
    }
  });

  app.put("/api/audits/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      // Allow all users to update any audit for internal tool usage
      const existingAudit = await storage.getAudit(id);
      if (!existingAudit) {
        return res.status(404).json({ message: "Audit not found" });
      }

      const requestData = { ...req.body };
      
      // Convert auditDate string to Date object if provided
      if (requestData.auditDate && typeof requestData.auditDate === 'string') {
        requestData.auditDate = new Date(requestData.auditDate);
      }
      
      // Remove auditDate if it's an empty string to avoid validation errors
      if (requestData.auditDate === '' || requestData.auditDate === null) {
        delete requestData.auditDate;
      }

      const auditData = insertAuditSchema.partial().parse(requestData);
      const audit = await storage.updateAudit(id, auditData);
      res.json(audit);
    } catch (error) {
      console.error("Error updating audit:", error);
      res.status(400).json({ message: "Failed to update audit" });
    }
  });

  app.get("/api/audits", isAuthenticated, async (req: any, res) => {
    try {
      const { search, status } = req.query;
      
      // Allow all users to see all audits for internal tool usage
      const audits = await storage.searchAudits(null, search as string, status as string);
      res.json(audits);
    } catch (error) {
      console.error("Error fetching audits:", error);
      res.status(500).json({ message: "Failed to fetch audits" });
    }
  });

  app.get("/api/audits/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      // Allow all users to view any audit for internal tool usage
      const audit = await storage.getAudit(id);
      if (!audit) {
        return res.status(404).json({ message: "Audit not found" });
      }

      res.json(audit);
    } catch (error) {
      console.error("Error fetching audit:", error);
      res.status(500).json({ message: "Failed to fetch audit" });
    }
  });

  app.delete("/api/audits/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      // Verify audit belongs to user
      const existingAudit = await storage.getAudit(id);
      if (!existingAudit || existingAudit.userId !== userId) {
        return res.status(404).json({ message: "Audit not found" });
      }

      await storage.deleteAudit(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting audit:", error);
      res.status(500).json({ message: "Failed to delete audit" });
    }
  });

  // Photo upload routes
  app.post("/api/audits/:auditId/photos", isAuthenticated, upload.single("photo"), async (req: any, res) => {
    try {
      const { auditId } = req.params;
      const { category } = req.body;

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Allow all users to upload photos to any audit for internal tool usage
      const audit = await storage.getAudit(auditId);
      if (!audit) {
        return res.status(404).json({ message: "Audit not found" });
      }

      const photoData = {
        auditId,
        category,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
      };

      const photo = await storage.addPhoto(photoData);
      res.json(photo);
    } catch (error) {
      console.error("Error uploading photo:", error);
      res.status(500).json({ message: "Failed to upload photo" });
    }
  });

  app.get("/api/audits/:auditId/photos", isAuthenticated, async (req: any, res) => {
    try {
      const { auditId } = req.params;
      const { category } = req.query;

      // Allow all users to view photos from any audit for internal tool usage
      const audit = await storage.getAudit(auditId);
      if (!audit) {
        return res.status(404).json({ message: "Audit not found" });
      }

      const photos = category 
        ? await storage.getPhotosByCategory(auditId, category as string)
        : await storage.getPhotosByAudit(auditId);
      
      res.json(photos);
    } catch (error) {
      console.error("Error fetching photos:", error);
      res.status(500).json({ message: "Failed to fetch photos" });
    }
  });

  // Photo serving route
  app.get("/api/photos/:photoId", isAuthenticated, async (req: any, res) => {
    try {
      const { photoId } = req.params;

      // Allow all users to view any photo for internal tool usage
      // Find photo across all audits
      const allAudits = await storage.searchAudits(null);
      let photo = null;
      
      for (const audit of allAudits) {
        const auditPhotos = await storage.getPhotosByAudit(audit.id);
        photo = auditPhotos.find(p => p.id === photoId);
        if (photo) break;
      }
      
      if (!photo) {
        return res.status(404).json({ message: "Photo not found" });
      }

      // Serve the actual image file
      const filePath = path.join(process.cwd(), 'uploads', photo.filename);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "Photo file not found" });
      }

      // Set proper content type based on file extension
      const ext = path.extname(photo.filename).toLowerCase();
      const contentType = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
                         ext === '.png' ? 'image/png' :
                         ext === '.gif' ? 'image/gif' :
                         ext === '.webp' ? 'image/webp' : 'image/jpeg';

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `inline; filename="${photo.originalName}"`);
      
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
      
    } catch (error) {
      console.error("Error serving photo:", error);
      res.status(500).json({ message: "Failed to serve photo" });
    }
  });

  // Photo delete route
  app.delete("/api/photos/:photoId", isAuthenticated, async (req: any, res) => {
    try {
      const { photoId } = req.params;
      const userId = req.user.id;

      // First check if photo exists by trying to get all photos and finding this one
      // Since we don't have a direct getPhoto method, we'll get all photos for all audits by this user
      const userAudits = await storage.getAuditsByUser(userId);
      let photo = null;
      
      for (const audit of userAudits) {
        const auditPhotos = await storage.getPhotosByAudit(audit.id);
        photo = auditPhotos.find(p => p.id === photoId);
        if (photo) break;
      }
      
      if (!photo) {
        return res.status(404).json({ message: "Photo not found" });
      }

      await storage.deletePhoto(photoId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting photo:", error);
      res.status(500).json({ message: "Failed to delete photo" });
    }
  });

  // Export routes
  app.get("/api/audits/:id/export/pdf", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Verify audit belongs to user
      const audit = await storage.getAudit(id);
      if (!audit || audit.userId !== userId) {
        return res.status(404).json({ message: "Audit not found" });
      }

      // Get photos for the audit organized by category
      const allPhotos = await storage.getPhotosByAudit(id);
      const photosByCategory = allPhotos.reduce((acc, photo) => {
        if (!acc[photo.category]) acc[photo.category] = [];
        acc[photo.category].push(photo);
        return acc;
      }, {} as Record<string, any[]>);

      const formatValue = (value: any) => {
        if (value === null || value === undefined || value === '') return 'Not specified';
        if (typeof value === 'object') {
          try {
            return JSON.stringify(value, null, 2);
          } catch {
            return 'Not specified';
          }
        }
        return String(value);
      };
      
      const getNestedValue = (obj: any, path: string) => {
        try {
          return path.split('.').reduce((current, key) => current?.[key], obj) || 'Not specified';
        } catch {
          return 'Not specified';
        }
      };

      // Generate comprehensive HTML for PDF conversion
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Energy Audit Report - ${formatValue(audit.customerFirstName)} ${formatValue(audit.customerLastName)}</title>
            <style>
              @page {
                margin: 0.5in;
                size: A4;
              }
              * { box-sizing: border-box; }
              body { 
                font-family: Arial, sans-serif; 
                line-height: 1.4; 
                color: #333;
                margin: 0;
                padding: 0;
              }
              .header { 
                text-align: center; 
                border-bottom: 3px solid #0066cc; 
                padding-bottom: 20px; 
                margin-bottom: 30px; 
              }
              .header h1 { 
                color: #0066cc; 
                margin: 0 0 10px 0; 
                font-size: 28px;
              }
              .section { 
                margin-bottom: 25px; 
                page-break-inside: avoid; 
              }
              .section-title { 
                color: #0066cc; 
                border-bottom: 2px solid #e5e7eb; 
                padding-bottom: 8px; 
                margin-top: 0;
                font-size: 18px;
                font-weight: bold;
              }
              .field {
                margin-bottom: 8px;
                display: flex;
                align-items: flex-start;
              }
              .label { 
                font-weight: bold; 
                color: #374151; 
                min-width: 180px;
                margin-right: 10px;
              }
              .value {
                color: #1f2937;
                flex: 1;
              }
              .photo-section { 
                margin-top: 30px;
                page-break-before: auto;
              }
              .photo-category {
                margin-bottom: 30px;
                page-break-inside: avoid;
              }
              .photo-title { 
                color: #0066cc; 
                margin-bottom: 15px;
                font-size: 16px;
                font-weight: bold;
                text-transform: capitalize;
                border-bottom: 1px solid #e5e7eb;
                padding-bottom: 5px;
              }
              .photo-grid { 
                display: grid; 
                grid-template-columns: repeat(2, 1fr); 
                gap: 20px; 
                margin-top: 15px; 
              }
              .photo-item { 
                text-align: center; 
                border: 1px solid #e5e7eb;
                padding: 10px;
                border-radius: 8px;
                page-break-inside: avoid;
              }
              .photo-item img { 
                max-width: 100%; 
                height: auto; 
                max-height: 300px;
                border-radius: 4px;
                object-fit: contain;
              }
              .photo-caption {
                margin-top: 8px;
                font-size: 12px;
                color: #6b7280;
                font-weight: bold;
              }
              .test-results { 
                background: #eff6ff; 
                padding: 20px; 
                border-radius: 8px; 
                border-left: 6px solid #0066cc; 
                margin-top: 15px;
              }
              .footer { 
                margin-top: 40px; 
                text-align: center; 
                border-top: 2px solid #e5e7eb; 
                padding-top: 20px;
                page-break-before: auto;
              }
              .no-photos {
                text-align: center;
                color: #6b7280;
                font-style: italic;
                padding: 20px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>ENERVA Energy Audit Report</h1>
              <p><strong>Audit ID:</strong> ${audit.id}</p>
              <p><strong>Report Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>

            <div class="section">
              <div class="section-title">Customer Information</div>
              <div class="field">
                <span class="label">Customer Name:</span>
                <span class="value">${formatValue(audit.customerFirstName)} ${formatValue(audit.customerLastName)}</span>
              </div>
              <div class="field">
                <span class="label">Email:</span>
                <span class="value">${formatValue(audit.customerEmail)}</span>
              </div>
              <div class="field">
                <span class="label">Phone:</span>
                <span class="value">${formatValue(audit.customerPhone)}</span>
              </div>
              <div class="field">
                <span class="label">Address:</span>
                <span class="value">${formatValue(audit.customerAddress)}</span>
              </div>
              <div class="field">
                <span class="label">City:</span>
                <span class="value">${formatValue(audit.customerCity)}, ${formatValue(audit.customerProvince)} ${formatValue(audit.customerPostalCode)}</span>
              </div>
              <div class="field">
                <span class="label">Home Type:</span>
                <span class="value">${formatValue(audit.homeType)}</span>
              </div>
              <div class="field">
                <span class="label">Audit Type:</span>
                <span class="value">${formatValue(audit.auditType)}</span>
              </div>
              <div class="field">
                <span class="label">Audit Date:</span>
                <span class="value">${formatValue(audit.auditDate)}</span>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Property Information</div>
              <div class="field">
                <span class="label">House Type:</span>
                <span class="value">${getNestedValue(audit, 'houseInfo.houseType')}</span>
              </div>
              <div class="field">
                <span class="label">Year Built:</span>
                <span class="value">${getNestedValue(audit, 'houseInfo.yearBuilt')}</span>
              </div>
              <div class="field">
                <span class="label">Front Orientation:</span>
                <span class="value">${getNestedValue(audit, 'houseInfo.frontOrientation')}</span>
              </div>
              <div class="field">
                <span class="label">Above Grade Height:</span>
                <span class="value">${getNestedValue(audit, 'houseInfo.aboveGradeHeight')} ${getNestedValue(audit, 'houseInfo.aboveGradeHeightUnit')}</span>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Foundation Information</div>
              <div class="field">
                <span class="label">Foundation Type:</span>
                <span class="value">${getNestedValue(audit, 'foundationInfo.foundationType')}</span>
              </div>
              <div class="field">
                <span class="label">Wall Height:</span>
                <span class="value">${getNestedValue(audit, 'foundationInfo.wallHeight')} ${getNestedValue(audit, 'foundationInfo.wallHeightUnit')}</span>
              </div>
              <div class="field">
                <span class="label">Walls:</span>
                <span class="value">${getNestedValue(audit, 'foundationInfo.walls')}</span>
              </div>
              <div class="field">
                <span class="label">Insulation:</span>
                <span class="value">${getNestedValue(audit, 'foundationInfo.insulation')}</span>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Walls Information</div>
              <div class="field">
                <span class="label">Wall Framing:</span>
                <span class="value">${getNestedValue(audit, 'wallsInfo.wallFraming')}</span>
              </div>
              <div class="field">
                <span class="label">Centres:</span>
                <span class="value">${getNestedValue(audit, 'wallsInfo.centres')}</span>
              </div>
              <div class="field">
                <span class="label">Cavity Insulation:</span>
                <span class="value">${getNestedValue(audit, 'wallsInfo.cavityInsulation')}</span>
              </div>
              <div class="field">
                <span class="label">Exterior Finish:</span>
                <span class="value">${getNestedValue(audit, 'wallsInfo.exteriorFinish')}</span>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Heating System</div>
              <div class="field">
                <span class="label">System Type:</span>
                <span class="value">${getNestedValue(audit, 'heatingInfo.heatingSystemType')}</span>
              </div>
              <div class="field">
                <span class="label">Source:</span>
                <span class="value">${getNestedValue(audit, 'heatingInfo.source')}</span>
              </div>
              <div class="field">
                <span class="label">Manufacturer:</span>
                <span class="value">${getNestedValue(audit, 'heatingInfo.manufacturer')}</span>
              </div>
              <div class="field">
                <span class="label">Model:</span>
                <span class="value">${getNestedValue(audit, 'heatingInfo.model')}</span>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Ventilation System</div>
              <div class="field">
                <span class="label">Ventilation Type:</span>
                <span class="value">${getNestedValue(audit, 'ventilationInfo.ventilationType')}</span>
              </div>
              <div class="field">
                <span class="label">HRV Manufacturer:</span>
                <span class="value">${getNestedValue(audit, 'ventilationInfo.hrvManufacturer')}</span>
              </div>
              <div class="field">
                <span class="label">HRV Model:</span>
                <span class="value">${getNestedValue(audit, 'ventilationInfo.hrvModel')}</span>
              </div>
              <div class="field">
                <span class="label">HVI Certified:</span>
                <span class="value">${getNestedValue(audit, 'ventilationInfo.hviCertified')}</span>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Domestic Hot Water</div>
              <div class="field">
                <span class="label">DHW Type:</span>
                <span class="value">${getNestedValue(audit, 'domesticHotWaterInfo.domesticHotWaterType')}</span>
              </div>
              <div class="field">
                <span class="label">Fuel:</span>
                <span class="value">${getNestedValue(audit, 'domesticHotWaterInfo.fuel')}</span>
              </div>
              <div class="field">
                <span class="label">Tank Volume:</span>
                <span class="value">${getNestedValue(audit, 'domesticHotWaterInfo.tankVolume')}</span>
              </div>
              <div class="field">
                <span class="label">Efficiency Factor:</span>
                <span class="value">${getNestedValue(audit, 'domesticHotWaterInfo.efficiencyFactor')}</span>
              </div>
            </div>

            ${(() => {
              const windowLeakage = getNestedValue(audit, 'depressurizationTest.windowLeakage');
              const otherLeakage = getNestedValue(audit, 'depressurizationTest.otherLeakage');
              return (windowLeakage !== 'Not specified' || otherLeakage !== 'Not specified') ? `
            <div class="section">
              <div class="section-title">Depressurization Test Results</div>
              <div class="test-results">
                <div class="field">
                  <span class="label">Window Leakage:</span>
                  <span class="value">${windowLeakage}</span>
                </div>
                <div class="field">
                  <span class="label">Other Leakage:</span>
                  <span class="value">${otherLeakage}</span>
                </div>
              </div>
            </div>
            ` : '';
            })()}

            <div class="section">
              <div class="section-title">Audit Status</div>
              <div class="field">
                <span class="label">Status:</span>
                <span class="value">${formatValue(audit.status)}</span>
              </div>
              <div class="field">
                <span class="label">Completed:</span>
                <span class="value">${audit.status === 'completed' ? 'Yes' : 'No'}</span>
              </div>
            </div>

            ${Object.keys(photosByCategory).length > 0 ? `
            <div class="photo-section">
              <div class="section-title">Photographic Documentation</div>
              ${Object.entries(photosByCategory).map(([category, photos]) => `
                <div class="photo-category">
                  <div class="photo-title">${category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
                  <div class="photo-grid">
                    ${photos.map(photo => {
                      // Convert image to base64 for embedding
                      let imageData = '';
                      try {
                        const imagePath = path.resolve('uploads', photo.filename);
                        if (fs.existsSync(imagePath)) {
                          const imageBuffer = fs.readFileSync(imagePath);
                          const base64 = imageBuffer.toString('base64');
                          const mimeType = photo.filename.toLowerCase().includes('.png') ? 'image/png' : 'image/jpeg';
                          imageData = `data:${mimeType};base64,${base64}`;
                        }
                      } catch (err) {
                        console.error('Error reading image:', err);
                      }
                      return `
                      <div class="photo-item">
                        ${imageData ? `<img src="${imageData}" alt="${photo.originalName}" />` : `<div style="background: #f0f0f0; height: 200px; display: flex; align-items: center; justify-content: center; border: 1px solid #ccc;">Image not available</div>`}
                        <div class="photo-caption">${photo.originalName}</div>
                      </div>
                    `;
                    }).join('')}
                  </div>
                </div>
              `).join('')}
            </div>
            ` : `
            <div class="section">
              <div class="section-title">Photographic Documentation</div>
              <div class="no-photos">No photos uploaded for this audit.</div>
            </div>
            `}

            <div class="footer">
              <p><strong>Enerva Energy Solutions</strong></p>
              <p>Generated: ${new Date().toLocaleString()}</p>
              <p>Audit ID: ${audit.id}</p>
            </div>
          </body>
        </html>
      `;

      // For now, send HTML that can be saved as PDF by the browser
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename="audit-report-${audit.id}.html"`);
      res.send(html);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      res.status(500).json({ message: "Failed to export PDF" });
    }
  });

  app.get("/api/audits/:id/export/hot2000", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;

      // Allow all authenticated users to export HOT2000 files (internal tool)
      const audit = await storage.getAudit(id);
      if (!audit) {
        return res.status(404).json({ message: "Audit not found" });
      }

      // Generate HOT2000 file content
      const hot2000Content = generateHOT2000File(audit);
      
      res.setHeader("Content-Type", "application/octet-stream");
      res.setHeader("Content-Disposition", `attachment; filename="${audit.customerLastName || 'audit'}_${audit.id}.h2k"`);
      res.send(hot2000Content);
    } catch (error) {
      console.error("Error exporting HOT2000:", error);
      res.status(500).json({ message: "Failed to export HOT2000 file" });
    }
  });

  // User management routes
  app.get("/api/users", isAuthenticated, requireUserManagement, async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      // Remove sensitive information
      const safeUsers = users.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        canManageUsers: user.canManageUsers,
        isActive: user.isActive,
        createdBy: user.createdBy,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }));
      res.json(safeUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", isAuthenticated, requireUserManagement, async (req: any, res) => {
    try {
      const userData = createUserSchema.parse(req.body);
      const hashedPassword = await hashPassword(userData.password);
      
      const newUser = await storage.createManagedUser({
        ...userData,
        password: hashedPassword,
      }, req.user.id);

      // Return user without password
      const { password, ...safeUser } = newUser;
      res.json(safeUser);
    } catch (error: any) {
      console.error("Error creating user:", error);
      if (error.code === '23505') { // Unique constraint violation
        res.status(400).json({ message: "Username or email already exists" });
      } else {
        res.status(400).json({ message: "Failed to create user" });
      }
    }
  });

  app.put("/api/users/:id", isAuthenticated, requireUserManagement, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      const currentUser = req.user;
      
      // Prevent users from modifying admin or themselves
      if (userId === 1 || userId === currentUser.id) {
        return res.status(403).json({ message: "Cannot modify admin user or yourself" });
      }

      const updates = updateUserSchema.parse(req.body);
      const updatedUser = await storage.updateUser(userId, updates);
      
      // Return user without password
      const { password, ...safeUser } = updatedUser;
      res.json(safeUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(400).json({ message: "Failed to update user" });
    }
  });

  app.put("/api/users/:id/password", isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      const currentUser = req.user;
      const { currentPassword, newPassword } = updatePasswordSchema.parse(req.body);

      // Users can only change their own password, or admins/managers can change others'
      if (userId !== currentUser.id && !currentUser.canManageUsers && currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      // If changing own password, verify current password
      if (userId === currentUser.id && currentPassword) {
        const isValid = await comparePasswords(currentPassword, currentUser.password);
        if (!isValid) {
          return res.status(400).json({ message: "Current password is incorrect" });
        }
      }

      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUserPassword(userId, hashedPassword);
      
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Error updating password:", error);
      res.status(400).json({ message: "Failed to update password" });
    }
  });

  app.delete("/api/users/:id", isAuthenticated, requireUserManagement, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      const currentUser = req.user;
      
      // Prevent deletion of admin user or self
      if (userId === 1 || userId === currentUser.id) {
        return res.status(403).json({ message: "Cannot delete admin user or yourself" });
      }

      await storage.deleteUser(userId);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(400).json({ message: "Failed to delete user" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function generateHOT2000File(audit: any): string {
  // Parse JSON string fields if they exist
  let houseInfo, wallsInfo, windowsInfo, foundationInfo, heatingInfo, ventilationInfo, domesticHotWaterInfo, ceilingInfo, renewablesInfo, blowerDoorTest, depressurizationTest, doorsInfo, eligibilityCriteria, preAuditDiscussion, atypicalLoads;
  
  try {
    houseInfo = typeof audit.houseInfo === 'string' ? JSON.parse(audit.houseInfo) : audit.houseInfo || {};
    wallsInfo = typeof audit.wallsInfo === 'string' ? JSON.parse(audit.wallsInfo) : audit.wallsInfo || {};
    windowsInfo = typeof audit.windowsInfo === 'string' ? JSON.parse(audit.windowsInfo) : audit.windowsInfo || {};
    foundationInfo = typeof audit.foundationInfo === 'string' ? JSON.parse(audit.foundationInfo) : audit.foundationInfo || {};
    heatingInfo = typeof audit.heatingInfo === 'string' ? JSON.parse(audit.heatingInfo) : audit.heatingInfo || {};
    ventilationInfo = typeof audit.ventilationInfo === 'string' ? JSON.parse(audit.ventilationInfo) : audit.ventilationInfo || {};
    domesticHotWaterInfo = typeof audit.domesticHotWaterInfo === 'string' ? JSON.parse(audit.domesticHotWaterInfo) : audit.domesticHotWaterInfo || {};
    ceilingInfo = typeof audit.ceilingInfo === 'string' ? JSON.parse(audit.ceilingInfo) : audit.ceilingInfo || {};
    renewablesInfo = typeof audit.renewablesInfo === 'string' ? JSON.parse(audit.renewablesInfo) : audit.renewablesInfo || {};
    blowerDoorTest = typeof audit.blowerDoorTest === 'string' ? JSON.parse(audit.blowerDoorTest) : audit.blowerDoorTest || {};
    depressurizationTest = typeof audit.depressurizationTest === 'string' ? JSON.parse(audit.depressurizationTest) : audit.depressurizationTest || {};
    doorsInfo = typeof audit.doorsInfo === 'string' ? JSON.parse(audit.doorsInfo) : audit.doorsInfo || {};
    eligibilityCriteria = typeof audit.eligibilityCriteria === 'string' ? JSON.parse(audit.eligibilityCriteria) : audit.eligibilityCriteria || {};
    preAuditDiscussion = typeof audit.preAuditDiscussion === 'string' ? JSON.parse(audit.preAuditDiscussion) : audit.preAuditDiscussion || {};
    atypicalLoads = typeof audit.atypicalLoads === 'string' ? JSON.parse(audit.atypicalLoads) : audit.atypicalLoads || {};
  } catch (e) {
    console.log('Error parsing audit data for HOT2000:', e);
    // Fallback to empty objects if parsing fails
    houseInfo = audit.houseInfo || {};
    wallsInfo = audit.wallsInfo || {};
    windowsInfo = audit.windowsInfo || {};
    foundationInfo = audit.foundationInfo || {};
    heatingInfo = audit.heatingInfo || {};
    ventilationInfo = audit.ventilationInfo || {};
    domesticHotWaterInfo = audit.domesticHotWaterInfo || {};
    ceilingInfo = audit.ceilingInfo || {};
    renewablesInfo = audit.renewablesInfo || {};
    blowerDoorTest = audit.blowerDoorTest || {};
    depressurizationTest = audit.depressurizationTest || {};
    doorsInfo = audit.doorsInfo || {};
    eligibilityCriteria = audit.eligibilityCriteria || {};
    preAuditDiscussion = audit.preAuditDiscussion || {};
    atypicalLoads = audit.atypicalLoads || {};
  }
  
  // Helper function to safely get values
  const getValue = (value: any, defaultValue: string = '') => value || defaultValue;
  const getArrayValue = (arr: any[], defaultValue: string = '') => arr && arr.length > 0 ? arr.join(',') : defaultValue;
  const getBooleanValue = (value: any, defaultValue: string = 'No') => value === true || value === 'yes' ? 'Yes' : defaultValue;
  
  // Map house types to HOT2000 format
  const houseTypeMap: Record<string, string> = {
    'bungalow': 'Bungalow',
    '2_storey': 'Two-storey',
    'bi_level': 'Bi-level',
    'split_level': 'Split-level'
  };
  
  // Map heating system types
  const heatingSystemMap: Record<string, string> = {
    'furnace': 'Forced air furnace',
    'boiler': 'Boiler',
    'combo': 'Combination heating/DHW',
    'heat_pump': 'Heat pump',
    'integrated': 'Integrated heating'
  };
  
  // Map fuel types
  const fuelTypeMap: Record<string, string> = {
    'ng': 'Natural gas',
    'propane': 'Propane',
    'electric': 'Electricity',
    'oil': 'Oil'
  };
  
  return `# HOT2000 v11.10b Input File
# Generated by Enerva Audit Tool
# Generated on: ${new Date().toISOString()}
# Audit ID: ${audit.id}

[IDENTIFICATION]
HouseName=${getValue(audit.customerFirstName)} ${getValue(audit.customerLastName)} Residence
Builder=
EvaluatorName=Enerva Energy Solutions
EvaluationDate=${getValue(audit.auditDate, new Date().toISOString().split('T')[0])}
ModificationDate=${new Date().toISOString().split('T')[0]}
WeatherLocation=${getValue(audit.customerCity)}, ${getValue(audit.customerProvince)}
HouseType=${houseTypeMap[houseInfo.houseType] || 'Bungalow'}
YearBuilt=${getValue(houseInfo.yearBuilt, '1980')}
StoreysBelowGrade=${foundationInfo.foundationType?.includes('basement') ? '1' : '0'}
StoreysAboveGrade=${houseInfo.houseType === '2_storey' ? '2' : houseInfo.houseType === 'bi_level' ? '1.5' : '1'}
Address=${getValue(audit.customerAddress)}
City=${getValue(audit.customerCity)}
Province=${getValue(audit.customerProvince)}
PostalCode=${getValue(audit.customerPostalCode)}
AuditType=${getValue(audit.auditType, 'before_upgrade')}
HomeType=${getValue(audit.homeType, 'single_detached')}

[ELIGIBILITY_CRITERIA]
RegisteredWithUtility=${getBooleanValue(eligibilityCriteria.registered)}
DocumentsAvailable=${getBooleanValue(eligibilityCriteria.documents)}
StoreyRequirement=${getBooleanValue(eligibilityCriteria.storeys)}
SizeRequirement=${getBooleanValue(eligibilityCriteria.size)}
FoundationRequirement=${getBooleanValue(eligibilityCriteria.foundation)}
MechanicalRequirement=${getBooleanValue(eligibilityCriteria.mechanical)}
DoorsWindowsRequirement=${getBooleanValue(eligibilityCriteria.doors_windows)}
EnvelopeRequirement=${getBooleanValue(eligibilityCriteria.envelope)}
RenovationsCompliant=${getBooleanValue(eligibilityCriteria.renovations)}
AshesRemoved=${getBooleanValue(eligibilityCriteria.ashes)}
ElectricalCompliant=${getBooleanValue(eligibilityCriteria.electrical)}

[PRE_AUDIT_DISCUSSION]
AuthorizationObtained=${getBooleanValue(preAuditDiscussion.authorization)}
ProcessExplained=${getBooleanValue(preAuditDiscussion.process)}
AccessDiscussed=${getBooleanValue(preAuditDiscussion.access)}
DocumentsReviewed=${getBooleanValue(preAuditDiscussion.documents)}

[ATYPICAL_LOADS]
DeicingCables=${getBooleanValue(atypicalLoads.deicing)}
ExteriorLighting=${getBooleanValue(atypicalLoads.lighting)}
HotTub=${getBooleanValue(atypicalLoads.hot_tub)}
AirConditioner=${getBooleanValue(atypicalLoads.air_conditioner)}
SwimmingPool=${getBooleanValue(atypicalLoads.pool)}

[PROGRAM_INFORMATION]
WeatherRegion=7A
DesignTemperature=-25
CalculationProcedure=NBC
BlowerDoorTest=${audit.blowerDoorTest ? 'Yes' : 'No'}
AirChangesPerHour=2.5

[HOUSE_MEASUREMENTS]
Length=12.0
Width=8.0
Height=${getValue(houseInfo.aboveGradeHeight, '2.4')}
Volume=230.4
Orientation=${getValue(houseInfo.frontOrientation, 'S')}

[WALLS]
WallFraming=${getValue(wallsInfo.wallFraming, '2x6')}
StudSpacing=${getValue(wallsInfo.centres, '16')}
CavityInsulation=${getArrayValue(wallsInfo.cavityInsulation, 'R22')}
ExteriorInsulationType=${getArrayValue(wallsInfo.exteriorInsulationType, 'None')}
ExteriorInsulationThickness=${getValue(wallsInfo.exteriorInsulationThickness, '0')}
ExteriorSheathing=${getValue(wallsInfo.exteriorSheathing, 'OSB')}
SheathingThickness=${getValue(wallsInfo.sheathingThickness, '7/16')}
ExteriorFinish=${getValue(wallsInfo.exteriorFinish, 'Vinyl')}
ExteriorFinishOther=${getValue(wallsInfo.exteriorFinishOther, '')}
StudsCorner=${getBooleanValue(wallsInfo.studsCorner)}
StudCornerType=${getArrayValue(wallsInfo.studCornerType, 'Standard')}
MainFloorCorners=${getValue(wallsInfo.corners?.main, 'Standard')}
SecondFloorCorners=${getValue(wallsInfo.corners?.second, 'Standard')}
ThirdFloorCorners=${getValue(wallsInfo.corners?.third, 'Standard')}
MainFloorIntersections=${getValue(wallsInfo.intersections?.main, 'Standard')}
SecondFloorIntersections=${getValue(wallsInfo.intersections?.second, 'Standard')}
ThirdFloorIntersections=${getValue(wallsInfo.intersections?.third, 'Standard')}
FramingFactor=0.25

# Wall Heights by Floor
${wallsInfo.floors ? wallsInfo.floors.map((floor: any) => {
  if (!floor.wallHeight) return '';
  const heightText = floor.wallHeightUnit === 'ft' && floor.wallHeightFeet && floor.wallHeightInches
    ? `${floor.wallHeightFeet}.${(parseInt(floor.wallHeightInches) / 12 * 100).toFixed(0)}`
    : floor.wallHeight;
  return `${floor.name}WallHeight=${heightText}${floor.wallHeightUnit || 'ft'}`;
}).filter(Boolean).join('\n') : ''}

[FOUNDATION]
FoundationType=${getArrayValue(foundationInfo.foundationType, 'Basement')}
WallConstruction=${getValue(foundationInfo.walls, 'Concrete')}
WallHeight=${getValue(foundationInfo.wallHeight, '2.4')}
WallHeightUnit=${getValue(foundationInfo.wallHeightUnit, 'm')}
AverageHeightAboveGrade=${getValue(foundationInfo.averageHeightAboveGrade, '0.2')}
InsulationType=${getValue(foundationInfo.insulation, 'Fibreglass')}
InsulationThickness=${getValue(foundationInfo.insulationThickness, '3.5')}
SheathingType=${getValue(foundationInfo.sheathingType, 'None')}
SheathingThickness=${getValue(foundationInfo.sheathingThickness, '0')}
CrawlspaceType=${getValue(foundationInfo.crawlspaceType, 'Vented')}
PonyWall=${getBooleanValue(foundationInfo.ponyWall)}
FoundationCorners=${getValue(foundationInfo.corners, 'Standard')}
InteriorWalls=${getArrayValue(foundationInfo.interiorWalls, 'None')}
InteriorWallConstruction=${getValue(foundationInfo.interiorWallConstruction, 'Wood')}
FramingSpacing=${getArrayValue(foundationInfo.framingSpacing, '16')}
SlabInsulation=${getBooleanValue(foundationInfo.slabInsulation)}
SlabInsulationType=${getValue(foundationInfo.slabInsulationType, 'None')}
SlabInsulationThickness=${getValue(foundationInfo.slabInsulationThickness, '0')}
SlabHeated=${getBooleanValue(foundationInfo.slabHeated)}

[WINDOWS]
FrameType=${getValue(windowsInfo.frame, 'Wood')}
GlazingLayers=${getValue(windowsInfo.glazing, '2')}
LowECoating=${getValue(windowsInfo.lowECoating, 'None')}
GasFill=${getValue(windowsInfo.gasFill, 'No')}
UValue=${windowsInfo.glazing === '3' ? '0.25' : windowsInfo.glazing === '2' ? '0.35' : '0.50'}
SHGC=0.65
VT=0.70
LintelType=${getValue(windowsInfo.lintelType, 'Single angle steel')}

[DOORS]
DoorType=${getValue(audit.doorsInfo?.skin, 'Steel')}
CoreMaterial=${getValue(audit.doorsInfo?.insulation, 'Fibreglass')}
UValue=0.40
SHGC=0.65

[CEILING]
CeilingType=${getValue(ceilingInfo.ceilingType, 'Flat')}
AtticFraming=${getValue(ceilingInfo.atticFraming, 'Wood')}
FramingSpacing=${getValue(ceilingInfo.spacing, '16')}
AtticInsulationType=${getArrayValue(ceilingInfo.atticInsulationType, 'Fibreglass')}
AtticInsulationThickness=${getValue(ceilingInfo.atticInsulationThickness, 'R40')}

[HEATING_PRIMARY]
SystemType=${heatingSystemMap[heatingInfo.heatingSystemType?.[0]] || 'Forced air furnace'}
FuelType=${fuelTypeMap[heatingInfo.source] || 'Natural gas'}
Manufacturer=${getValue(heatingInfo.manufacturer)}
Model=${getValue(heatingInfo.model)}
OutputCapacity=60
InputCapacity=75
SteadyStateEfficiency=${getValue(heatingInfo.ratedEfficiency?.steadyState, '80')}
AFUE=${getValue(heatingInfo.ratedEfficiency?.afue, '80')}
OverallEfficiency=${getValue(heatingInfo.ratedEfficiency?.overall, '78')}
IgnitionType=${getValue(heatingInfo.ignitionType, 'Electric ignition')}
PilotLight=${getValue(heatingInfo.ignitionType) === 'pilot' ? 'Yes' : 'No'}
AutomaticVentDamper=${getValue(heatingInfo.automaticVentDamper, 'No fixed barometric')}
DedicatedCombustionAirDuct=${getBooleanValue(heatingInfo.dedicatedCombustionAirDuct)}
FanPumpMotorType=${getValue(heatingInfo.fanPumpMotorType, 'PSC motor')}
VentingConfiguration=${getValue(heatingInfo.ventingConfiguration, 'Induced draft')}
HeatPumpManufacturer=${getValue(heatingInfo.heatPumpManufacturer)}
HeatPumpModel=${getValue(heatingInfo.heatPumpModel)}
SupplementaryHeatingSystem=${getValue(heatingInfo.supplementaryHeatingSystem)}
ACCoil=${getValue(heatingInfo.acCoil)}
CondenserUnit=${getValue(heatingInfo.condenserUnit)}

[DHW_PRIMARY]
DHWType=${getValue(domesticHotWaterInfo.domesticHotWaterType, 'Conventional tank')}
FuelType=${fuelTypeMap[domesticHotWaterInfo.fuel] || 'Natural gas'}
Manufacturer=${getValue(domesticHotWaterInfo.manufacturer)}
Model=${getValue(domesticHotWaterInfo.model)}
TankVolume=${getValue(domesticHotWaterInfo.tankVolume, '40')}
EnergyFactor=${getValue(domesticHotWaterInfo.efficiencyFactor, '0.60')}
COP=${getValue(domesticHotWaterInfo.cop, '1.0')}
PilotLight=${getValue(domesticHotWaterInfo.pilot, 'No')}
CoVented=${getValue(domesticHotWaterInfo.coVented, 'No')}
FlueDiameter=${getValue(domesticHotWaterInfo.flueDiameter, '4')}
DWHRPresent=${getValue(domesticHotWaterInfo.dwhr?.present, 'No')}
DWHRManufacturer=${getValue(domesticHotWaterInfo.dwhr?.manufacturer)}
DWHRModel=${getValue(domesticHotWaterInfo.dwhr?.model)}
DWHRSize=${getValue(domesticHotWaterInfo.dwhr?.size)}
ShowersToMainStack=${getValue(domesticHotWaterInfo.showersToMainStack, '2')}
LowFlushToilets=${getValue(domesticHotWaterInfo.lowFlushToilets, '2')}

[VENTILATION]
VentilationType=${getValue(ventilationInfo.ventilationType, 'Exhaust only')}
HRVManufacturer=${getValue(ventilationInfo.hrvManufacturer)}
HRVModel=${getValue(ventilationInfo.hrvModel)}
HVICertified=${getBooleanValue(ventilationInfo.hviCertified)}
SupplyCFM=${getValue(ventilationInfo.hrvCfm?.supply, '75')}
ExhaustCFM=${getValue(ventilationInfo.hrvCfm?.exhaust, '75')}
FanPowerAt0C=${getValue(ventilationInfo.fanPower?.at0C, '75')}
FanPowerAtMinus25=${getValue(ventilationInfo.fanPower?.atMinus25, '90')}
SensibleEfficiencyAt0C=${getValue(ventilationInfo.sensibleEfficiency?.at0C, '75')}
SensibleEfficiencyAtMinus25=${getValue(ventilationInfo.sensibleEfficiency?.atMinus25C, '70')}

# Exhaust Fans
BathFanCFM=${getValue(ventilationInfo.device?.bathFan?.cfm, '50')}
BathFanManufacturer=${getValue(ventilationInfo.bathFanDetails?.manufacturer)}
BathFanModel=${getValue(ventilationInfo.bathFanDetails?.model)}
BathFanExhaustFlow=${getValue(ventilationInfo.bathFanDetails?.exhaustFlow)}
BathFanPower=${getValue(ventilationInfo.bathFanDetails?.fanPower)}

RangeHoodCFM=${getValue(ventilationInfo.device?.rangeHood?.cfm, '150')}
RangeHoodManufacturer=${getValue(ventilationInfo.rangeHoodDetails?.manufacturer)}

UtilityFanCFM=${getValue(ventilationInfo.device?.utilityFan?.cfm, '100')}
UtilityFanManufacturer=${getValue(ventilationInfo.utilityFanDetails?.manufacturer)}
UtilityFanFlowRate=${getValue(ventilationInfo.utilityFanDetails?.flowRate)}

${renewablesInfo.solarPv?.present === 'yes' ? `
[SOLAR_PV]
SystemPresent=Yes
Manufacturer=${getValue(renewablesInfo.solarPv?.manufacturer)}
PanelArea=${getValue(renewablesInfo.solarPv?.area, '20')}
Slope=${getValue(renewablesInfo.solarPv?.slope, '30')}
Azimuth=${getValue(renewablesInfo.solarPv?.azimuth, '180')}
ModuleType=${getArrayValue(renewablesInfo.solarPv?.moduleType, 'Mono-crystalline silicon')}
` : `
[SOLAR_PV]
SystemPresent=No
`}

${renewablesInfo.solarDhw?.manufacturer ? `
[SOLAR_DHW]
SystemPresent=Yes
Manufacturer=${getValue(renewablesInfo.solarDhw?.manufacturer)}
Model=${getValue(renewablesInfo.solarDhw?.model)}
CSAF379Rating=${getValue(renewablesInfo.solarDhw?.csaF379Rating)}
Slope=${getValue(renewablesInfo.solarDhw?.slope, '45')}
Azimuth=${getValue(renewablesInfo.solarDhw?.azimuth, '180')}
` : `
[SOLAR_DHW]
SystemPresent=No
`}

[BLOWER_DOOR_TEST]
TestPerformed=${blowerDoorTest && Object.keys(blowerDoorTest).length > 0 ? 'Yes' : 'No'}
AreasOfLeakage=${blowerDoorTest.areasOfLeakage ? Object.entries(blowerDoorTest.areasOfLeakage).filter(([key, value]) => value).map(([key]) => key.replace(/_/g, ' ')).join(', ') : 'None specified'}
WindowComponent=${getValue(blowerDoorTest.windowComponent)}
OtherLeakage=${getValue(blowerDoorTest.other)}

# Specific Areas of Leakage Details
Rims=${getBooleanValue(blowerDoorTest.areasOfLeakage?.rims)}
ElectricOutlets=${getBooleanValue(blowerDoorTest.areasOfLeakage?.electric_outlet)}
Doors=${getBooleanValue(blowerDoorTest.areasOfLeakage?.doors)}
WallIntersections=${getBooleanValue(blowerDoorTest.areasOfLeakage?.wall_intersections)}
Baseboards=${getBooleanValue(blowerDoorTest.areasOfLeakage?.baseboards)}
CeilingFixtures=${getBooleanValue(blowerDoorTest.areasOfLeakage?.ceiling_fixtures)}
WindowFrames=${getBooleanValue(blowerDoorTest.areasOfLeakage?.window_frames)}
ElectricalPanel=${getBooleanValue(blowerDoorTest.areasOfLeakage?.electric_panel)}
AtticAccess=${getBooleanValue(blowerDoorTest.areasOfLeakage?.attic_access)}

[DEPRESSURIZATION_TEST]
TestPerformed=${depressurizationTest && Object.keys(depressurizationTest).length > 0 ? 'Yes' : 'No'}
WindowLeakage=${getValue(depressurizationTest.depressurizationTest?.windowLeakage || depressurizationTest.windowLeakage, 'No')}
OtherLeakage=${getValue(depressurizationTest.depressurizationTest?.otherLeakage || depressurizationTest.otherLeakage, 'None specified')}

[AUDIT_COMPLETION]
AuditStatus=${getValue(audit.status, 'in_progress')}
AuditCompleted=${audit.status === 'completed' ? 'Yes' : 'No'}
ReportGenerationDate=${new Date().toISOString().split('T')[0]}
EvaluatorSignature=Enerva Energy Solutions

[END_OF_FILE]
`;
}
