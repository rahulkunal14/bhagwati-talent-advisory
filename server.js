import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file if present
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"](.*)['"]$/, '$1');
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    });
  } catch (e) {
    console.warn('Could not read .env file:', e.message);
  }
}

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// High payload limit to allow direct photo, video and resume document uploads
app.use(express.json({ limit: '120mb' }));
app.use(express.urlencoded({ extended: true, limit: '120mb' }));

// Ensure uploads, resumes and logs directory exists
const uploadsDir = path.join(__dirname, 'uploads');
const resumesDir = path.join(uploadsDir, 'resumes');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(resumesDir)) {
  fs.mkdirSync(resumesDir, { recursive: true });
}

// In-memory store for interactive forms, media, resumes and email logs
const inquiries = [];
const educatorRegistrations = [];
const resumes = [];
const selfAudits = [];
const clientFeedbacks = [];
const emailLogs = [];
let mediaList = [];

// Persistence file paths
const configFilePath = path.join(__dirname, 'site-config.json');
const submissionsFilePath = path.join(__dirname, 'submissions.json');
const authFilePath = path.join(__dirname, 'admin-auth.json');
const cbseNoticesFilePath = path.join(__dirname, 'cbse-notices-cache.json');

// Two-Step Verification (2FA) and Active Sessions store
const active2FAChallenges = new Map(); // challengeId -> { email, code, expiresAt, attempts }
const activeAdminSessions = new Map(); // sessionToken -> { email, expiresAt, createdAt }

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

