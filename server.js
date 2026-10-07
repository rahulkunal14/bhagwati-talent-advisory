import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// High payload limit to allow direct photo and video uploads
app.use(express.json({ limit: '120mb' }));
app.use(express.urlencoded({ extended: true, limit: '120mb' }));

// Ensure uploads and resumes directory exists
const uploadsDir = path.join(__dirname, 'uploads');
const resumesDir = path.join(uploadsDir, 'resumes');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(resumesDir)) {
  fs.mkdirSync(resumesDir, { recursive: true });
}

// In-memory store for interactive demos/forms, media and resumes
const inquiries = [];
const educatorRegistrations = [];
const resumes = [];
let mediaList = [];

// Load existing files in uploads if any
try {
  const existingFiles = fs.readdirSync(uploadsDir);
  mediaList = existingFiles.map(file => {
    const ext = path.extname(file).toLowerCase();
    const isVideo = ['.mp4', '.mov', '.webm', '.m4v'].includes(ext);
    return {
      id: 'MEDIA-' + file,
      name: file,
      url: `/uploads/${file}`,
      type: isVideo ? 'video' : 'image',
      uploadedAt: new Date().toISOString()
    };
  });
} catch (e) {
  mediaList = [];
}

// Helper to dynamically read files from uploads directory
function getMediaList() {
  try {
    const existingFiles = fs.readdirSync(uploadsDir);
    return existingFiles
      .filter(file => !file.startsWith('.') && fs.statSync(path.join(uploadsDir, file)).isFile())
      .map(file => {
        const ext = path.extname(file).toLowerCase();
        const isVideo = ['.mp4', '.mov', '.webm', '.m4v'].includes(ext);
        return {
          id: 'MEDIA-' + file,
          name: file,
          url: `/uploads/${encodeURIComponent(file)}`,
          type: isVideo ? 'video' : 'image',
          uploadedAt: new Date().toISOString()
        };
      });
  } catch (e) {
    return [];
  }
}

// API Endpoints
app.post('/api/upload', (req, res) => {
  try {
    const { filename, fileData, fileType } = req.body;
    if (!filename || !fileData) {
      return res.status(400).json({ error: 'Filename and fileData required' });
    }

    // Clean filename while preserving spaces and standard chars
    const safeName = filename.replace(/[^a-zA-Z0-9._ -]/g, '_');
    const targetPath = path.join(uploadsDir, safeName);

    // Extract base64 payload
    const matches = fileData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    const buffer = matches ? Buffer.from(matches[2], 'base64') : Buffer.from(fileData, 'base64');

    fs.writeFileSync(targetPath, buffer);

    const isVideo = fileType?.startsWith('video') || ['.mp4', '.mov', '.webm', '.m4v'].includes(path.extname(safeName).toLowerCase());

    const item = {
      id: 'MEDIA-' + Date.now(),
      name: safeName,
      url: `/uploads/${encodeURIComponent(safeName)}`,
      type: isVideo ? 'video' : 'image',
      uploadedAt: new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      message: `${safeName} uploaded successfully and published to gallery!`,
      media: item
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Failed to process file upload' });
  }
});

app.get('/api/media', (req, res) => {
  res.json({ media: getMediaList() });
});

app.post('/api/inquiries', (req, res) => {
  const payload = req.body;
  inquiries.push({
    id: 'INQ-' + Date.now(),
    ...payload,
    createdAt: new Date().toISOString()
  });
  res.status(200).json({
    success: true,
    message: 'Inquiry received successfully! Rahul Kunal or desk coordinator will contact you promptly.',
    inquiryCount: inquiries.length
  });
});

app.post('/api/educator-applications', (req, res) => {
  const payload = req.body;
  educatorRegistrations.push({
    id: 'EDU-' + Date.now(),
    ...payload,
    createdAt: new Date().toISOString()
  });
  res.status(200).json({
    success: true,
    message: 'Teacher registration received! Profile added to Bhagwati Talent Advisory educator roster.',
    applicationCount: educatorRegistrations.length
  });
});

app.post('/api/submit-resume', (req, res) => {
  try {
    const { fullName, email, phone, role, subject, experience, qualification, location, resumeFile, resumeFileName, notes } = req.body;
    if (!fullName || !phone) {
      return res.status(400).json({ error: 'Full name and phone number are required' });
    }

    let savedResumeUrl = null;
    if (resumeFile && resumeFileName) {
      const safeName = Date.now() + '_' + resumeFileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const targetPath = path.join(resumesDir, safeName);
      const matches = resumeFile.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      const buffer = matches ? Buffer.from(matches[2], 'base64') : Buffer.from(resumeFile, 'base64');
      fs.writeFileSync(targetPath, buffer);
      savedResumeUrl = `/uploads/resumes/${encodeURIComponent(safeName)}`;
    }

    const application = {
      id: 'RES-' + Date.now(),
      fullName,
      email: email || '',
      phone,
      role: role || 'Teaching Faculty',
      subject: subject || 'General',
      experience: experience || 'Fresher',
      qualification: qualification || 'B.Ed',
      location: location || 'Any',
      notes: notes || '',
      resumeUrl: savedResumeUrl,
      submittedAt: new Date().toISOString()
    };

    resumes.unshift(application);

    res.status(200).json({
      success: true,
      message: `Resume submitted successfully for ${fullName}! Your profile has been received at Rahul Kunal's talent advisory desk.`,
      applicationId: application.id,
      resumeUrl: savedResumeUrl
    });
  } catch (err) {
    console.error('Resume submission error:', err);
    res.status(500).json({ error: 'Failed to process resume submission' });
  }
});

app.get('/api/stats', (req, res) => {
  res.json({
    yearsOfExcellence: 12,
    complianceAuditsCompleted: 52,
    uploadedMediaCount: mediaList.length
  });
});

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

// Serve static assets from project root
app.use(express.static(__dirname));

// Fallback to index.html for client routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Bhagwati Talent Advisory server running at http://0.0.0.0:${PORT}`);
});
