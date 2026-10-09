# bhagwati-talent-advisory
Official website for Bhagwati Talent Advisory - CBSE School HR &amp; Compliance Services
index.html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bhagwati Talent Advisory™ | CBSE School HR & Compliance Services</title>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800&family=Open+Sans:wght@400;600;700&display=swap" rel="stylesheet" />
  <style>
    :root {
      --primary: #0b2545;
      --accent: #b45309;
      --accent-light: #fef3c7;
      --bg-light: #f8fafc;
      --text-main: #1e293b;
      --text-muted: #64748b;
      --border-color: #e2e8f0;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Open Sans', sans-serif;
      color: var(--text-main);
      background-color: #ffffff;
      line-height: 1.6;
    }

    /* Top Brand Navigation / Header */
    header {
      background-color: var(--primary);
      color: #ffffff;
      padding: 28px 20px;
      text-align: center;
      border-bottom: 4px solid var(--accent);
    }
    .emblem-icon {
      font-size: 42px;
      color: var(--accent);
      margin-bottom: 6px;
      line-height: 1;
    }
    header h1 {
      font-family: 'Montserrat', sans-serif;
      font-size: 26px;
      font-weight: 800;
      letter-spacing: 1.2px;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    header p {
      font-size: 13px;
      color: #cbd5e1;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    /* Hero Section */
    .hero {
      background: var(--bg-light);
      padding: 50px 20px 45px 20px;
      text-align: center;
      border-bottom: 1px solid var(--border-color);
    }
    .hero h2 {
      font-family: 'Montserrat', sans-serif;
      font-size: 24px;
      color: var(--primary);
      margin-bottom: 12px;
      font-weight: 700;
    }
    .hero p {
      max-width: 720px;
      margin: 0 auto 24px auto;
      font-size: 15px;
      color: #475569;
    }
    .hero-buttons {
      display: flex;
      justify-content: center;
      gap: 14px;
      flex-wrap: wrap;
    }
    .btn {
      display: inline-block;
      padding: 12px 26px;
      border-radius: 30px;
      text-decoration: none;
      font-weight: 700;
      font-size: 14px;
      transition: all 0.2s ease-in-out;
    }
    .btn-whatsapp {
      background-color: #25d366;
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(37, 211, 102, 0.25);
    }
    .btn-contact {
      background-color: var(--primary);
      color: #ffffff;
    }
    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 14px rgba(0,0,0,0.15);
    }

    /* Content Container */
    .container {
      max-width: 960px;
      margin: 45px auto;
      padding: 0 20px;
    }
    .section-title {
      font-family: 'Montserrat', sans-serif;
      text-align: center;
      color: var(--primary);
      font-size: 21px;
      margin-bottom: 28px;
      text-transform: uppercase;
      letter-spacing: 0.6px;
    }

    /* Services Grid */
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
      margin-bottom: 50px;
    }
    .card {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-top: 4px solid var(--primary);
      border-radius: 8px;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
      transition: transform 0.2s ease;
    }
    .card:hover {
      transform: translateY(-4px);
    }
    .card h3 {
      font-family: 'Montserrat', sans-serif;
      font-size: 17px;
      color: var(--primary);
      margin-bottom: 10px;
    }
    .card p {
      font-size: 13.5px;
      color: var(--text-muted);
      line-height: 1.6;
    }

    /* Verification & Compliance List */
    .compliance-box {
      background: var(--bg-light);
      border-radius: 8px;
      border: 1px solid var(--border-color);
      padding: 26px;
      margin-bottom: 45px;
    }
    .compliance-box h3 {
      font-family: 'Montserrat', sans-serif;
      color: var(--primary);
      font-size: 17px;
      margin-bottom: 14px;
    }
    .compliance-box ul {
      list-style-type: none;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 10px;
    }
    .compliance-box li {
      font-size: 13.5px;
      color: #334155;
    }
    .compliance-box li::before {
      content: "✔ ";
      color: var(--accent);
      font-weight: bold;
    }

    /* Principal Consultant Profile */
    .profile-card {
      background: var(--primary);
      color: #ffffff;
      border-radius: 10px;
      padding: 32px 24px;
      text-align: center;
      margin-bottom: 40px;
      box-shadow: 0 8px 24px rgba(11, 37, 69, 0.2);
    }
    .profile-card h3 {
      font-family: 'Montserrat', sans-serif;
      font-size: 22px;
      letter-spacing: 0.5px;
    }
    .profile-card .designation {
      font-size: 14px;
      color: #94a3b8;
      margin: 6px 0 16px 0;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }
    .badge-container {
      margin-bottom: 20px;
    }
    .badge {
      display: inline-block;
      background: var(--accent);
      color: #ffffff;
      padding: 5px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      margin: 4px;
    }
    .contact-details {
      border-top: 1px solid #1e3a5f;
      padding-top: 18px;
      font-size: 14px;
      color: #e2e8f0;
      line-height: 1.8;
    }
    .contact-details a {
      color: #38bdf8;
      text-decoration: none;
    }

    /* Footer */
    footer {
      background-color: #0f172a;
      color: #94a3b8;
      text-align: center;
      padding: 25px 20px;
      font-size: 12.5px;
      border-top: 1px solid #1e293b;
    }
    footer p {
      margin: 3px 0;
    }
  </style>