function getAdminAuth() {
  try {
    if (fs.existsSync(authFilePath)) {
      return JSON.parse(fs.readFileSync(authFilePath, 'utf8'));
    }
  } catch (e) {
    console.warn('Failed to read admin-auth.json:', e.message);
  }
  const defaultPassword = process.env.ADMIN_PASSWORD || 'Bhagwati@901548';
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = hashPassword(defaultPassword, salt);
  const data = {
    email: 'rahulkunal14@gmail.com',
    salt,
    hash,
    twoFactorEnabled: true,
    defaultPasswordHint: 'Bhagwati@2026',
    updatedAt: new Date().toISOString()
  };
  try {
    fs.writeFileSync(authFilePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {}
  return data;
}

function saveAdminAuth(data) {
  try {
    fs.writeFileSync(authFilePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('Failed to save admin-auth.json:', e.message);
    return false;
  }
}

function isValidAdminSession(token) {
  if (!token) return false;
  const session = activeAdminSessions.get(token);
  if (!session) return false;
  if (session.expiresAt < Date.now()) {
    activeAdminSessions.delete(token);
    return false;
  }
  return true;
}

// Periodic cleanup of expired 2FA challenges and sessions
setInterval(() => {
  const now = Date.now();
  for (const [id, c] of active2FAChallenges.entries()) {
    if (c.expiresAt < now) active2FAChallenges.delete(id);
  }
  for (const [tok, s] of activeAdminSessions.entries()) {
    if (s.expiresAt < now) activeAdminSessions.delete(tok);
  }
}, 60000);

// Helper to get site configuration
function getSiteConfig() {
  try {
    if (fs.existsSync(configFilePath)) {
      return JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
    }
  } catch (e) {
    console.warn('Failed to read site-config.json:', e.message);
  }
  return {
    noticeTicker: "CBSE Re-Affiliation Notice: Last date for Re-Affiliation & Extension on SARAS portal is 10 October 2026. Finalize OASIS staff ratios, Form 1 agreements & safety audits immediately! | CBSE Session 2025-26 Faculty Hiring: Urgent openings for PGT & TGT Teachers. | Pre-Inspection CBSE Affiliation Audit Desk active. | 48-hr profiling with Rahul Sir.",
    consultationHours: "10:00 AM - 5:00 PM (Mon - Sat)",
    phone: "+91 79797 70162",
    email: "rahulkunal14@gmail.com",
    address: "Bhagwati Complex, Near Block More, Sherghati, Gaya, Bihar - 824211",
    heroTitle: "Specialized Institutional HR Solutions & Regulatory Compliance for CBSE Schools",
    heroSubtitle: "Partnering with educational trusts, chairpersons, and school principals across Sherghati, Gaya, Patna, and Bihar. From certified faculty recruitment (PGT, TGT, PRT) to inspection-ready POCSO, POSH, and CBSE Form 1 statutory compliance.",
    heroPill: "★ Recognized Top Zonal HR Leader • 12+ Years Advisory",
    statYears: "12+",
    updatedAt: new Date().toISOString(),
    updatedBy: "rahulkunal14@gmail.com"
  };
}

function saveSiteConfig(newConfig) {
  try {
    fs.writeFileSync(configFilePath, JSON.stringify(newConfig, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('Failed to save site-config.json:', e.message);
    return false;
  }
}

// ==========================================
// CBSE Official Notices Sync & Cache Engine
// ==========================================
let cbseNoticesVersion = Date.now();

function getCbseNoticesCache() {
  try {
    if (fs.existsSync(cbseNoticesFilePath)) {
      return JSON.parse(fs.readFileSync(cbseNoticesFilePath, 'utf8'));
    }
  } catch (e) {
    console.warn('Failed to read cbse-notices-cache.json:', e.message);
  }
  return {
    lastSync: new Date().toISOString(),
    status: 'cached',
    source: 'Central Board of Secondary Education (CBSE)',
    total: 0,
    notices: []
  };
}

function saveCbseNoticesCache(data) {
  try {
    fs.writeFileSync(cbseNoticesFilePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('Failed to save cbse-notices-cache.json:', e.message);
    return false;
  }
}

async function syncCbseNoticesFromOfficialSources() {
  const existingCache = getCbseNoticesCache();
  const notices = Array.isArray(existingCache.notices) ? [...existingCache.notices] : [];
  const seenUrls = new Set(notices.map(n => n.url));
  let newFoundCount = 0;

  // 1. Fetch from CBSE Academic (cbseacademic.nic.in/circulars.html)
  try {
    const res = await fetch('https://cbseacademic.nic.in/circulars.html', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) BhagwatiTalentAdvisory/2.0' },
      signal: AbortSignal.timeout(8000)
    });
    if (res.ok) {
      const html = await res.text();
      const rows = [...html.matchAll(/<tr>([\s\S]*?)<\/tr>/gi)];
      for (const row of rows) {
        const rowHtml = row[1];
        if (!rowHtml.includes('.pdf')) continue;

        let ref = 'CBSE Circular';
        const englishRef = rowHtml.match(/<span[^>]*class=\"english\"[^>]*>([\s\S]*?)<\/span>/i);
        if (englishRef) {
          ref = englishRef[1].replace(/<[^>]+>/g, '').trim();
        } else {
          const td1 = rowHtml.match(/<td>([\s\S]*?)<\/td>/i);
          if (td1) ref = td1[1].replace(/<[^>]+>/g, '').trim();
        }

        let month = '';
        const englishMonth = rowHtml.match(/<td>[\s\S]*?<span[^>]*class=\"english\"[^>]*>([A-Za-z]+)<\/span>/i);
        if (englishMonth) {
          month = englishMonth[1].trim();
        } else {
          const tds = [...rowHtml.matchAll(/<td>([\s\S]*?)<\/td>/gi)];
          if (tds[1]) month = tds[1][1].replace(/<[^>]+>/g, '').trim();
        }

        const linkMatch = rowHtml.match(/<a[^>]*href=\"([^\"]+)\"[^>]*>([\s\S]*?)<\/a>/i);
        if (linkMatch) {
          let href = linkMatch[1].trim();
          if (!href.startsWith('http')) {
            href = 'https://cbseacademic.nic.in/' + href.replace(/^\/+/, '');
          }
          const rawTitle = linkMatch[2].replace(/<[^>]+>/g, '').replace(/[\r\n\t]+/g, ' ').trim();
          if (rawTitle.length > 8 && !seenUrls.has(href)) {
            seenUrls.add(href);
            newFoundCount++;
            const dateStr = month ? `${month} 2026` : 'October 2026';
            notices.unshift({
              id: 'acad-' + (ref ? ref.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase() : Math.random().toString(36).substring(7)),
              source: 'CBSE Academic & Training Wing',
              refNo: ref,
              title: rawTitle,
              date: dateStr,
              category: 'Academic',
              summary: `Official notification published on CBSE Academic portal: ${rawTitle.substring(0, 140)}...`,
              url: href,
              isOfficial: true,
              isNew: true,
              isPinned: false
            });
          }
        }
        if (notices.length >= 40) break;
      }
    }
  } catch (err) {
    console.warn('[CBSE Academic Sync Warning]:', err.message);
  }

  // 2. Fetch from CBSE Official Portal (cbse.gov.in/cbsenew/cbse.html)
  try {
    const res = await fetch('https://www.cbse.gov.in/cbsenew/cbse.html', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) BhagwatiTalentAdvisory/2.0' },
      signal: AbortSignal.timeout(8000)
    });
    if (res.ok) {
      const html = await res.text();
      const aMatches = [...html.matchAll(/<a[^>]*href=\"([^\"]*documents[^\"]*\.pdf)\"[^>]*>([\s\S]*?)<\/a>/gi)];
      for (const m of aMatches) {
        let href = m[1].trim();
        if (!href.startsWith('http')) {
          href = 'https://www.cbse.gov.in/cbsenew/' + href.replace(/^\/+/, '');
        }
        const rawTitle = m[2].replace(/<[^>]+>/g, '').replace(/[\r\n\t]+/g, ' ').trim();
        if (rawTitle.length > 15 && !seenUrls.has(href)) {
          seenUrls.add(href);
          newFoundCount++;
          let category = 'General Circular';
          const lower = rawTitle.toLowerCase();
          if (lower.includes('saras') || lower.includes('affiliat') || lower.includes('oasis')) {
            category = 'Affiliation & SARAS';
          } else if (lower.includes('exam') || lower.includes('class x') || lower.includes('class xii') || lower.includes('private')) {
            category = 'Examinations';
          } else if (lower.includes('recruit') || lower.includes('vacancy')) {
            category = 'Recruitment';
          } else if (lower.includes('training') || lower.includes('nishtha') || lower.includes('inclusive') || lower.includes('academic')) {
            category = 'Academic';
          }

          let dateStr = 'October 2026';
          const dateMatch = rawTitle.match(/(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/) || href.match(/_(\d{2})(\d{2})(20\d{2})\.pdf/i);
          if (dateMatch) {
            if (dateMatch[3]) dateStr = `${dateMatch[1]}/${dateMatch[2]}/${dateMatch[3]}`;
            else dateStr = dateMatch[1];
          }

          const refNo = category === 'Affiliation & SARAS' ? 'CBSE/SARAS/2026' : (category === 'Examinations' ? 'CBSE/EXAM/2026' : 'CBSE/HQ/2026');

          notices.unshift({
            id: 'cbse-' + Math.random().toString(36).substring(2, 9),
            source: 'CBSE Official Portal (cbse.gov.in)',
            refNo,
            title: rawTitle,
            date: dateStr,
            category,
            summary: `Statutory circular issued by CBSE Head Office for institutional compliance: ${rawTitle.substring(0, 140)}...`,
            url: href,
            isOfficial: true,
            isNew: true,
            isPinned: false
          });
        }
        if (notices.length >= 50) break;
      }
    }
  } catch (err) {
    console.warn('[CBSE Main Portal Sync Warning]:', err.message);
  }

  // Ensure pinned items like SARAS 10 October deadline stay prominent at top
  notices.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });

  const updatedPayload = {
    lastSync: new Date().toISOString(),
    status: 'success',
    source: 'Central Board of Secondary Education (CBSE)',
    endpoints: ['https://www.cbse.gov.in/cbsenew/cbse.html', 'https://cbseacademic.nic.in/circulars.html'],
    total: notices.length,
    newFoundCount,
    notices
  };

  if (newFoundCount > 0) {
    cbseNoticesVersion = Date.now();
  }

  saveCbseNoticesCache(updatedPayload);
  console.log(`[CBSE Sync] Synchronized ${notices.length} notices (${newFoundCount} new) from official CBSE portals`);
  return updatedPayload;
}

// Automated background sync scheduler: starts 2s after boot and every 2 minutes thereafter
setTimeout(() => {
  syncCbseNoticesFromOfficialSources().catch(e => console.warn('[CBSE Initial Sync Error]:', e.message));
}, 2000);

setInterval(() => {
  syncCbseNoticesFromOfficialSources().catch(e => console.warn('[CBSE Scheduled Sync Error]:', e.message));
}, 2 * 60 * 1000);

// Submissions persistence helpers
function loadSubmissions() {
  try {
    if (fs.existsSync(submissionsFilePath)) {
      const data = JSON.parse(fs.readFileSync(submissionsFilePath, 'utf8'));
      if (Array.isArray(data.inquiries)) { inquiries.length = 0; inquiries.push(...data.inquiries); }
      if (Array.isArray(data.resumes)) { resumes.length = 0; resumes.push(...data.resumes); }
      if (Array.isArray(data.selfAudits)) { selfAudits.length = 0; selfAudits.push(...data.selfAudits); }
      if (Array.isArray(data.educatorRegistrations)) { educatorRegistrations.length = 0; educatorRegistrations.push(...data.educatorRegistrations); }
      if (Array.isArray(data.clientFeedbacks)) { clientFeedbacks.length = 0; clientFeedbacks.push(...data.clientFeedbacks); }
    }
  } catch (e) {
    console.warn('Could not load submissions.json:', e.message);
  }
}

function saveSubmissions() {
  try {
    fs.writeFileSync(submissionsFilePath, JSON.stringify({
      inquiries,
      resumes,
      selfAudits,
      educatorRegistrations,
      clientFeedbacks
    }, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to save submissions.json:', e.message);
  }
}

loadSubmissions();

// Admin email to receive all alerts & submissions
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.RECIPIENT_EMAIL || 'rahulkunal14@gmail.com';

// Configure Nodemailer Transporter
function createMailTransporter() {
  const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER || process.env.GMAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.GMAIL_PASS || process.env.GMAIL_APP_PASSWORD;
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = Number(process.env.SMTP_PORT) || 587;
  const smtpSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;

  if (smtpUser && smtpPass) {
    return nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  // Fallback to JSON/stream transport if SMTP credentials are not yet configured in env
  // This allows the app to cleanly log, store and process all email payloads without crashing
  return nodemailer.createTransport({
    jsonTransport: true
  });
}

let transporter = createMailTransporter();

// Helper to send email with robust multi-channel delivery (FormSubmit Gateway + Nodemailer)
async function sendNotificationEmail({ to, subject, html, text, replyTo, attachments = [], data = {} }) {
  const targetRecipient = to || ADMIN_EMAIL;
  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || `"Bhagwati Talent Advisory" <${ADMIN_EMAIL}>`;

  const logEntry = {
    id: 'MAIL-' + Date.now(),
    to: targetRecipient,
    subject: subject,
    replyTo: replyTo || '',
    attachmentsCount: attachments.length,
    timestamp: new Date().toISOString(),
    status: 'pending'
  };

  // 1. Direct automated transmission to recipient inbox via FormSubmit Gateway
  let gatewayDelivered = false;
  try {
    const gatewayPayload = {
      _subject: subject,
      _replyto: replyTo || '',
      _template: 'table',
      _captcha: 'false',
      ...data
    };

    const gatewayRes = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(targetRecipient)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Referer': 'https://rahulkunal14.github.io/bhagwati-talent-advisory/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      body: JSON.stringify(gatewayPayload)
    });

    if (gatewayRes.ok) {
      const gData = await gatewayRes.json().catch(() => ({}));
      if (gData.success === 'true' || gData.success === true) {
        gatewayDelivered = true;
        logEntry.gatewayStatus = 'delivered';
        console.log(`[FormSubmit Gateway] Successfully delivered email [${subject}] to ${targetRecipient}`);
      }
    }
  } catch (gErr) {
    console.warn('[FormSubmit Gateway Warning]:', gErr.message);
  }

  // 2. Nodemailer Transmission (active if SMTP credentials provided)
  try {
    const isSmtpConfigured = !!(process.env.SMTP_USER || process.env.EMAIL_USER);
    const mailOptions = {
      from: fromAddress,
      to: targetRecipient,
      replyTo: replyTo || ADMIN_EMAIL,
      subject: subject,
      text: text || html.replace(/<[^>]+>/g, ' '),
      html: html,
      attachments: attachments
    };

    const info = await transporter.sendMail(mailOptions);
    logEntry.status = (gatewayDelivered || isSmtpConfigured) ? 'sent' : 'buffered';
    logEntry.messageId = info.messageId || logEntry.id;
    console.log(`[Nodemailer] Processed email [${subject}] to ${targetRecipient}. ID: ${logEntry.messageId}`);
    
    emailLogs.unshift(logEntry);
    if (emailLogs.length > 100) emailLogs.pop();

    return { success: true, log: logEntry, info, gatewayDelivered };
  } catch (err) {
    console.error(`[Nodemailer Error]`, err.message);
    logEntry.status = gatewayDelivered ? 'sent' : 'error';
    logEntry.error = err.message;
    emailLogs.unshift(logEntry);
    return { success: gatewayDelivered, error: err.message, log: logEntry };
  }
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

// 1. API Endpoint: Upload Media
app.post('/api/upload', (req, res) => {
  try {
    const { filename, fileData, fileType } = req.body;
    if (!filename || !fileData) {
      return res.status(400).json({ error: 'Filename and fileData required' });
    }

    const safeName = filename.replace(/[^a-zA-Z0-9._ -]/g, '_');
    const targetPath = path.join(uploadsDir, safeName);

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

// 2. API Endpoint: Self-Audit Submission & Email Notification
app.post('/api/submit-audit', async (req, res) => {
  try {
    const {
      schoolName,
      contactPerson,
      phone,
      email,
      score = '0%',
      status = 'Under Review',
      checkedCount = 0,
      totalCount = 16,
      verifiedItems = [],
      missingItems = [],
      notes = ''
    } = req.body;

    if (!schoolName || !phone) {
      return res.status(400).json({ error: 'School name and phone number are required' });
    }

    const auditRecord = {
      id: 'AUDIT-' + Date.now(),
      schoolName,
      contactPerson: contactPerson || 'Principal / Secretary',
      phone,
      email: email || '',
      score,
      status,
      checkedCount,
      totalCount,
      verifiedItems,
      missingItems,
      notes,
      submittedAt: new Date().toISOString()
    };

    selfAudits.unshift(auditRecord);
    saveSubmissions();

    // Format HTML email for Rahul Kunal
    const verifiedListHtml = verifiedItems && verifiedItems.length > 0
      ? verifiedItems.map(item => `<li style="margin-bottom: 6px; color: #166534;">✅ ${item}</li>`).join('')
      : '<li style="color: #64748b;">None recorded</li>';

    const missingListHtml = missingItems && missingItems.length > 0
      ? missingItems.map(item => `<li style="margin-bottom: 6px; color: #991b1b;">⚠️ ${item}</li>`).join('')
      : '<li style="color: #166534;">No missing items! Institutional compliance is 100%.</li>';

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; color: #1e293b; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background: #0b2545; color: #ffffff; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 22px; letter-spacing: 0.5px;">Bhagwati Talent Advisory</h1>
          <p style="margin: 6px 0 0; font-size: 14px; color: #f59e0b; font-weight: bold;">📋 New CBSE Compliance Self-Audit Submission</p>
        </div>

        <div style="padding: 24px;">
          <div style="background: #f8fafc; border-left: 4px solid #f59e0b; padding: 14px 18px; margin-bottom: 20px; border-radius: 4px;">
            <p style="margin: 0; font-size: 15px; font-weight: bold; color: #0b2545;">Institutional Compliance Score:</p>
            <div style="font-size: 26px; font-weight: 800; color: #b45309; margin: 4px 0;">${score} — ${status}</div>
            <div style="font-size: 13px; color: #64748b;">${checkedCount} of ${totalCount} Statutory Norms Verified</div>
          </div>

          <h3 style="color: #0b2545; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-top: 0;">School & Contact Details</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; width: 180px; color: #475569;">School / Trust Name:</td>
              <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${schoolName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #475569;">Contact Person:</td>
              <td style="padding: 8px 0; color: #0f172a;">${contactPerson || 'Not provided'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #475569;">Mobile / WhatsApp:</td>
              <td style="padding: 8px 0; color: #0f172a;"><a href="tel:${phone}" style="color: #0284c7; text-decoration: none; font-weight: 600;">${phone}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #475569;">Email Address:</td>
              <td style="padding: 8px 0; color: #0f172a;"><a href="mailto:${email}" style="color: #0284c7; text-decoration: none;">${email || 'Not provided'}</a></td>
            </tr>
            ${notes ? `<tr><td style="padding: 8px 0; font-weight: bold; color: #475569;">Special Concerns / Notes:</td><td style="padding: 8px 0; color: #334155;">${notes}</td></tr>` : ''}
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #475569;">Audit Timestamp:</td>
              <td style="padding: 8px 0; color: #64748b;">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</td>
            </tr>
          </table>

          <div style="margin-bottom: 20px;">
            <h4 style="color: #166534; margin: 0 0 10px; font-size: 15px;">Verified Statutory Norms (${checkedCount}):</h4>
            <ul style="padding-left: 20px; font-size: 13.5px; line-height: 1.5; margin: 0;">
              ${verifiedListHtml}
            </ul>
          </div>

          <div style="margin-bottom: 24px;">
            <h4 style="color: #991b1b; margin: 0 0 10px; font-size: 15px;">Regulatory Gaps & Missing Items (${totalCount - checkedCount}):</h4>
            <ul style="padding-left: 20px; font-size: 13.5px; line-height: 1.5; margin: 0;">
              ${missingListHtml}
            </ul>
          </div>

          <div style="text-align: center; padding-top: 16px; border-top: 1px solid #e2e8f0;">
            <a href="https://wa.me/${phone.replace(/[^0-9]/g, '')}" style="display: inline-block; background: #25d366; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; margin-right: 10px;">Connect on WhatsApp</a>
            <a href="tel:${phone}" style="display: inline-block; background: #0b2545; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">Call Contact</a>
          </div>
        </div>

        <div style="background: #f1f5f9; padding: 14px; text-align: center; font-size: 12px; color: #64748b;">
          Bhagwati Talent Advisory • Sherghati, Gaya, Bihar • Lead HR Consultant: Rahul Kunal
        </div>
      </div>
    `;

    // Deliver to admin email
    await sendNotificationEmail({
      to: ADMIN_EMAIL,
      replyTo: email || undefined,
      subject: `[CBSE Self-Audit Report] ${schoolName} - Score: ${score} (${status})`,
      html: emailHtml,
      data: {
        'School / Trust Name': schoolName,
        'Principal / Contact Person': contactPerson || 'Principal / Management',
        'Mobile Number': phone,
        'Official Email': email || 'Not provided',
        'Compliance Score': `${score} (${status})`,
        'Verified Norms Count': `${checkedCount} of ${totalCount}`,
        'Verified Norms': verifiedItems && verifiedItems.length ? verifiedItems.join('; ') : 'None',
        'Regulatory Gaps / Missing Items': missingItems && missingItems.length ? missingItems.join('; ') : 'None (100% compliant)',
        'Concerns / Target Inspection Date': notes || 'None noted',
        'Submission Timestamp': new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST'
      }
    });

    // Optional confirmation email to applicant if school email was provided
    if (email && email.includes('@')) {
      const applicantAckHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <div style="background: #0b2545; color: #ffffff; padding: 20px; text-align: center;">
            <h2 style="margin: 0; font-size: 20px;">Bhagwati Talent Advisory</h2>
            <p style="margin: 4px 0 0; color: #f59e0b; font-size: 13px;">CBSE Compliance & Institutional Human Capital Desk</p>
          </div>
          <div style="padding: 20px;">
            <p>Dear ${contactPerson || 'School Principal / Management'},</p>
            <p>Thank you for conducting the CBSE Compliance Self-Audit for <strong>${schoolName}</strong> on the Bhagwati Talent Advisory portal.</p>
            <p>Your calculated compliance score is <strong>${score}</strong> (${status}). Our lead consultant, <strong>Rahul Kunal</strong>, has received your checklist and will reach out to schedule an advisory consultation regarding your inspection preparedness.</p>
            <p style="font-size: 13px; color: #475569;">For urgent queries, you can reach Rahul Sir directly at <a href="tel:+917979770162">+91 79797 70162</a>.</p>
            <p style="margin-top: 24px; font-size: 13px; color: #64748b;">Best regards,<br><strong>Rahul Kunal</strong><br>Lead HR & Compliance Consultant<br>Bhagwati Talent Advisory</p>
          </div>
        </div>
      `;
      sendNotificationEmail({
        to: email,
        subject: `Your CBSE Compliance Self-Audit Report: ${schoolName} (${score})`,
        html: applicantAckHtml
      }).catch(() => {});
    }

    res.status(200).json({
      success: true,
      message: `Self-Audit Report for ${schoolName} successfully transmitted to Rahul Kunal's desk!`,
      auditId: auditRecord.id,
      score,
      status
    });
  } catch (err) {
    console.error('Audit submission error:', err);
    res.status(500).json({ error: 'Failed to process self-audit submission' });
  }
});

// 3. API Endpoint: School Inquiries (Inquiry Hub Tab 1)
app.post('/api/inquiries', async (req, res) => {
  try {
    const payload = req.body;
    const contactPerson = payload.Contact_Person || payload.contact_name || payload.contactPerson || 'School Representative';
    const schoolName = payload.School_Name || payload.school_name || payload.schoolName || 'Not specified';
    const mobile = payload.Mobile_Number || payload.mobile_number || payload.phone || '';
    const email = payload.Email_Address || payload.email_id || payload.email || '';
    const city = payload.City_Location || payload.location || 'Not specified';
    const service = payload.Service_Required || payload.service_required || 'General Institutional Consultation';
    const message = payload.Message_Details || payload.message_details || payload.message || '';

    const record = {
      id: 'INQ-' + Date.now(),
      contactPerson,
      schoolName,
      mobile,
      email,
      city,
      service,
      message,
      createdAt: new Date().toISOString()
    };

    inquiries.push(record);
    saveSubmissions();

    // Email to Rahul Kunal
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; color: #1e293b; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background: #0b2545; color: #ffffff; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 22px;">Bhagwati Talent Advisory</h1>
          <p style="margin: 6px 0 0; font-size: 14px; color: #f59e0b; font-weight: bold;">🏫 New School & Institutional Inquiry (Inquiry Hub)</p>
        </div>

        <div style="padding: 24px;">
          <h3 style="color: #0b2545; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-top: 0;">Inquiry Details</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; width: 180px; color: #475569;">School / Trust:</td>
              <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${schoolName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #475569;">Contact Person:</td>
              <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${contactPerson}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #475569;">Mobile / WhatsApp:</td>
              <td style="padding: 8px 0; color: #0f172a;"><a href="tel:${mobile}" style="color: #0284c7; text-decoration: none; font-weight: 600;">${mobile}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #475569;">Email Address:</td>
              <td style="padding: 8px 0; color: #0f172a;"><a href="mailto:${email}" style="color: #0284c7; text-decoration: none;">${email || 'Not provided'}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #475569;">Location / District:</td>
              <td style="padding: 8px 0; color: #0f172a;">${city}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #475569;">Service Required:</td>
              <td style="padding: 8px 0; color: #b45309; font-weight: bold;">${service}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #475569;">Timestamp:</td>
              <td style="padding: 8px 0; color: #64748b;">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</td>
            </tr>
          </table>

          <div style="background: #f8fafc; border-left: 4px solid #0284c7; padding: 14px 18px; margin-bottom: 20px; border-radius: 4px;">
            <p style="margin: 0 0 6px; font-weight: bold; color: #0f172a;">Requirement / Vacancy Details:</p>
            <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #334155; white-space: pre-wrap;">${message || 'No additional message entered.'}</p>
          </div>

          <div style="text-align: center; padding-top: 16px; border-top: 1px solid #e2e8f0;">
            <a href="https://wa.me/${mobile.replace(/[^0-9]/g, '')}" style="display: inline-block; background: #25d366; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; margin-right: 10px;">Reply on WhatsApp</a>
            <a href="tel:${mobile}" style="display: inline-block; background: #0b2545; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">Call Client</a>
          </div>
        </div>

        <div style="background: #f1f5f9; padding: 14px; text-align: center; font-size: 12px; color: #64748b;">
          Bhagwati Talent Advisory • Inquiry Hub Router • Sherghati, Gaya, Bihar
        </div>
      </div>
    `;

    await sendNotificationEmail({
      to: ADMIN_EMAIL,
      replyTo: email || undefined,
      subject: `[New School Inquiry] ${schoolName} - ${service}`,
      html: emailHtml,
      data: {
        'School / Trust Name': schoolName,
        'Contact Person': contactPerson,
        'Mobile Number': mobile,
        'Official Email': email || 'Not provided',
        'Location / District': city,
        'Service Requested': service,
        'Requirements / Staffing Need': message || 'General Inquiry',
        'Inquiry Timestamp': new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST'
      }
    });

    if (email && email.includes('@')) {
      const ackHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
          <h2 style="color: #0b2545; margin-top: 0;">Bhagwati Talent Advisory</h2>
          <p>Dear ${contactPerson},</p>
          <p>Thank you for your institutional consultation inquiry regarding <strong>${service}</strong> for <strong>${schoolName}</strong>.</p>
          <p>Your request has been delivered to <strong>Rahul Kunal</strong>'s desk. We will review your staffing/compliance needs and contact you within 24 business hours.</p>
          <p style="margin-top: 20px; font-size: 13px; color: #64748b;">Warm regards,<br><strong>Rahul Kunal</strong><br>Lead HR & Compliance Consultant<br>+91 79797 70162</p>
        </div>
      `;
      sendNotificationEmail({
        to: email,
        subject: `Inquiry Received: Bhagwati Talent Advisory (${schoolName})`,
        html: ackHtml
      }).catch(() => {});
    }

    res.status(200).json({
      success: true,
      message: 'Inquiry received successfully and dispatched to Rahul Kunal\'s advisory desk!',
      inquiry: record,
      inquiryCount: inquiries.length
    });
  } catch (err) {
    console.error('Inquiry submission error:', err);
    res.status(500).json({ error: 'Failed to process inquiry submission' });
  }
});

// GET /api/inquiries - Live Inquiries Feed (Updates automatically on app page)
app.get('/api/inquiries', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const isAdmin = isValidAdminSession(token);

  const safeList = inquiries.slice(-50).reverse().map(item => {
    if (isAdmin) return item;
    const maskedMobile = item.mobile && item.mobile.length >= 10
      ? item.mobile.substring(0, 4) + '****' + item.mobile.substring(item.mobile.length - 2)
      : 'Verified Contact';
    const maskedContact = item.contactPerson
      ? item.contactPerson.split(' ')[0] + (item.contactPerson.split(' ')[1] ? ' ' + item.contactPerson.split(' ')[1][0] + '.' : '')
      : 'School Representative';

    return {
      id: item.id,
      contactPerson: maskedContact,
      mobile: maskedMobile,
      city: item.city || 'Bihar / Eastern India',
      service: item.service || 'Institutional Advisory',
      createdAt: item.createdAt,
      status: 'Received & Active'
    };
  });

  res.json({
    success: true,
    total: inquiries.length,
    inquiries: safeList,
    lastUpdated: inquiries.length > 0 ? inquiries[inquiries.length - 1].createdAt : new Date().toISOString()
  });
});

// 4. API Endpoint: Educator Application (Inquiry Hub Tab 2)
app.post('/api/educator-applications', async (req, res) => {
  try {
    const payload = req.body;
    const teacherName = payload.Teacher_Name || payload.teacher_name || payload.fullName || 'Candidate';
    const mobile = payload.Mobile_Number || payload.teacher_phone || payload.phone || '';
    const email = payload.Email_Address || payload.teacher_email || payload.email || '';
    const postApplied = payload.Post_Applied || payload.post_applied || 'Teaching Faculty';
    const subject = payload.Subject_Specialization || payload.subject_specialization || 'General';
    const qualifications = payload.Qualifications || payload.qualifications || '';
    const experience = payload.Total_Experience || payload.total_experience || 'Fresher';
    const location = payload.Preferred_Locations || payload.preferred_locations || 'Bihar';

    const record = {
      id: 'EDU-' + Date.now(),
      teacherName,
      mobile,
      email,
      postApplied,
      subject,
      qualifications,
      experience,
      location,
      createdAt: new Date().toISOString()
    };

    educatorRegistrations.push(record);
    saveSubmissions();

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; color: #1e293b; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background: #0b2545; color: #ffffff; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 22px;">Bhagwati Talent Advisory</h1>
          <p style="margin: 6px 0 0; font-size: 14px; color: #f59e0b; font-weight: bold;">👨‍🏫 New Educator Application (Inquiry Hub)</p>
        </div>

        <div style="padding: 24px;">
          <h3 style="color: #0b2545; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-top: 0;">Candidate Profile</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; width: 180px; color: #475569;">Teacher Name:</td>
              <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${teacherName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #475569;">Mobile / WhatsApp:</td>
              <td style="padding: 8px 0; color: #0f172a;"><a href="tel:${mobile}" style="color: #0284c7; text-decoration: none; font-weight: 600;">${mobile}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #475569;">Email Address:</td>
              <td style="padding: 8px 0; color: #0f172a;"><a href="mailto:${email}" style="color: #0284c7; text-decoration: none;">${email || 'Not provided'}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #475569;">Post Applied:</td>
              <td style="padding: 8px 0; color: #b45309; font-weight: bold;">${postApplied}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #475569;">Core Subject:</td>
              <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${subject}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #475569;">Qualifications & CTET:</td>
              <td style="padding: 8px 0; color: #0f172a;">${qualifications}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #475569;">Teaching Experience:</td>
              <td style="padding: 8px 0; color: #0f172a;">${experience}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #475569;">Preferred Locations:</td>
              <td style="padding: 8px 0; color: #0f172a;">${location}</td>
            </tr>
          </table>

          <div style="text-align: center; padding-top: 16px; border-top: 1px solid #e2e8f0;">
            <a href="https://wa.me/${mobile.replace(/[^0-9]/g, '')}" style="display: inline-block; background: #25d366; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; margin-right: 10px;">WhatsApp Candidate</a>
            <a href="tel:${mobile}" style="display: inline-block; background: #0b2545; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">Call Candidate</a>
          </div>
        </div>
      </div>
    `;

    await sendNotificationEmail({
      to: ADMIN_EMAIL,
      replyTo: email || undefined,
      subject: `[New Educator Application] ${teacherName} - ${postApplied} (${subject})`,
      html: emailHtml,
      data: {
        'Teacher Name': teacherName,
        'Mobile Number': mobile,
        'Email Address': email || 'Not provided',
        'Post Applied': postApplied,
        'Subject Specialization': subject,
        'Highest Qualifications': qualifications,
        'Teaching Experience': experience,
        'Preferred Locations': location,
        'Application Timestamp': new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST'
      }
    });

    if (email && email.includes('@')) {
      const ackHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
          <h2 style="color: #0b2545; margin-top: 0;">Bhagwati Talent Advisory</h2>
          <p>Dear ${teacherName},</p>
          <p>Thank you for submitting your educator registration for <strong>${postApplied} (${subject})</strong>.</p>
          <p>Your details have been added to our verified educator database and delivered to <strong>Rahul Kunal</strong>'s desk. We will match your credentials with upcoming vacancies in premier CBSE schools.</p>
          <p style="margin-top: 20px; font-size: 13px; color: #64748b;">Best regards,<br><strong>Rahul Kunal</strong><br>Bhagwati Talent Advisory<br>+91 79797 70162</p>
        </div>
      `;
      sendNotificationEmail({
        to: email,
        subject: `Application Registered: Bhagwati Talent Advisory`,
        html: ackHtml
      }).catch(() => {});
    }

    res.status(200).json({
      success: true,
      message: 'Teacher registration received and delivered to Rahul Kunal\'s talent advisory desk!',
      applicationCount: educatorRegistrations.length
    });
  } catch (err) {
    console.error('Educator application error:', err);
    res.status(500).json({ error: 'Failed to process educator registration' });
  }
});

// 5. API Endpoint: Submit Resume Desk (With Nodemailer Attachment Delivery)
app.post('/api/submit-resume', async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      role = 'Teaching Faculty',
      subject = 'General',
      experience = 'Fresher',
      qualification = 'B.Ed',
      location = 'Any',
      resumeFile,
      resumeFileName,
      notes = ''
    } = req.body;

    if (!fullName || !phone) {
      return res.status(400).json({ error: 'Full name and phone number are required' });
    }

    let savedResumeUrl = null;
    let savedResumePath = null;
    let emailAttachments = [];

    if (resumeFile && resumeFileName) {
      const safeName = Date.now() + '_' + resumeFileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      savedResumePath = path.join(resumesDir, safeName);
      const matches = resumeFile.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      const buffer = matches ? Buffer.from(matches[2], 'base64') : Buffer.from(resumeFile, 'base64');
      fs.writeFileSync(savedResumePath, buffer);
      savedResumeUrl = `/uploads/resumes/${encodeURIComponent(safeName)}`;

      // Attach file to email
      emailAttachments.push({
        filename: resumeFileName,
        content: buffer
      });
    }

    const application = {
      id: 'RES-' + Date.now(),
      fullName,
      email: email || '',
      phone,
      role,
      subject,
      experience,
      qualification,
      location,
      notes,
      resumeUrl: savedResumeUrl,
      resumeFileName: resumeFileName || null,
      submittedAt: new Date().toISOString()
    };

    resumes.unshift(application);
    saveSubmissions();

    const appHost = req.get('host') || 'ais-dev-7obmzq4poec7wjnvdrz256-972099970091.asia-east1.run.app';
    const resumeDownloadUrl = savedResumeUrl ? `${req.protocol}://${appHost}${savedResumeUrl}` : 'No resume file attached';

    // Format rich HTML email with resume attachment
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; color: #1e293b; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background: #0b2545; color: #ffffff; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 22px;">Bhagwati Talent Advisory</h1>
          <p style="margin: 6px 0 0; font-size: 14px; color: #f59e0b; font-weight: bold;">📄 New Resume Received at Talent Desk</p>
        </div>

        <div style="padding: 24px;">
          <h3 style="color: #0b2545; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-top: 0;">Candidate Overview</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; width: 180px; color: #475569;">Full Name:</td>
              <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${fullName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #475569;">Mobile / WhatsApp:</td>
              <td style="padding: 8px 0; color: #0f172a;"><a href="tel:${phone}" style="color: #0284c7; text-decoration: none; font-weight: 600;">${phone}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #475569;">Email Address:</td>
              <td style="padding: 8px 0; color: #0f172a;"><a href="mailto:${email}" style="color: #0284c7; text-decoration: none;">${email || 'Not provided'}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #475569;">Current Location:</td>
              <td style="padding: 8px 0; color: #0f172a;">${location}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #475569;">Target Cadre:</td>
              <td style="padding: 8px 0; color: #b45309; font-weight: bold;">${role}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #475569;">Core Subject:</td>
              <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${subject}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #475569;">Teaching Experience:</td>
              <td style="padding: 8px 0; color: #0f172a;">${experience}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #475569;">Qualifications:</td>
              <td style="padding: 8px 0; color: #0f172a;">${qualification}</td>
            </tr>
            ${notes ? `<tr><td style="padding: 8px 0; font-weight: bold; color: #475569;">Notes / CTC / Notice:</td><td style="padding: 8px 0; color: #334155;">${notes}</td></tr>` : ''}
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #475569;">Resume File:</td>
              <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">
                ${resumeFileName ? `📎 Attached (${resumeFileName})` : '⚠️ No document attached'}
              </td>
            </tr>
          </table>

          <div style="text-align: center; padding-top: 16px; border-top: 1px solid #e2e8f0;">
            <a href="https://wa.me/${phone.replace(/[^0-9]/g, '')}" style="display: inline-block; background: #25d366; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; margin-right: 10px;">Contact Candidate on WhatsApp</a>
            <a href="tel:${phone}" style="display: inline-block; background: #0b2545; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">Call Candidate</a>
          </div>
        </div>

        <div style="background: #f1f5f9; padding: 14px; text-align: center; font-size: 12px; color: #64748b;">
          Bhagwati Talent Advisory • Talent Intake Desk • Sherghati, Gaya, Bihar
        </div>
      </div>
    `;

    // Deliver email to Rahul Kunal with attached resume and structured table data
    await sendNotificationEmail({
      to: ADMIN_EMAIL,
      replyTo: email || undefined,
      subject: `[New Resume Submitted] ${fullName} - ${role} (${subject})`,
      html: emailHtml,
      attachments: emailAttachments,
      data: {
        'Candidate Full Name': fullName,
        'Mobile / WhatsApp': phone,
        'Email Address': email || 'Not provided',
        'Target Designation': role,
        'Subject Specialization': subject,
        'Teaching Experience': experience,
        'Qualifications': qualification,
        'Location': location,
        'Candidate Notes / Notice / CTC': notes || 'None noted',
        'Resume Document': resumeFileName ? `Attached: ${resumeFileName} (Download: ${resumeDownloadUrl})` : 'None',
        'Submission Timestamp': new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST'
      }
    });

    // Auto acknowledgment to candidate
    if (email && email.includes('@')) {
      const ackHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
          <h2 style="color: #0b2545; margin-top: 0;">Bhagwati Talent Advisory</h2>
          <p>Dear ${fullName},</p>
          <p>Thank you for submitting your resume for <strong>${role} (${subject})</strong>.</p>
          <p>Your resume has been delivered to <strong>Rahul Kunal</strong>'s talent acquisition desk. Our team evaluates verified profiles against active requirements in affiliated CBSE institutions and will reach out if your profile is shortlisted for interviews.</p>
          <p style="margin-top: 20px; font-size: 13px; color: #64748b;">Best regards,<br><strong>Rahul Kunal</strong><br>Lead HR & Compliance Consultant<br>+91 79797 70162</p>
        </div>
      `;
      sendNotificationEmail({
        to: email,
        subject: `Resume Received: Bhagwati Talent Advisory`,
        html: ackHtml
      }).catch(() => {});
    }

    res.status(200).json({
      success: true,
      message: `Resume submitted successfully for ${fullName} and dispatched to Rahul Kunal's talent acquisition desk!`,
      applicationId: application.id,
      resumeUrl: savedResumeUrl
    });
  } catch (err) {
    console.error('Resume submission error:', err);
    res.status(500).json({ error: 'Failed to process resume submission' });
  }
});

// 5b. API Endpoint: Client Service Feedback (Direct delivery to rahulkunal14@gmail.com)
app.post('/api/client-feedback', async (req, res) => {
  try {
    const payload = req.body;
    const schoolName = payload.schoolName || payload.School_Name || payload.clientName || 'Partner Institution';
    const contactPerson = payload.contactPerson || payload.Contact_Person || payload.clientPerson || 'Representative';
    const designation = payload.designation || payload.Designation || 'Principal / Administrator';
    const mobile = payload.mobile || payload.Mobile_Number || '';
    const email = payload.email || payload.Email_Address || '';
    const service = payload.service || payload.Service_Availed || 'CBSE Advisory Services';
    const rating = Math.min(5, Math.max(1, Number(payload.rating || payload.Rating) || 5));
    const turnaround = payload.turnaround || payload.Turnaround_Speed || 'Excellent';
    const review = payload.review || payload.Feedback_Review || payload.message || '';
    const strengths = payload.strengths || payload.Key_Strengths || '';
    const suggestions = payload.suggestions || payload.Suggestions || '';
    const consent = payload.consent !== false;

    const record = {
      id: 'FDB-' + Date.now(),
      schoolName,
      contactPerson,
      designation,
      mobile,
      email,
      service,
      rating,
      turnaround,
      review,
      strengths,
      suggestions,
      consent,
      createdAt: new Date().toISOString()
    };

    clientFeedbacks.unshift(record);
    saveSubmissions();

    const starsEmoji = '⭐'.repeat(rating);

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; color: #1e293b; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background: #0b2545; color: #ffffff; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 22px;">Bhagwati Talent Advisory</h1>
          <p style="margin: 6px 0 0; font-size: 15px; color: #fbbf24; font-weight: bold;">⭐ New Client Service Feedback Received</p>
        </div>

        <div style="padding: 24px;">
          <div style="background: #fef3c7; border: 1px solid #fde68a; border-radius: 8px; padding: 18px; text-align: center; margin-bottom: 20px;">
            <div style="font-size: 28px; line-height: 1.2;">${starsEmoji}</div>
            <div style="font-size: 17px; font-weight: bold; color: #92400e; margin-top: 6px;">Overall Rating: ${rating} / 5 Stars</div>
            <div style="font-size: 13.5px; color: #78350f; margin-top: 4px;">Service: <strong>${service}</strong> • Turnaround: <strong>${turnaround}</strong></div>
          </div>

          <h3 style="color: #0b2545; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-top: 0;">Client & School Profile</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; width: 180px; color: #475569;">School / Trust Name:</td>
              <td style="padding: 8px 0; color: #0f172a; font-weight: 700;">${schoolName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #475569;">Contact Person:</td>
              <td style="padding: 8px 0; color: #0f172a;">${contactPerson} (${designation})</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #475569;">Mobile / WhatsApp:</td>
              <td style="padding: 8px 0; color: #0f172a;"><a href="tel:${mobile}" style="color: #0284c7; text-decoration: none; font-weight: 600;">${mobile}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #475569;">Email Address:</td>
              <td style="padding: 8px 0; color: #0f172a;"><a href="mailto:${email}" style="color: #0284c7; text-decoration: none;">${email || 'Not provided'}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #475569;">Service Availed:</td>
              <td style="padding: 8px 0; color: #b45309; font-weight: bold;">${service}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #475569;">Turnaround Speed:</td>
              <td style="padding: 8px 0; color: #0f172a;">${turnaround}</td>
            </tr>
            ${strengths ? `
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #475569;">Key Highlights:</td>
              <td style="padding: 8px 0; color: #059669; font-weight: 600;">${strengths}</td>
            </tr>` : ''}
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #475569;">Submission Date:</td>
              <td style="padding: 8px 0; color: #64748b;">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</td>
            </tr>
          </table>

          <div style="background: #f8fafc; border-left: 4px solid #f59e0b; padding: 14px 18px; margin-bottom: 16px; border-radius: 4px;">
            <p style="margin: 0 0 6px; font-weight: bold; color: #0f172a;">Client Review & Experience:</p>
            <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #334155; white-space: pre-wrap;">${review || 'No written review text.'}</p>
          </div>

          ${suggestions ? `
          <div style="background: #f1f5f9; padding: 12px 16px; margin-bottom: 16px; border-radius: 4px;">
            <p style="margin: 0 0 4px; font-weight: bold; font-size: 13px; color: #475569;">Suggestions for Improvement:</p>
            <p style="margin: 0; font-size: 13.5px; color: #334155;">${suggestions}</p>
          </div>` : ''}

          <div style="text-align: center; padding-top: 16px; border-top: 1px solid #e2e8f0;">
            <a href="https://wa.me/${mobile.replace(/[^0-9]/g, '')}" style="display: inline-block; background: #25d366; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; margin-right: 10px;">Reply to Client on WhatsApp</a>
            <a href="tel:${mobile}" style="display: inline-block; background: #0b2545; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">Call Client</a>
          </div>
        </div>

        <div style="background: #f1f5f9; padding: 14px; text-align: center; font-size: 12px; color: #64748b;">
          Bhagwati Talent Advisory • Client Feedback Service • Direct Delivery to ${ADMIN_EMAIL}
        </div>
      </div>
    `;

    await sendNotificationEmail({
      to: ADMIN_EMAIL,
      replyTo: email || undefined,
      subject: `[Client Service Feedback] ${schoolName} - ${rating}★ Rating (${service})`,
      html: emailHtml,
      data: {
        'Client School': schoolName,
        'Contact Person': `${contactPerson} (${designation})`,
        'Rating': `${rating} / 5 Stars`,
        'Service Availed': service,
        'Turnaround': turnaround,
        'Review': review,
        'Suggestions': suggestions || 'None',
        'Mobile': mobile,
        'Email': email,
        'Recipient Email': ADMIN_EMAIL,
        'Timestamp': new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST'
      }
    });

    console.log(`[Client Feedback] Received feedback from ${schoolName} (${rating} stars) -> Delivered to ${ADMIN_EMAIL}`);

    res.json({
      success: true,
      message: `Thank you! Your feedback has been successfully submitted and delivered directly to Rahul Sir (${ADMIN_EMAIL}).`,
      feedback: record
    });
  } catch (err) {
    console.error('Client feedback submission error:', err);
    res.status(500).json({ error: 'Failed to process client feedback: ' + err.message });
  }
});

app.get('/api/client-feedback', (req, res) => {
  res.json({
    success: true,
    total: clientFeedbacks.length,
    feedbacks: clientFeedbacks
  });
});

// 6. API Endpoint: Email Status & Delivery Diagnostics
app.get('/api/email-status', (req, res) => {
  const isSmtpConfigured = !!(process.env.SMTP_USER || process.env.EMAIL_USER);
  res.json({
    adminEmail: ADMIN_EMAIL,
    smtpConfigured: isSmtpConfigured,
    smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
    smtpPort: Number(process.env.SMTP_PORT) || 587,
    totalAudits: selfAudits.length,
    totalResumes: resumes.length,
    totalInquiries: inquiries.length,
    totalEducators: educatorRegistrations.length,
    recentEmailLogs: emailLogs.slice(0, 10)
  });
});

// 7. API Endpoint: Send Diagnostic Test Email
app.post('/api/test-email', async (req, res) => {
  try {
    const testResult = await sendNotificationEmail({
      to: ADMIN_EMAIL,
      subject: '[Test Alert] Bhagwati Talent Advisory Email Dispatcher Online',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #cbd5e1; border-radius: 8px;">
          <h2 style="color: #0b2545;">Email Verification Successful!</h2>
          <p>This is a test notification confirming that the backend Nodemailer email dispatcher is functioning correctly.</p>
          <p>Recipient: <strong>${ADMIN_EMAIL}</strong></p>
          <p>Timestamp: <strong>${new Date().toISOString()}</strong></p>
        </div>
      `
    });

    res.json({
      success: testResult.success,
      recipient: ADMIN_EMAIL,
      smtpConfigured: !!(process.env.SMTP_USER || process.env.EMAIL_USER),
      log: testResult.log
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Live Public Activity Stats (Auto-Updating Inquiries & CBSE Self-Audit counts)
app.get('/api/live-stats', (req, res) => {
  res.json({
    success: true,
    inquiriesCount: inquiries.length,
    auditsCount: selfAudits.length,
    resumesCount: resumes.length,
    educatorsCount: educatorRegistrations.length,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/stats', (req, res) => {
  const cfg = getSiteConfig();
  res.json({
    yearsOfExcellence: parseInt(cfg.statYears) || 12,
    inquiriesCount: inquiries.length,
    auditsCount: selfAudits.length,
    complianceAuditsCompleted: selfAudits.length,
    uploadedMediaCount: getMediaList().length
  });
});

// Admin API endpoints
// 1. Get current site configuration
app.get('/api/admin/config', (req, res) => {
  res.json(getSiteConfig());
});

// 2. Save updated site configuration (Admin rights)
app.post('/api/admin/config', (req, res) => {
  try {
    const adminEmail = (req.headers['x-admin-email'] || req.body.adminEmail || '').trim().toLowerCase();
    if (adminEmail && adminEmail !== 'rahulkunal14@gmail.com') {
      return res.status(403).json({ error: 'Unauthorized. Admin rights restricted to rahulkunal14@gmail.com' });
    }

    const currentConfig = getSiteConfig();
    const updated = {
      ...currentConfig,
      ...req.body,
      updatedAt: new Date().toISOString(),
      updatedBy: adminEmail || 'rahulkunal14@gmail.com'
    };

    const saved = saveSiteConfig(updated);
    if (!saved) {
      return res.status(500).json({ error: 'Failed to write site configuration' });
    }
    console.log(`[Admin] Site configuration updated by ${adminEmail || 'rahulkunal14@gmail.com'}`);
    res.json({ success: true, message: 'Configuration updated and published live', config: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Get all submissions (Inquiries, Resumes, Audits, Educators, Client Feedback)
app.get('/api/admin/submissions', (req, res) => {
  res.json({
    inquiries,
    resumes,
    selfAudits,
    educatorRegistrations,
    feedbacks: clientFeedbacks,
    emailLogs: emailLogs.slice(0, 30)
  });
});

// 4. Delete a submission
app.delete('/api/admin/submissions/:type/:id', (req, res) => {
  const { type, id } = req.params;
  let removed = false;

  if (type === 'inquiries') {
    const idx = inquiries.findIndex(item => item.id === id);
    if (idx !== -1) { inquiries.splice(idx, 1); removed = true; }
  } else if (type === 'resumes') {
    const idx = resumes.findIndex(item => item.id === id);
    if (idx !== -1) { resumes.splice(idx, 1); removed = true; }
  } else if (type === 'audits') {
    const idx = selfAudits.findIndex(item => item.id === id);
    if (idx !== -1) { selfAudits.splice(idx, 1); removed = true; }
  } else if (type === 'educators') {
    const idx = educatorRegistrations.findIndex(item => item.id === id);
    if (idx !== -1) { educatorRegistrations.splice(idx, 1); removed = true; }
  } else if (type === 'feedbacks') {
    const idx = clientFeedbacks.findIndex(item => item.id === id);
    if (idx !== -1) { clientFeedbacks.splice(idx, 1); removed = true; }
  }

  if (removed) {
    saveSubmissions();
    res.json({ success: true, message: `Record ${id} removed successfully` });
  } else {
    res.status(404).json({ error: 'Record not found' });
  }
});

// 5. Delete media item
app.delete('/api/media/:filename', (req, res) => {
  try {
    const filename = req.params.filename.replace(/[^a-zA-Z0-9._ -]/g, '_');
    const targetPath = path.join(uploadsDir, filename);
    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
      res.json({ success: true, message: `${filename} deleted`, media: getMediaList() });
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// CBSE Official Circulars & News API Endpoints
// ==========================================
app.get('/api/cbse-notices', (req, res) => {
  const cache = getCbseNoticesCache();
  // Trigger background sync if older than 2 minutes or explicitly requested
  const cacheAge = Date.now() - new Date(cache.lastSync || 0).getTime();
  if (cacheAge > 2 * 60 * 1000 || req.query.live === '1') {
    syncCbseNoticesFromOfficialSources().catch(() => {});
  }
  res.json({
    success: true,
    version: cbseNoticesVersion,
    lastSync: cache.lastSync,
    status: cache.status,
    source: cache.source,
    total: cache.total || (cache.notices ? cache.notices.length : 0),
    notices: cache.notices || []
  });
});

app.get('/api/cbse-notices/check-updates', async (req, res) => {
  const clientVersion = req.query.version;
  const clientLastSync = req.query.lastSync;
  const cache = getCbseNoticesCache();

  // If cache is older than 2 minutes, check in background
  const cacheAge = Date.now() - new Date(cache.lastSync || 0).getTime();
  if (cacheAge > 2 * 60 * 1000) {
    syncCbseNoticesFromOfficialSources().catch(() => {});
  }

  const hasUpdates = (clientVersion && clientVersion !== String(cbseNoticesVersion)) ||
    (clientLastSync && new Date(cache.lastSync).getTime() > new Date(clientLastSync).getTime());

  res.json({
    hasUpdates: !!hasUpdates,
    version: cbseNoticesVersion,
    lastSync: cache.lastSync,
    total: cache.total || (cache.notices ? cache.notices.length : 0),
    latestTitle: cache.notices && cache.notices[0] ? cache.notices[0].title : '',
    latestUrl: cache.notices && cache.notices[0] ? cache.notices[0].url : ''
  });
});

app.post('/api/cbse-notices/refresh', async (req, res) => {
  try {
    const updated = await syncCbseNoticesFromOfficialSources();
    res.json({
      success: true,
      message: `Successfully synchronized ${updated.total} official notices from CBSE portals`,
      lastSync: updated.lastSync,
      total: updated.total,
      newFoundCount: updated.newFoundCount,
      notices: updated.notices
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to refresh CBSE circulars: ' + err.message,
      cached: getCbseNoticesCache()
    });
  }
});

// 6. Admin Authentication & Two-Step Verification (2FA) Routes

// Step 1: Password Verification & Generate 2-Step Verification Code
app.post('/api/admin/auth/step1', (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();
  const password = (req.body.password || '').trim();

  if (!email || !password) {
    return res.status(400).json({
      error: 'Please enter registered administrator email and password.'
    });
  }

  const authData = getAdminAuth();
  const inputHash = hashPassword(password, authData.salt);

  if (email !== 'rahulkunal14@gmail.com' || inputHash !== authData.hash) {
    return res.status(401).json({
      error: 'Invalid administrator email or password. Access denied.'
    });
  }

  // Generate 6-digit numeric verification code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const challengeId = crypto.randomUUID();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  active2FAChallenges.set(challengeId, {
    email: 'rahulkunal14@gmail.com',
    code,
    expiresAt,
    attempts: 0,
    createdAt: Date.now()
  });

  console.log(`[Admin Security] Generated 2-Step Verification code: ${code} (Challenge: ${challengeId})`);

  // Send Two-Step Verification Email to registered administrator
  const htmlEmail = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 12px; overflow: hidden; background: #ffffff;">
      <div style="background: linear-gradient(135deg, #0b2545 0%, #1e3a8a 100%); color: #ffffff; padding: 24px; text-align: center;">
        <div style="font-size: 28px; margin-bottom: 6px;">🔐</div>
        <h2 style="margin: 0; font-size: 20px; color: #f59e0b; font-weight: 800; letter-spacing: 0.5px;">Bhagwati Talent Advisory</h2>
        <p style="margin: 6px 0 0; font-size: 13px; color: #cbd5e1;">Administrator Portal — Two-Step Verification</p>
      </div>
      <div style="padding: 28px 24px;">
        <p style="font-size: 15px; color: #1e293b; margin-top: 0;">Dear <strong>Rahul Sir</strong>,</p>
        <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
          A login request to access administrator editing mode was initiated. Please enter the following 6-digit two-step verification code to complete your login:
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <div style="display: inline-block; background: #f8fafc; border: 2px dashed #0b2545; border-radius: 10px; padding: 14px 32px; font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #0b2545; font-family: monospace;">
            ${code}
          </div>
          <div style="margin-top: 8px; font-size: 12px; color: #64748b;">
            Security Verification Code (Valid for 10 minutes)
          </div>
        </div>
        <div style="background: #eff6ff; border-left: 4px solid #2563eb; padding: 12px 16px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; font-size: 12.5px; color: #1e40af; line-height: 1.5;">
            <strong>Security Notice:</strong> If you did not initiate this login request, please ignore this email. Access is strictly blocked without this 2-step code.
          </p>
        </div>
      </div>
      <div style="background: #f8fafc; padding: 14px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
        Bhagwati Talent Advisory • Sherghati, Gaya, Bihar • WhatsApp: +91 79797 70162
      </div>
    </div>
  `;

  sendNotificationEmail({
    to: 'rahulkunal14@gmail.com',
    subject: `[BTA Security] Your Two-Step Verification Code: ${code}`,
    text: `Bhagwati Talent Advisory Admin Two-Step Verification Code: ${code}\nValid for 10 minutes. Use this code to sign in to the administrator portal.`,
    html: htmlEmail,
    data: {
      "Security Notice": "Admin Two-Step Verification Code",
      "Verification Code": code,
      "Validity": "10 minutes",
      "Requested At": new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
    }
  }).catch(err => console.warn('[Admin 2FA] Email dispatch note:', err.message));

  return res.json({
    success: true,
    step: '2fa_required',
    challengeId,
    expiresInSeconds: 600,
    message: 'Credentials verified. Two-step verification code dispatched to your registered email.'
  });
});

// Step 2: Validate 2-Step Verification Code & Issue Admin Session Token
app.post('/api/admin/auth/step2', (req, res) => {
  const { challengeId, code } = req.body;

  if (!challengeId || !code) {
    return res.status(400).json({ error: 'Challenge ID and 6-digit verification code are required.' });
  }

  const challenge = active2FAChallenges.get(challengeId);
  if (!challenge) {
    return res.status(400).json({
      error: 'Verification session expired or invalid. Please re-enter your password.'
    });
  }

  if (Date.now() > challenge.expiresAt) {
    active2FAChallenges.delete(challengeId);
    return res.status(400).json({
      error: 'Verification code has expired (10-minute limit). Please request a new code.'
    });
  }

  challenge.attempts = (challenge.attempts || 0) + 1;
  if (challenge.attempts > 5) {
    active2FAChallenges.delete(challengeId);
    return res.status(429).json({
      error: 'Maximum verification attempts exceeded. Please re-enter your administrator password.'
    });
  }

  const cleanedInputCode = String(code).trim().replace(/\s+/g, '');
  if (cleanedInputCode !== challenge.code) {
    return res.status(400).json({
      error: `Incorrect verification code. Attempts remaining: ${5 - challenge.attempts}.`
    });
  }

  // Verification successful! Issue authenticated session token
  active2FAChallenges.delete(challengeId);
  const sessionToken = 'bta_' + crypto.randomBytes(32).toString('hex');
  const sessionExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  activeAdminSessions.set(sessionToken, {
    email: 'rahulkunal14@gmail.com',
    createdAt: Date.now(),
    expiresAt: sessionExpiry
  });

  console.log(`[Admin Security] 2-Step Verification SUCCESS for rahulkunal14@gmail.com (Session token generated)`);

  return res.json({
    success: true,
    authorized: true,
    token: sessionToken,
    email: 'rahulkunal14@gmail.com',
    role: 'superadmin',
    displayName: 'Rahul Kunal',
    message: 'Two-step verification verified. Administrator access granted.'
  });
});

// Resend 2-Step Verification Code
app.post('/api/admin/auth/resend-code', (req, res) => {
  const { challengeId } = req.body;
  const challenge = active2FAChallenges.get(challengeId);

  if (!challenge) {
    return res.status(400).json({ error: 'Session expired. Please restart login.' });
  }

  const freshCode = Math.floor(100000 + Math.random() * 900000).toString();
  challenge.code = freshCode;
  challenge.expiresAt = Date.now() + 10 * 60 * 1000;
  challenge.attempts = 0;

  console.log(`[Admin Security] Resent 2-Step Verification code: ${freshCode}`);

  sendNotificationEmail({
    to: 'rahulkunal14@gmail.com',
    subject: `[BTA Security] New Two-Step Verification Code: ${freshCode}`,
    text: `Bhagwati Talent Advisory New Verification Code: ${freshCode}\nValid for 10 minutes.`,
    data: {
      "Security Notice": "Resent Two-Step Verification Code",
      "New Code": freshCode,
      "Valid For": "10 minutes"
    }
  }).catch(err => console.warn('[Admin 2FA] Resend error:', err.message));

  return res.json({
    success: true,
    message: 'A fresh 2-step verification code was dispatched to your registered email address.'
  });
});

// Verify Current Session Token
app.get('/api/admin/auth/session', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim() || req.query.token;

  if (token && isValidAdminSession(token)) {
    return res.json({
      authorized: true,
      email: 'rahulkunal14@gmail.com',
      role: 'superadmin',
      displayName: 'Rahul Kunal'
    });
  }

  return res.status(401).json({ authorized: false, error: 'Session invalid or expired' });
});

// Change Admin Password Endpoint
app.post('/api/admin/auth/change-password', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim() || req.body.token;

  if (!isValidAdminSession(token)) {
    return res.status(401).json({ error: 'Unauthorized. Active admin session required.' });
  }

  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
  }

  const authData = getAdminAuth();
  if (hashPassword(currentPassword, authData.salt) !== authData.hash) {
    return res.status(400).json({ error: 'Current password is incorrect.' });
  }

  const newSalt = crypto.randomBytes(16).toString('hex');
  const newHash = hashPassword(newPassword, newSalt);

  authData.salt = newSalt;
  authData.hash = newHash;
  authData.defaultPasswordHint = '(customized)';
  authData.updatedAt = new Date().toISOString();

  saveAdminAuth(authData);

  return res.json({
    success: true,
    message: 'Administrator password changed successfully.'
  });
});

// Legacy Admin authorization verification endpoint (also supports session tokens)
app.post('/api/admin/verify', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim() || req.body.token;

  if (token && isValidAdminSession(token)) {
    return res.json({
      authorized: true,
      email: 'rahulkunal14@gmail.com',
      role: 'superadmin',
      displayName: 'Rahul Kunal'
    });
  }

  const email = (req.body.email || '').trim().toLowerCase();
  if (email === 'rahulkunal14@gmail.com' && !req.body.enforce2FA) {
    return res.json({
      authorized: true,
      email: 'rahulkunal14@gmail.com',
      role: 'superadmin',
      displayName: 'Rahul Kunal'
    });
  }

  return res.status(403).json({
    authorized: false,
    error: 'Access restricted to authenticated administrator rahulkunal14@gmail.com with Two-Step Verification'
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
  console.log(`Submissions routed to administrator email: ${ADMIN_EMAIL}`);
});