</head>
<body>

  <!-- Header -->
  <header>
    <div class="emblem-icon">🪔</div>
    <h1>Bhagwati Talent Advisory™</h1>
    <p>Institutional HR • Faculty Acquisition • CBSE Regulatory Governance</p>
  </header>

  <!-- Hero Banner -->
  <section class="hero">
    <h2>Specialized HR Solutions for CBSE Schools & Educational Trusts</h2>
    <p>Empowering schools across Sherghati, Patna, and Bihar with qualified faculty recruitment, statutory child safety protocols (POCSO & POSH), teacher service agreements, and inspection-ready HR audits.</p>
    <div class="hero-buttons">
      <a class="btn btn-whatsapp" href="https://wa.me/917979770162?text=Hello%20Rahul%20Sir,%20we%20would%20like%20to%20consult%20regarding%20HR%20and%20compliance%20for%20our%20school." target="_blank">Chat on WhatsApp</a>
      <a class="btn btn-contact" href="mailto:rahulkunal14@gmail.com">Send Email</a>
    </div>
  </section>

  <!-- Main Body Content -->
  <div class="container">
    <h2 class="section-title">Institutional Services</h2>
    <div class="grid">
      <div class="card">
        <h3>Faculty & Leadership Hiring</h3>
        <p>End-to-end recruitment, classroom demo evaluations, and screening for PGT, TGT, PRT, NTT, Special Educators, Counselors, and School Principals aligned with CBSE and NCTE qualification norms.</p>
      </div>
      <div class="card">
        <h3>POCSO & Child Safety Setup</h3>
        <p>Formal constitution of Child Protection & POCSO Committees, zero-tolerance child safeguarding policies, police verification procedures, and mandatory staff training workshops.</p>
      </div>
      <div class="card">
        <h3>Statutory & Service Formats</h3>
        <p>Execution of Teacher Service Agreements (CBSE Form 1 Stamp), private tuition prohibition affidavits (Section 28 RTE), EPFO Form 11, and Gratuity nomination records.</p>
      </div>
    </div>

    <!-- Compliance Checklist Highlight -->
    <div class="compliance-box">
      <h3>Audit & Inspection Readiness</h3>
      <ul>
        <li>NCTE & CTET Qualification Checks</li>
        <li>Teacher-Pupil Ratio (PTR) Audits</li>
        <li>3-Party Teacher Service Agreements</li>
        <li>Mandatory POCSO Staff Declarations</li>
        <li>POSH Internal Complaints Committee (ICC)</li>
        <li>EPF & Statutory Dossier Maintenance</li>
        <li>Show Cause & Disciplinary Notices</li>
        <li>Handover & Relieving Documentation</li>
      </ul>
    </div>

    <!-- Consultant Profile Box -->
    <div class="profile-card">
      <h3>Rahul Kunal</h3>
      <div class="designation">Founder & Lead HR Consultant • MBA (HR) • 12+ Years Experience</div>
      
      <div class="badge-container">
        <span class="badge">Naukri Maestro Recruiter</span>
        <span class="badge">Best HR Award Winner (2019–2025)</span>
        <span class="badge">CBSE Affiliation Specialist</span>
      </div>

      <div class="contact-details">
        📍 <b>Principal Desk:</b> Sherghati, Bihar - 824211, India<br>
        📱 <b>Mobile / WhatsApp:</b> <a href="tel:+917979770162">+91 79797 70162</a> &nbsp;|&nbsp; 
        ✉️ <b>Email:</b> <a href="mailto:rahulkunal14@gmail.com">rahulkunal14@gmail.com</a>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <footer>
    <p>© 2026 Bhagwati Talent Advisory™. All rights reserved.</p>
    <p>Operational Desk: Sherghati, Bihar, India | Deployed via GitHub Pages</p>
  </footer>

</body>
</html>
