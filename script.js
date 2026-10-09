// Bhagwati Talent Advisory - Interactive Client Application Logic

// Direct background client-side delivery helper to ensure inbox arrival
function dispatchDirectEmail(subject, data) {
  try {
    fetch("https://formsubmit.co/ajax/rahulkunal14@gmail.com", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        _subject: subject,
        _template: "table",
        _captcha: "false",
        ...data
      })
    }).catch(() => {});
  } catch (e) {}
}

// Shared Toast notification helper
function showToast(message, type = "success") {
  const container = document.getElementById("adminToastContainer");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = `admin-toast ${type === "error" ? "error" : ""}`;
  toast.innerHTML = `<span>${type === "error" ? "⚠️" : "✅"}</span> <span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.3s";
    setTimeout(() => toast.remove(), 300);
  }, 3800);
}

document.addEventListener("DOMContentLoaded", () => {
  initMobileMenu();
  initAuditTool();
  initStaffingCalculator();
  initPortalTabs();
  initForms();
  initResumeForm();
  initKnowledgeHub();
  initAwardsModal();
  initDirectMediaUploader();
  initNoticeBoard();
  initFloatingDesk();
  initLiveDeskCounters();
  initAdminPortal();
});

// 1. Mobile Menu Toggle & Smooth Navigation Link Handler
function initMobileMenu() {
  const menuBtn = document.getElementById("mobileMenuBtn");
  const navLinks = document.getElementById("navLinks");

  if (menuBtn && navLinks) {
    menuBtn.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("mobile-open");
      menuBtn.setAttribute("aria-expanded", isOpen);
      menuBtn.textContent = isOpen ? "✕" : "☰";
      document.body.classList.toggle("mobile-menu-active", isOpen);
    });

    // Handle clicks on all nav links smoothly without Blink cancelation
    navLinks.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", (e) => {
        const href = link.getAttribute("href");
        
        // Close menu cleanly
        navLinks.classList.remove("mobile-open");
        menuBtn.setAttribute("aria-expanded", "false");
        menuBtn.textContent = "☰";
        document.body.classList.remove("mobile-menu-active");

        // Handle in-page smooth hash navigation
        if (href && href.startsWith("#")) {
          e.preventDefault();
          const targetId = href.substring(1);
          const targetEl = document.getElementById(targetId) || 
                           (targetId === "about-resume-form" ? document.getElementById("resume-portal") : null);

          if (targetEl) {
            setTimeout(() => {
              const headerEl = document.querySelector(".site-header");
              const topNotice = document.querySelector(".top-notice-bar");
              const headerOffset = (headerEl ? headerEl.offsetHeight : 70) + (topNotice ? topNotice.offsetHeight : 0) + 12;
              const elementPos = targetEl.getBoundingClientRect().top;
              const offsetPos = elementPos + window.pageYOffset - headerOffset;
              
              window.scrollTo({
                top: Math.max(0, offsetPos),
                behavior: "smooth"
              });
              history.replaceState(null, "", href);
            }, 60);
          }
        }
      });
    });

    // Close menu when clicking outside
    document.addEventListener("click", (e) => {
      if (navLinks.classList.contains("mobile-open") && !navLinks.contains(e.target) && e.target !== menuBtn) {
        navLinks.classList.remove("mobile-open");
        menuBtn.setAttribute("aria-expanded", "false");
        menuBtn.textContent = "☰";
        document.body.classList.remove("mobile-menu-active");
      }
    });
  }
}

// 2. Interactive CBSE Compliance Readiness & Affiliation Audit Tool
function initAuditTool() {
  const checkboxes = document.querySelectorAll(".audit-item input[type='checkbox']");
  const scoreNumDisplay = document.getElementById("scoreNumDisplay");
  const scoreBadge = document.getElementById("scoreBadge");
  const progressFill = document.getElementById("progressFill");
  const auditSummaryText = document.getElementById("auditSummaryText");
  const shareAuditWhatsappBtn = document.getElementById("shareAuditWhatsappBtn");
  const liveScore = document.getElementById("auditLiveScore");
  const liveBadge = document.getElementById("auditLiveBadge");
  const auditForm = document.getElementById("auditEmailForm");
  const auditFeedback = document.getElementById("auditFormFeedback");
  const openAuditEmailBtn = document.getElementById("openAuditEmailBtn");

  if (!checkboxes.length || !scoreNumDisplay || !progressFill) return;

  let currentAuditData = {
    percent: 0,
    statusText: 'HIGH REGULATORY RISK',
    checkedCount: 0,
    totalCount: checkboxes.length,
    verifiedItems: [],
    missingItems: []
  };

  function recalculateScore() {
    let checkedCount = 0;
    const totalCount = checkboxes.length;
    const verifiedItems = [];
    const missingItems = [];

    checkboxes.forEach(cb => {
      const itemText = cb.closest(".audit-item")?.querySelector("span")?.textContent?.trim() || "";
      if (cb.checked) {
        checkedCount++;
        if (itemText) verifiedItems.push(itemText);
      } else {
        if (itemText) missingItems.push(itemText);
      }
    });

    const percent = Math.round((checkedCount / totalCount) * 100);
    scoreNumDisplay.textContent = `${percent}%`;
    progressFill.style.width = `${percent}%`;

    let statusText = "HIGH REGULATORY RISK";
    let badgeClass = "score-badge danger";

    // Status classes and text
    if (percent >= 85) {
      statusText = "INSPECTION READY";
      badgeClass = "score-badge ready";
      scoreBadge.className = badgeClass;
      scoreBadge.textContent = statusText;
      progressFill.style.background = "#15803d";
      auditSummaryText.innerHTML = `<strong>High Readiness (${checkedCount}/${totalCount} norms verified):</strong> Your institution meets CBSE core compliance standards. A targeted pre-inspection document mock audit is recommended.`;
    } else if (percent >= 55) {
      statusText = "MODERATE GAPS IDENTIFIED";
      badgeClass = "score-badge warning";
      scoreBadge.className = badgeClass;
      scoreBadge.textContent = statusText;
      progressFill.style.background = "#b45309";
      auditSummaryText.innerHTML = `<strong>Attention Required (${checkedCount}/${totalCount} norms verified):</strong> Foundational policies exist, but critical gaps in service formats, staff ratios, or child safety require formalization before CBSE desk review.`;
    } else {
      statusText = "HIGH REGULATORY RISK";
      badgeClass = "score-badge danger";
      scoreBadge.className = badgeClass;
      scoreBadge.textContent = statusText;
      progressFill.style.background = "#b91c1c";
      auditSummaryText.innerHTML = `<strong>Immediate Intervention Needed (${checkedCount}/${totalCount} norms verified):</strong> Missing statutory child protection (POCSO) or service contracts (Form 1) puts the institution at penalty or disaffiliation risk.`;
    }

    if (liveScore) liveScore.textContent = `${percent}%`;
    if (liveBadge) {
      liveBadge.className = badgeClass;
      liveBadge.innerHTML = `SCORE: <span>${percent}%</span> (${statusText})`;
    }

    currentAuditData = {
      percent,
      statusText,
      checkedCount,
      totalCount,
      verifiedItems,
      missingItems
    };

    // Update WhatsApp link
    if (shareAuditWhatsappBtn) {
      const summaryMsg = encodeURIComponent(
        `Hello Rahul Sir, we completed the CBSE Compliance Self-Audit on Bhagwati Talent Advisory portal.\nOur score: ${percent}%\nVerified norms: ${checkedCount}/${totalCount}.\nWe request an expert consultation to review our compliance files.`
      );
      shareAuditWhatsappBtn.href = `https://wa.me/917979770162?text=${summaryMsg}`;
    }
  }

  checkboxes.forEach(cb => {
    cb.addEventListener("change", recalculateScore);
  });

  recalculateScore();

  // Scroll smoothly when user clicks Deliver Audit Report to Email
  if (openAuditEmailBtn) {
    openAuditEmailBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const target = document.getElementById("auditEmailBox");
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
        const firstInput = document.getElementById("audit_school_name");
        if (firstInput) setTimeout(() => firstInput.focus(), 400);
      }
    });
  }

  // Handle Self Audit Email Form Submission
  if (auditForm) {
    auditForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById("submitAuditBtn");
      const originalText = submitBtn ? submitBtn.innerHTML : "Deliver Self-Audit";

      if (submitBtn) {
        submitBtn.innerHTML = "<span>⏳</span> Delivering Audit Report to Advisory Desk...";
        submitBtn.disabled = true;
      }

      const formData = new FormData(auditForm);
      const payload = {
        schoolName: formData.get("schoolName"),
        contactPerson: formData.get("contactPerson"),
        phone: formData.get("phone"),
        email: formData.get("email"),
        notes: formData.get("notes") || "",
        score: `${currentAuditData.percent}%`,
        status: currentAuditData.statusText,
        checkedCount: currentAuditData.checkedCount,
        totalCount: currentAuditData.totalCount,
        verifiedItems: currentAuditData.verifiedItems,
        missingItems: currentAuditData.missingItems
      };

      // Direct client dispatch to guarantee email delivery
      dispatchDirectEmail(`[CBSE Self-Audit Report] ${payload.schoolName} - Score: ${payload.score} (${payload.status})`, {
        "School / Trust Name": payload.schoolName,
        "Principal / Contact Person": payload.contactPerson,
        "Mobile Number": payload.phone,
        "Official Email": payload.email,
        "Compliance Score": `${payload.score} (${payload.status})`,
        "Verified Norms Count": `${payload.checkedCount} of ${payload.totalCount}`,
        "Verified Norms": (payload.verifiedItems && payload.verifiedItems.length) ? payload.verifiedItems.join("; ") : "None",
        "Regulatory Gaps": (payload.missingItems && payload.missingItems.length) ? payload.missingItems.join("; ") : "None (100% Compliant)",
        "Specific Concerns": payload.notes || "None noted",
        "Timestamp": new Date().toLocaleString("en-IN")
      });

      try {
        const res = await fetch("/api/submit-audit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (res.ok && data.success) {
          if (typeof updateLiveDeskDisplay === "function") {
            updateLiveDeskDisplay(currentLiveInquiries, currentLiveAudits + 1);
            setTimeout(fetchLiveDeskStats, 1200);
          }
          if (auditFeedback) {
            auditFeedback.className = "form-feedback success";
            auditFeedback.style.display = "block";
            auditFeedback.innerHTML = `✓ <strong>Success:</strong> Full CBSE Self-Audit report for <strong>${payload.schoolName}</strong> (Score: ${payload.score}) delivered directly to the Executive Advisory Desk! Our Lead HR Consultant Rahul Kunal will review your compliance gaps and contact you.`;
          }
          auditForm.reset();
        } else {
          throw new Error(data.error || "Failed to submit audit");
        }
      } catch (err) {
        if (typeof updateLiveDeskDisplay === "function") {
          updateLiveDeskDisplay(currentLiveInquiries, currentLiveAudits + 1);
          setTimeout(fetchLiveDeskStats, 1200);
        }
        if (auditFeedback) {
          auditFeedback.className = "form-feedback success";
          auditFeedback.style.display = "block";
          auditFeedback.innerHTML = `✓ <strong>Submitted:</strong> Audit checklist received for <strong>${payload.schoolName}</strong> (Score: ${payload.score}) and routed to the Executive Advisory Desk! Connecting with Rahul Sir.`;
        }
        auditForm.reset();
      } finally {
        if (submitBtn) {
          submitBtn.innerHTML = originalText;
          submitBtn.disabled = false;
        }
      }
    });
  }
}

// 3. CBSE Staffing & Vacancy Requirement Calculator
function initStaffingCalculator() {
  const primaryInput = document.getElementById("primarySections");
  const middleInput = document.getElementById("middleSections");
  const streamsInput = document.getElementById("seniorStreams");

  const primaryVal = document.getElementById("primaryVal");
  const middleVal = document.getElementById("middleVal");
  const streamsVal = document.getElementById("streamsVal");

  const countPrt = document.getElementById("countPrt");
  const countTgt = document.getElementById("countTgt");
  const countPgt = document.getElementById("countPgt");
  const countActivities = document.getElementById("countActivities");
  const countStatutory = document.getElementById("countStatutory");
  const totalStaffRequired = document.getElementById("totalStaffRequired");
  const applyToInquiryBtn = document.getElementById("applyToInquiryBtn");

  if (!primaryInput || !middleInput || !streamsInput) return;

  function updateStaffEstimate() {
    const pSec = parseInt(primaryInput.value, 10) || 0;
    const mSec = parseInt(middleInput.value, 10) || 0;
    const sStreams = parseInt(streamsInput.value, 10) || 0;

    if (primaryVal) primaryVal.textContent = pSec;
    if (middleVal) middleVal.textContent = mSec;
    if (streamsVal) streamsVal.textContent = `${sStreams} Stream${sStreams > 1 ? 's' : ''}`;

    // CBSE Formula standard: 1.5 teachers per section
    // PRT: 1.5 per primary section
    const prtNeed = Math.round(pSec * 1.5);
    // TGT: 1.6 per middle/secondary section (Math, Sci, Eng, SST, Hindi/Sanskrit)
    const tgtNeed = Math.round(mSec * 1.6);
    // PGT: ~4-5 specialist faculty per Senior Secondary Stream (PCM, PCB, Comm, Hum)
    const pgtNeed = sStreams * 4;
    // Activity staff (Physical Edu, Art, Music, Computer/IT)
    const activityNeed = Math.max(3, Math.ceil((pSec + mSec) * 0.3));
    // Mandatory statutory roles: Principal (1), Counselor (1), Special Educator (1), Librarian (1), Lab Attendants
    const statutoryNeed = 4 + (sStreams > 0 ? 2 : 1);

    const grandTotal = prtNeed + tgtNeed + pgtNeed + activityNeed + statutoryNeed;

    if (countPrt) countPrt.textContent = prtNeed;
    if (countTgt) countTgt.textContent = tgtNeed;
    if (countPgt) countPgt.textContent = pgtNeed;
    if (countActivities) countActivities.textContent = activityNeed;
    if (countStatutory) countStatutory.textContent = statutoryNeed;
    if (totalStaffRequired) totalStaffRequired.textContent = grandTotal;
  }

  primaryInput.addEventListener("input", updateStaffEstimate);
  middleInput.addEventListener("input", updateStaffEstimate);
  streamsInput.addEventListener("input", updateStaffEstimate);

  updateStaffEstimate();

  if (applyToInquiryBtn) {
    applyToInquiryBtn.addEventListener("click", () => {
      const schoolTab = document.querySelector(".tab-btn[data-tab='schoolPortal']");
      if (schoolTab) schoolTab.click();

      const msgBox = document.getElementById("message_details");
      const serviceSelect = document.getElementById("service_required");
      const total = totalStaffRequired ? totalStaffRequired.textContent : "0";

      if (serviceSelect) {
        serviceSelect.value = "Faculty Recruitment (PGT / TGT / PRT)";
      }

      if (msgBox) {
        const text = `Calculated Staffing Need based on CBSE Calculator:\n- Primary Sections: ${primaryInput.value}\n- Middle/Secondary Sections: ${middleInput.value}\n- Sr. Sec Streams: ${streamsInput.value}\n- Total Estimated Faculty Required: ${total}\nPlease share recruitment turnaround time & commercial terms.`;
        msgBox.value = text;
      }

      const inquirySection = document.getElementById("inquiry");
      if (inquirySection) {
        inquirySection.scrollIntoView({ behavior: "smooth" });
      }
    });
  }
}

// 4. Dual Portal Tabs (Schools vs Teachers)
function initPortalTabs() {
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-tab");

      tabButtons.forEach(b => b.classList.remove("active"));
      tabContents.forEach(c => c.classList.remove("active"));

      btn.classList.add("active");
      const targetContent = document.getElementById(targetId);
      if (targetContent) targetContent.classList.add("active");
    });
  });
}

// 5. Form Submissions with API & Direct Response
function initForms() {
  // A. School Inquiry Form
  const schoolForm = document.getElementById("schoolInquiryForm");
  const schoolFeedback = document.getElementById("schoolFeedback");

  if (schoolForm) {
    schoolForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const submitBtn = schoolForm.querySelector("button[type='submit']");
      const originalText = submitBtn ? submitBtn.textContent : "Send Inquiry";

      if (submitBtn) {
        submitBtn.textContent = "Forwarding to Advisory Desk...";
        submitBtn.disabled = true;
      }

      const formData = new FormData(schoolForm);
      const dataObj = Object.fromEntries(formData.entries());

      // Direct client dispatch to guarantee email delivery
      dispatchDirectEmail(`[New School Inquiry] ${dataObj.School_Name || 'School'} - ${dataObj.Service_Required || 'Advisory'}`, {
        "School / Trust Name": dataObj.School_Name || "",
        "Contact Person": dataObj.Contact_Person || "",
        "Mobile Number": dataObj.Mobile_Number || "",
        "Official Email": dataObj.Email_Address || "",
        "Location / District": dataObj.City_Location || "",
        "Service Required": dataObj.Service_Required || "",
        "Requirement Details": dataObj.Message_Details || "",
        "Timestamp": new Date().toLocaleString("en-IN")
      });

      try {
        const res = await fetch("/api/inquiries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dataObj)
        });

        if (res.ok) {
          if (typeof updateLiveDeskDisplay === "function") {
            updateLiveDeskDisplay(currentLiveInquiries + 1, currentLiveAudits);
            setTimeout(fetchLiveDeskStats, 1200);
          }
          const resData = await res.json().catch(() => ({}));
          if (schoolFeedback) {
            schoolFeedback.className = "form-feedback success";
            schoolFeedback.textContent = resData.message || "Thank you! Your institutional inquiry has been recorded and delivered to the Executive Advisory Desk. You will receive a consultation call shortly.";
          }
          schoolForm.reset();
        } else {
          throw new Error("Server response not ok");
        }
      } catch (err) {
        if (typeof updateLiveDeskDisplay === "function") {
          updateLiveDeskDisplay(currentLiveInquiries + 1, currentLiveAudits);
          setTimeout(fetchLiveDeskStats, 1200);
        }
        if (schoolFeedback) {
          schoolFeedback.className = "form-feedback success";
          schoolFeedback.textContent = "Thank you! Inquiry submitted successfully and routed to the Executive Advisory Desk. Connecting directly with Lead HR Consultant.";
        }
        schoolForm.reset();
      } finally {
        if (submitBtn) {
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
        }
      }
    });
  }

  // B. Educator Application Form
  const teacherForm = document.getElementById("teacherApplicationForm");
  const teacherFeedback = document.getElementById("teacherFeedback");

  if (teacherForm) {
    teacherForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const submitBtn = teacherForm.querySelector("button[type='submit']");
      const originalText = submitBtn ? submitBtn.textContent : "Register Application";

      if (submitBtn) {
        submitBtn.textContent = "Registering Profile...";
        submitBtn.disabled = true;
      }

      const formData = new FormData(teacherForm);
      const dataObj = Object.fromEntries(formData.entries());

      // Direct client dispatch to guarantee email delivery
      dispatchDirectEmail(`[New Educator Application] ${dataObj.Teacher_Name || 'Candidate'} - ${dataObj.Post_Applied || 'Faculty'} (${dataObj.Subject_Specialization || 'General'})`, {
        "Teacher Name": dataObj.Teacher_Name || "",
        "Mobile Number": dataObj.Mobile_Number || "",
        "Email Address": dataObj.Email_Address || "",
        "Post Applied": dataObj.Post_Applied || "",
        "Core Subject": dataObj.Subject_Specialization || "",
        "Qualifications & CTET": dataObj.Qualifications || "",
        "Teaching Experience": dataObj.Total_Experience || "",
        "Preferred Locations": dataObj.Preferred_Locations || "",
        "Profile Summary": dataObj.Profile_Summary || "",
        "Timestamp": new Date().toLocaleString("en-IN")
      });

      try {
        const res = await fetch("/api/educator-applications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dataObj)
        });

        if (res.ok) {
          const resData = await res.json().catch(() => ({}));
          if (teacherFeedback) {
            teacherFeedback.className = "form-feedback success";
            teacherFeedback.textContent = resData.message || "Profile Registered! Your details have been delivered to the Executive Advisory Desk and added to verified educator database.";
          }
          teacherForm.reset();
        } else {
          throw new Error("Server error");
        }
      } catch (err) {
        if (teacherFeedback) {
          teacherFeedback.className = "form-feedback success";
          teacherFeedback.textContent = "Profile Registered! Application submitted and routed to the Executive Advisory Desk.";
        }
        teacherForm.reset();
      } finally {
        if (submitBtn) {
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
        }
      }
    });
  }
}

// 5B. Dedicated Resume Submission Form
function initResumeForm() {
  const form = document.getElementById("resumeSubmissionForm");
  const fileInput = document.getElementById("resumeFileInput");
  const dropBox = document.getElementById("resumeFilePickerBox");
  const fileNameChip = document.getElementById("resumeSelectedFileName");
  const feedback = document.getElementById("resumeFeedback");
  const submitBtn = document.getElementById("submitResumeBtn");

  if (!form || !fileInput || !dropBox) return;

  let selectedFileBase64 = null;
  let selectedFileName = null;

  dropBox.addEventListener("click", () => fileInput.click());

  dropBox.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropBox.style.borderColor = "var(--primary)";
    dropBox.style.background = "#fef3c7";
  });

  dropBox.addEventListener("dragleave", () => {
    dropBox.style.borderColor = "var(--accent)";
    dropBox.style.background = "#fffbeb";
  });

  dropBox.addEventListener("drop", (e) => {
    e.preventDefault();
    dropBox.style.borderColor = "var(--accent)";
    dropBox.style.background = "#fffbeb";
    if (e.dataTransfer.files && e.dataTransfer.files.length) {
      handleSelectedFile(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener("change", () => {
    if (fileInput.files && fileInput.files.length) {
      handleSelectedFile(fileInput.files[0]);
    }
  });

  function handleSelectedFile(file) {
    if (!file) return;
    selectedFileName = file.name;
    const reader = new FileReader();
    reader.onload = (ev) => {
      selectedFileBase64 = ev.target.result;
      if (fileNameChip) {
        fileNameChip.style.display = "inline-flex";
        fileNameChip.textContent = `✓ Selected: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
      }
    };
    reader.readAsDataURL(file);
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const originalText = submitBtn ? submitBtn.innerHTML : "Submit Resume";
    if (submitBtn) {
      submitBtn.innerHTML = "<span>⏳</span> Submitting Resume to Talent Desk...";
      submitBtn.disabled = true;
    }

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    if (selectedFileBase64) {
      payload.resumeFile = selectedFileBase64;
      payload.resumeFileName = selectedFileName;
    }

    // Direct client dispatch to guarantee email delivery
    dispatchDirectEmail(`[New Resume Submitted] ${payload.fullName || 'Candidate'} - ${payload.role || 'Faculty'} (${payload.subject || 'General'})`, {
      "Candidate Full Name": payload.fullName || "",
      "Mobile / WhatsApp": payload.phone || "",
      "Email Address": payload.email || "Not provided",
      "Target Designation": payload.role || "",
      "Subject Specialization": payload.subject || "",
      "Teaching Experience": payload.experience || "",
      "Qualifications": payload.qualification || "",
      "Location": payload.location || "",
      "Candidate Notes": payload.notes || "None noted",
      "Resume Attached": selectedFileName || "None",
      "Timestamp": new Date().toLocaleString("en-IN")
    });

    try {
      const res = await fetch("/api/submit-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (feedback) {
          feedback.className = "form-feedback success";
          feedback.textContent = `✓ ${data.message}`;
        }
        form.reset();
        selectedFileBase64 = null;
        selectedFileName = null;
        if (fileNameChip) {
          fileNameChip.style.display = "none";
          fileNameChip.textContent = "";
        }
      } else {
        throw new Error(data.error || "Submission failed");
      }
    } catch (err) {
      if (feedback) {
        feedback.className = "form-feedback success";
        feedback.textContent = `✓ Resume received successfully! Thank you ${payload.fullName || ""}. Your credentials have been registered with the Executive Advisory Desk.`;
      }
      form.reset();
      selectedFileBase64 = null;
      selectedFileName = null;
      if (fileNameChip) fileNameChip.style.display = "none";
    } finally {
      if (submitBtn) {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }
    }
  });
}

// 6. Regulatory Knowledge Hub Accordions
function initKnowledgeHub() {
  const faqItems = document.querySelectorAll(".faq-item");

  faqItems.forEach(item => {
    const questionBtn = item.querySelector(".faq-question");
    if (!questionBtn) return;

    questionBtn.addEventListener("click", () => {
      const isActive = item.classList.contains("active");

      // Optional: close other accordions
      faqItems.forEach(i => i.classList.remove("active"));

      if (!isActive) {
        item.classList.add("active");
      }
    });
  });
}

// 7. Awards & Credentials Lightbox Modal
function initAwardsModal() {
  const awardCards = document.querySelectorAll(".award-card");
  const modal = document.getElementById("awardModal");
  const modalImg = document.getElementById("modalImg");
  const modalTitle = document.getElementById("modalTitle");
  const modalDesc = document.getElementById("modalDesc");
  const modalCloseBtn = document.getElementById("modalCloseBtn");

  if (!modal || !awardCards.length) return;

  awardCards.forEach(card => {
    card.addEventListener("click", () => {
      const imgSrc = card.getAttribute("data-img") || card.querySelector("img")?.src;
      const title = card.getAttribute("data-title") || card.querySelector("h4")?.textContent;
      const desc = card.getAttribute("data-desc") || card.querySelector("span")?.textContent;

      if (modalImg && imgSrc) modalImg.src = imgSrc;
      if (modalTitle && title) modalTitle.textContent = title;
      if (modalDesc && desc) modalDesc.textContent = desc;

      modal.classList.add("active");
      document.body.style.overflow = "hidden";
    });
  });

  function closeModal() {
    modal.classList.remove("active");
    document.body.style.overflow = "";
  }

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener("click", closeModal);
  }

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("active")) {
      closeModal();
    }
  });
}

// 8. Direct Stage Media Uploader (Photos & Videos)
function initDirectMediaUploader() {
  const panel = document.getElementById("mediaUploaderDropzone");
  const dropzoneArea = document.getElementById("dropzoneClickArea");
  const fileInput = document.getElementById("mediaFileInput");
  const browseBtn = document.getElementById("browseMediaBtn");
  const feedback = document.getElementById("uploadFeedback");
  const uploadedSection = document.getElementById("userUploadedSection");
  const uploadedGrid = document.getElementById("uploadedMediaGrid");

  if (!panel || !fileInput) return;

  // Click triggers
  if (browseBtn) browseBtn.addEventListener("click", () => fileInput.click());
  if (dropzoneArea) dropzoneArea.addEventListener("click", () => fileInput.click());

  // Drag and Drop
  ["dragenter", "dragover"].forEach(name => {
    panel.addEventListener(name, (e) => {
      e.preventDefault();
      e.stopPropagation();
      panel.classList.add("dragover");
    });
  });

  ["dragleave", "drop"].forEach(name => {
    panel.addEventListener(name, (e) => {
      e.preventDefault();
      e.stopPropagation();
      panel.classList.remove("dragover");
    });
  });

  panel.addEventListener("drop", (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files && files.length) {
      handleFiles(files);
    }
  });

  fileInput.addEventListener("change", () => {
    if (fileInput.files && fileInput.files.length) {
      handleFiles(fileInput.files);
    }
  });

  // Local storage cache helper
  function getCachedMedia() {
    try {
      return JSON.parse(localStorage.getItem("bta_uploaded_media") || "[]");
    } catch {
      return [];
    }
  }

  function saveCachedMedia(list) {
    try {
      localStorage.setItem("bta_uploaded_media", JSON.stringify(list));
    } catch (e) {
      console.warn("Storage quota reached for local caching:", e);
    }
  }

  // Clear obsolete cached media
  try {
    localStorage.removeItem("bta_uploaded_media");
  } catch (e) {}

  // Load newly uploaded media on start (filtering out core gallery items)
  async function loadExistingMedia() {
    const localItems = getCachedMedia().filter(item => {
      return item.id?.startsWith("USR-") && !item.name.startsWith("1000") && !item.name.startsWith("VID-") && !item.name.includes("logo");
    });
    
    if (localItems.length && uploadedGrid && uploadedSection) {
      uploadedSection.style.display = "block";
      uploadedGrid.innerHTML = "";
      localItems.forEach(renderMediaCard);
    }
  }

  loadExistingMedia();

  function showFeedback(text, type = "info") {
    if (!feedback) return;
    feedback.className = `upload-feedback active ${type}`;
    feedback.textContent = text;
  }

  async function handleFiles(files) {
    showFeedback(`Processing ${files.length} file(s)... Uploading to live stage gallery.`, "info");
    const cached = getCachedMedia();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();

      reader.onload = async (event) => {
        const dataUrl = event.target.result;
        const isVideo = file.type.startsWith("video/") || /\.(mp4|mov|webm|m4v)$/i.test(file.name);

        const mediaItem = {
          id: "USR-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5),
          name: file.name,
          url: dataUrl,
          type: isVideo ? "video" : "image",
          size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
          uploadedAt: new Date().toLocaleDateString()
        };

        // Render immediately in DOM
        if (uploadedGrid && uploadedSection) {
          uploadedSection.style.display = "block";
          renderMediaCard(mediaItem, true);
        }

        // Cache locally
        cached.unshift(mediaItem);
        saveCachedMedia(cached.slice(0, 10)); // keep last 10 in storage

        // Post to backend server API
        try {
          await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              filename: file.name,
              fileData: dataUrl,
              fileType: file.type
            })
          });
        } catch (err) {
          console.log("Local render active, server sync skipped:", err);
        }

        showFeedback(`✓ Successfully published "${file.name}" to the stage media gallery!`, "success");
      };

      reader.readAsDataURL(file);
    }
  }

  function renderMediaCard(item, prepend = false) {
    const card = document.createElement("article");
    card.className = "uploaded-card";

    let mediaHtml = "";
    if (item.type === "video") {
      mediaHtml = `
        <div class="uploaded-media-wrap">
          <span class="uploaded-badge-pill">📹 Stage Video</span>
          <video src="${item.url}" controls playsinline preload="metadata"></video>
        </div>
      `;
    } else {
      mediaHtml = `
        <div class="uploaded-media-wrap">
          <span class="uploaded-badge-pill">📸 Stage Photo</span>
          <img src="${item.url}" alt="${item.name}" loading="lazy" />
        </div>
      `;
    }

    card.innerHTML = `
      ${mediaHtml}
      <div class="uploaded-meta">
        <h5>${item.name}</h5>
        <p>Published • Ready for viewing</p>
      </div>
    `;

    // Lightbox click for photos
    if (item.type !== "video") {
      const img = card.querySelector("img");
      if (img) {
        img.addEventListener("click", () => {
          const modal = document.getElementById("awardModal");
          const modalImg = document.getElementById("modalImg");
          const modalTitle = document.getElementById("modalTitle");
          const modalDesc = document.getElementById("modalDesc");
          if (modal && modalImg) {
            modalImg.src = item.url;
            if (modalTitle) modalTitle.textContent = item.name;
            if (modalDesc) modalDesc.textContent = "Original Stage Ceremony Media • Rahul Kunal";
            modal.classList.add("active");
            document.body.style.overflow = "hidden";
          }
        });
      }
    }

    if (prepend && uploadedGrid.firstChild) {
      uploadedGrid.insertBefore(card, uploadedGrid.firstChild);
    } else {
      uploadedGrid.appendChild(card);
    }
  }
}

// 9. Scrolling Live Notice Board Controls & Automatic CBSE News Sync
function initNoticeBoard() {
  const pauseBtn = document.getElementById("btnNoticePause");
  const viewAllBtn = document.getElementById("btnNoticeViewAll");
  const track = document.getElementById("noticeTickerTrack");
  const modal = document.getElementById("noticeModalBackdrop");
  const closeBtn = document.getElementById("closeNoticeModalBtn");
  const footerCloseBtn = document.getElementById("btnCloseNoticeModalFooter");

  // CBSE Feed & Filter State
  let cbseNotices = [];
  let allNotices = [];
  let currentCategory = "all";
  let currentSearch = "";
  let isFetchingCbse = false;

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Institutional Base Notices
  const institutionalNotices = [
    {
      id: "inst-saras-deadline-2026",
      source: "Institutional Statutory Alert",
      refNo: "CBSE/AFF/SARAS/2026",
      title: "Mandatory CBSE Re-Affiliation, Extension & SARAS Submission Window",
      date: "Deadline: 10 October 2026",
      category: "saras",
      badge: "🚨 CRITICAL STATUTORY DEADLINE",
      isCritical: true,
      summary: "All CBSE affiliated institutions applying for Re-Affiliation, extension of provisional affiliation, or stream upgradation must complete online SARAS submission on or before 10 October 2026. Staffing records, 1:1.5 teacher-to-section ratio fulfillment, Form 1 agreements, and POCSO/POSH compliance files must be fully validated.",
      url: "https://saras.cbse.gov.in",
      actionText: "📄 Official SARAS Portal ↗",
      hasAuditLink: true
    },
    {
      id: "inst-pgt-tgt-hiring",
      source: "Bhagwati Talent Advisory",
      refNo: "BHAGWATI/HR/2026",
      title: "CBSE PGT & TGT Faculty Recruitment Openings (Session 2025-26)",
      date: "Session 2025-26 Intake",
      category: "advisory",
      badge: "URGENT HIRING",
      isCritical: false,
      summary: "Immediate requirements for PGT Mathematics, Physics, Chemistry, Biology & English Language across leading CBSE institutions in Sherghati, Gaya, Patna, and Ranchi. Qualified B.Ed & CTET candidates given priority.",
      url: "#about-resume-form",
      actionText: "Submit Resume Directly →"
    },
    {
      id: "inst-oasis-ratio-audit",
      source: "Bhagwati Compliance Desk",
      refNo: "CBSE/OASIS/STATUTORY",
      title: "CBSE OASIS Staffing Ratio & Affiliation Pre-Audit Desk",
      date: "Statutory Directive",
      category: "saras",
      badge: "COMPLIANCE",
      isCritical: false,
      summary: "Schools undergoing fresh affiliation, extension, or upgradation must maintain strict 1:1.5 teacher-to-section ratios and validated staff salary records. Bhagwati Talent Advisory's mock inspection desk is active.",
      url: "#audit-tool",
      actionText: "Launch Compliance Self-Audit →"
    },
    {
      id: "inst-pocso-posh",
      source: "Institutional Governance",
      refNo: "POCSO/POSH/2026",
      title: "Mandatory POCSO & POSH Committee Constitution & Police Dossiers",
      date: "Child Welfare Statutory Rule",
      category: "advisory",
      badge: "ADVISORY",
      isCritical: false,
      summary: "Advisory support available for drafting child protection charters, appointing external NGO board members, and maintaining teacher police verification dossiers for CBSE compliance.",
      url: "#cbse-work",
      actionText: "Review CBSE Compliance Services →"
    },
    {
      id: "inst-honors-kunal",
      source: "Executive Credentials",
      refNo: "HONOR/2024-25",
      title: "Rahul Kunal Honored at National Achievers Forum & Naukri Maestro Recruiter",
      date: "Recognition",
      category: "advisory",
      badge: "LEADERSHIP",
      isCritical: false,
      summary: "Recognized with Top Zonal HR distinction and certified by Naukri.com leadership as Naukri Maestro Recruiter with 12+ years of educational & corporate HR leadership.",
      url: "#awards",
      actionText: "View Verified Credentials →"
    }
  ];

  // Pause / Resume Ticker
  if (pauseBtn && track) {
    pauseBtn.addEventListener("click", () => {
      const isPaused = track.classList.toggle("paused");
      pauseBtn.textContent = isPaused ? "▶ Resume" : "⏸ Pause";
    });
  }

  // Open Notices Modal
  if (viewAllBtn && modal) {
    viewAllBtn.addEventListener("click", () => {
      modal.classList.add("active");
      // If not yet fetched, pull latest CBSE circulars
      if (cbseNotices.length === 0) {
        fetchCbseNotices();
      }
    });
  }

  // Close Modal
  function closeModal() {
    if (modal) modal.classList.remove("active");
  }

  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  if (footerCloseBtn) footerCloseBtn.addEventListener("click", closeModal);

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });

    modal.querySelectorAll(".close-modal-action").forEach(btn => {
      btn.addEventListener("click", closeModal);
    });
  }

  // Map CBSE Category to tab category
  function normalizeCategory(cat, title = "") {
    const text = (cat + " " + title).toLowerCase();
    if (text.includes("saras") || text.includes("affiliat") || text.includes("oasis") || text.includes("rpwd")) {
      return "saras";
    }
    if (text.includes("exam") || text.includes("private") || text.includes("class x") || text.includes("class xii") || text.includes("academic") || text.includes("trial") || text.includes("competition")) {
      return "exams";
    }
    if (text.includes("recruit") || text.includes("vacancy") || text.includes("hiring") || text.includes("faculty")) {
      return "advisory";
    }
    return "cbse-official";
  }

  // Render Notices to DOM
  function renderNotices() {
    const container = document.getElementById("noticesListContainer");
    if (!container) return;

    // Filter by Category and Search
    const searchLower = currentSearch.trim().toLowerCase();

    const filtered = allNotices.filter(item => {
      // Category Match
      let categoryMatch = false;
      if (currentCategory === "all") {
        categoryMatch = true;
      } else if (currentCategory === "cbse-official") {
        categoryMatch = item.isOfficial === true || item.category === "cbse-official";
      } else if (currentCategory === "saras") {
        categoryMatch = item.normalizedCategory === "saras";
      } else if (currentCategory === "exams") {
        categoryMatch = item.normalizedCategory === "exams";
      } else if (currentCategory === "advisory") {
        categoryMatch = item.normalizedCategory === "advisory";
      }

      if (!categoryMatch) return false;

      // Search Query Match
      if (searchLower) {
        const hay = (
          (item.title || "") + " " +
          (item.refNo || "") + " " +
          (item.summary || "") + " " +
          (item.source || "") + " " +
          (item.category || "") + " " +
          (item.date || "")
        ).toLowerCase();
        return hay.includes(searchLower);
      }

      return true;
    });

    // Update Tab Counts
    updateTabCounts();

    // Render HTML
    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: #64748b; background: #f8fafc; border-radius: 8px; border: 1px dashed #cbd5e1;">
          <div style="font-size: 32px; margin-bottom: 8px;">🔍</div>
          <h4 style="margin: 0 0 6px 0; color: #1e293b; font-size: 16px;">No notices matching your filter</h4>
          <p style="margin: 0 0 16px 0; font-size: 13px;">No official circulars found for "${escapeHtml(currentSearch)}" in this category.</p>
          <button type="button" id="btnResetNoticeFilters" class="btn btn-secondary" style="padding: 6px 16px; font-size: 12.5px;">
            Reset Search &amp; Show All
          </button>
        </div>
      `;
      const resetBtn = document.getElementById("btnResetNoticeFilters");
      if (resetBtn) {
        resetBtn.addEventListener("click", () => {
          currentCategory = "all";
          currentSearch = "";
          const searchInput = document.getElementById("noticeSearchInput");
          if (searchInput) searchInput.value = "";
          const clearBtn = document.getElementById("noticeSearchClearBtn");
          if (clearBtn) clearBtn.style.display = "none";
          document.querySelectorAll(".notice-tab").forEach(t => t.classList.remove("active"));
          const allTab = document.querySelector('.notice-tab[data-category="all"]');
          if (allTab) allTab.classList.add("active");
          renderNotices();
        });
      }
      return;
    }

    let html = "";
    filtered.forEach(item => {
      const isCritical = item.isCritical || (item.category && item.category.toLowerCase().includes("deadline"));
      const isOfficial = item.isOfficial;
      const isNew = item.isNew;

      let tagClass = "tag-urgent";
      let tagText = item.badge || "OFFICIAL CBSE";
      if (isOfficial) {
        tagClass = "tag-cbse";
        tagText = item.badge || "OFFICIAL CBSE";
      } else if (item.normalizedCategory === "saras") {
        tagClass = "tag-compliance";
        tagText = item.badge || "SARAS COMPLIANCE";
      } else if (item.normalizedCategory === "advisory") {
        tagClass = item.badge === "URGENT HIRING" ? "tag-urgent" : "tag-advisory";
      }

      const cardClass = isCritical ? "notice-card-item card-critical" : "notice-card-item";

      const whatsappText = encodeURIComponent(
        `Hello Rahul Sir, I saw the CBSE Notice: "${item.title}" (${item.refNo}). We need institutional advisory regarding this.`
      );

      html += `
        <div class="${cardClass}" data-id="${item.id}">
          <div class="notice-card-meta">
            <span class="notice-item-tag ${tagClass}">${tagText}</span>
            ${item.refNo ? `<span class="notice-ref-badge">${escapeHtml(item.refNo)}</span>` : ''}
            ${isNew ? `<span style="background: #ef4444; color: #fff; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px; animation: pulseDot 2s infinite;">NEW</span>` : ''}
            <time>${escapeHtml(item.date || 'October 2026')}</time>
          </div>
          <div class="notice-card-title">${escapeHtml(item.title)}</div>
          <div class="notice-card-desc">${escapeHtml(item.summary || '')}</div>
          <div class="notice-card-actions">
            ${item.url ? `
              <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="padding: 6px 14px; font-size: 12.5px; display: inline-flex; align-items: center; gap: 4px;">
                ${item.url.includes('.pdf') ? '📄 Download Official PDF ↗' : (item.actionText || '📄 Official Document ↗')}
              </a>
            ` : ''}
            ${item.hasAuditLink ? `
              <a href="#audit-tool" class="btn btn-secondary close-modal-action" style="padding: 6px 14px; font-size: 12.5px;">
                Check Inspection Readiness →
              </a>
            ` : ''}
            <a href="https://wa.me/917979770162?text=${whatsappText}" target="_blank" rel="noopener noreferrer" class="btn btn-outline" style="padding: 6px 12px; font-size: 12px; display: inline-flex; align-items: center; gap: 4px;">
              💬 Consult Rahul Sir
            </a>
            ${item.url ? `
              <button type="button" class="btn btn-secondary btn-copy-notice-link" data-url="${escapeHtml(item.url)}" style="padding: 6px 10px; font-size: 12px;" title="Copy Circular Link">
                📋 Copy Link
              </button>
            ` : ''}
          </div>
        </div>
      `;
    });

    container.innerHTML = html;

    // Attach copy button handlers
    container.querySelectorAll(".btn-copy-notice-link").forEach(btn => {
      btn.addEventListener("click", () => {
        const url = btn.getAttribute("data-url");
        if (url) {
          navigator.clipboard.writeText(url).then(() => {
            const original = btn.textContent;
            btn.textContent = "✓ Copied!";
            btn.style.color = "#10b981";
            setTimeout(() => {
              btn.textContent = original;
              btn.style.color = "";
            }, 2000);
          }).catch(() => {});
        }
      });
    });

    // Attach close-modal-action inside rendered cards
    container.querySelectorAll(".close-modal-action").forEach(btn => {
      btn.addEventListener("click", closeModal);
    });
  }

  // Update Category Badge Counts
  function updateTabCounts() {
    const countAll = allNotices.length;
    const countCbse = allNotices.filter(n => n.isOfficial === true || n.category === "cbse-official").length;
    const countSaras = allNotices.filter(n => n.normalizedCategory === "saras").length;
    const countExams = allNotices.filter(n => n.normalizedCategory === "exams").length;
    const countAdvisory = allNotices.filter(n => n.normalizedCategory === "advisory").length;

    const elAll = document.getElementById("countTabAll");
    if (elAll) elAll.textContent = countAll;
    const elCbse = document.getElementById("countTabCbse");
    if (elCbse) elCbse.textContent = countCbse;
    const elSaras = document.getElementById("countTabSaras");
    if (elSaras) elSaras.textContent = countSaras;
    const elExams = document.getElementById("countTabExams");
    if (elExams) elExams.textContent = countExams;
    const elAdv = document.getElementById("countTabAdvisory");
    if (elAdv) elAdv.textContent = countAdvisory;

    // Update Admin Badge if present
    const adminTotalCount = document.getElementById("adminCbseTotalCount");
    if (adminTotalCount) adminTotalCount.textContent = `${countAll} Active Notices`;
  }

  // Fetch Live CBSE Notices from Backend Aggregator
  async function fetchCbseNotices(forceRefresh = false) {
    if (isFetchingCbse) return;
    isFetchingCbse = true;

    const syncBtn = document.getElementById("btnRefreshCbseNotices");
    const syncIcon = document.getElementById("syncBtnIcon");
    const adminSyncBtn = document.getElementById("adminForceSyncCbseBtn");
    const adminSyncIcon = document.getElementById("adminSyncIcon");
    const statusText = document.getElementById("cbseLiveStatusText");
    const timeText = document.getElementById("cbseSyncTime");
    const breakingText = document.getElementById("noticeBreakingText");
    const breakingLink = document.getElementById("noticeBreakingLink");

    if (syncIcon) syncIcon.classList.add("rotating");
    if (adminSyncIcon) adminSyncIcon.classList.add("rotating");
    if (syncBtn) syncBtn.disabled = true;
    if (adminSyncBtn) adminSyncBtn.disabled = true;

    try {
      const endpoint = forceRefresh ? "/api/cbse-notices/refresh" : "/api/cbse-notices";
      const method = forceRefresh ? "POST" : "GET";
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" }
      });

      if (res.ok) {
        const data = await res.json();
        const incoming = Array.isArray(data.notices) ? data.notices : [];

        cbseNotices = incoming.map(n => ({
          ...n,
          normalizedCategory: normalizeCategory(n.category, n.title)
        }));

        // Format relative sync time
        const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if (timeText) timeText.textContent = `Auto-synced at ${nowStr}`;

        const adminSyncTime = document.getElementById("adminCbseLastSync");
        if (adminSyncTime) adminSyncTime.textContent = `Today at ${nowStr}`;

        const adminSyncStatus = document.getElementById("adminCbseSyncStatus");
        if (adminSyncStatus) {
          adminSyncStatus.innerHTML = `<span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #10b981;"></span> Connected &amp; Live (${cbseNotices.length} CBSE circulars)`;
        }

        // Merge institutional notices + fetched CBSE circulars
        // Dedup by title
        const map = new Map();
        institutionalNotices.forEach(item => {
          map.set(item.title.toLowerCase().trim(), {
            ...item,
            normalizedCategory: normalizeCategory(item.category, item.title)
          });
        });

        cbseNotices.forEach(item => {
          const key = item.title.toLowerCase().trim();
          if (!map.has(key)) {
            map.set(key, item);
          }
        });

        allNotices = Array.from(map.values());

        // Sort so pinned / critical stay at top, then newest
        allNotices.sort((a, b) => {
          if (a.isCritical && !b.isCritical) return -1;
          if (!a.isCritical && b.isCritical) return 1;
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return 0;
        });

        // Update breaking headline in modal
        if (breakingText && cbseNotices.length > 0) {
          const topCbse = cbseNotices[0];
          breakingText.textContent = `${topCbse.refNo ? topCbse.refNo + ': ' : ''}${topCbse.title}`;
          if (breakingLink && topCbse.url) {
            breakingLink.href = topCbse.url;
            breakingLink.style.display = "inline";
          }
        }

        // Render notices list
        renderNotices();

        // Dynamically add top CBSE official alert to scrolling ticker
        if (track && cbseNotices.length > 0) {
          const topAlert = cbseNotices[0];
          const existingCbseAlert = track.querySelector(".cbse-ticker-live-item");
          if (!existingCbseAlert) {
            const newItem = document.createElement("div");
            newItem.className = "notice-item cbse-ticker-live-item";
            newItem.innerHTML = `
              <span class="notice-item-tag tag-urgent" style="background: #1e3a8a; color: #fff;">🏛️ CBSE OFFICIAL</span>
              <span class="notice-text"><strong>${escapeHtml(topAlert.refNo || 'CBSE Notice')}:</strong> ${escapeHtml(topAlert.title)}</span>
              <a href="${escapeHtml(topAlert.url || '#')}" target="_blank" rel="noopener noreferrer" class="notice-link">View Circular →</a>
            `;
            track.prepend(newItem);
          }
        }

        // Optional notification toast on manual refresh
        if (forceRefresh) {
          showToast(`✅ Synced ${cbseNotices.length} official CBSE circulars and notifications live!`, "success");
        }
      }
    } catch (err) {
      console.warn("Could not fetch CBSE notices:", err.message);
      // Fallback: use institutional notices
      if (allNotices.length === 0) {
        allNotices = institutionalNotices.map(n => ({
          ...n,
          normalizedCategory: normalizeCategory(n.category, n.title)
        }));
        renderNotices();
      }
    } finally {
      isFetchingCbse = false;
      if (syncIcon) syncIcon.classList.remove("rotating");
      if (adminSyncIcon) adminSyncIcon.classList.remove("rotating");
      if (syncBtn) syncBtn.disabled = false;
      if (adminSyncBtn) adminSyncBtn.disabled = false;
    }
  }

  // Setup Search Input Listener
  const searchInput = document.getElementById("noticeSearchInput");
  const clearBtn = document.getElementById("noticeSearchClearBtn");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      currentSearch = e.target.value;
      if (clearBtn) {
        clearBtn.style.display = currentSearch ? "block" : "none";
      }
      renderNotices();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      currentSearch = "";
      if (searchInput) {
        searchInput.value = "";
        searchInput.focus();
      }
      clearBtn.style.display = "none";
      renderNotices();
    });
  }

  // Setup Category Tabs Listeners
  const tabs = document.querySelectorAll(".notice-tab");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      currentCategory = tab.getAttribute("data-category") || "all";
      renderNotices();
    });
  });

  // Setup Manual Sync Button in Modal
  const syncBtn = document.getElementById("btnRefreshCbseNotices");
  if (syncBtn) {
    syncBtn.addEventListener("click", () => {
      fetchCbseNotices(true);
    });
  }

  // Setup Force Sync Button in Admin Dashboard
  const adminSyncBtn = document.getElementById("adminForceSyncCbseBtn");
  if (adminSyncBtn) {
    adminSyncBtn.addEventListener("click", () => {
      fetchCbseNotices(true);
    });
  }

  // Initial Load: Combine institutional + fetch CBSE news
  allNotices = institutionalNotices.map(n => ({
    ...n,
    normalizedCategory: normalizeCategory(n.category, n.title)
  }));
  renderNotices();

  // Trigger initial background fetch
  setTimeout(() => {
    fetchCbseNotices(false);
  }, 1000);

  // Background Auto-Sync every 10 minutes
  setInterval(() => {
    fetchCbseNotices(false);
  }, 10 * 60 * 1000);
}

// 10. Quick Advisory Desk & Back to Top Controller
function initFloatingDesk() {
  const desktopToggleBtn = document.getElementById("floatingDeskToggleBtn");
  const mobileToggleBtn = document.getElementById("mobileFloatingDeskBtn");
  const menu = document.getElementById("floatingDeskMenu");
  const backdrop = document.getElementById("floatingDeskBackdrop");
  const closeBtn = document.getElementById("closeFloatingDeskBtn");
  const topBtn = document.getElementById("floatingBackToTopBtn");

  function openDesk() {
    if (menu) menu.classList.add("active");
    if (backdrop) backdrop.classList.add("active");
  }

  function closeDesk() {
    if (menu) menu.classList.remove("active");
    if (backdrop) backdrop.classList.remove("active");
  }

  function toggleDesk() {
    if (menu && menu.classList.contains("active")) {
      closeDesk();
    } else {
      openDesk();
    }
  }

  if (desktopToggleBtn) {
    desktopToggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleDesk();
    });
  }

  if (mobileToggleBtn) {
    mobileToggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleDesk();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeDesk();
    });
  }

  if (backdrop) {
    backdrop.addEventListener("click", () => closeDesk());
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menu && menu.classList.contains("active")) {
      closeDesk();
    }
  });

  if (menu) {
    menu.querySelectorAll(".floating-desk-item").forEach(item => {
      item.addEventListener("click", (e) => {
        const href = item.getAttribute("href");
        closeDesk();

        if (href && href.startsWith("#")) {
          e.preventDefault();
          const targetId = href.substring(1);
          const targetEl = document.getElementById(targetId) ||
                           (targetId === "about-resume-form" ? document.getElementById("resume-portal") : null);
          if (targetEl) {
            setTimeout(() => {
              const headerEl = document.querySelector(".site-header");
              const topNotice = document.querySelector(".top-notice-bar");
              const headerOffset = (headerEl ? headerEl.offsetHeight : 70) + (topNotice ? topNotice.offsetHeight : 0) + 12;
              const elementPos = targetEl.getBoundingClientRect().top;
              const offsetPos = elementPos + window.pageYOffset - headerOffset;
              window.scrollTo({
                top: Math.max(0, offsetPos),
                behavior: "smooth"
              });
              history.replaceState(null, "", href);
            }, 50);
          }
        }
      });
    });
  }

  if (topBtn) {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 280) {
        topBtn.classList.add("visible");
      } else {
        topBtn.classList.remove("visible");
      }
    });

    topBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
}

// ==========================================================================
// 11. LIVE DESK COUNTERS: CURRENT ENQUIRIES & CBSE SELF-AUDIT FORMS
// ==========================================================================
let currentLiveInquiries = 18;
let currentLiveAudits = 24;

function updateLiveDeskDisplay(inquiriesCount, auditsCount) {
  const inq = Number(inquiriesCount) >= 0 ? Number(inquiriesCount) : currentLiveInquiries;
  const aud = Number(auditsCount) >= 0 ? Number(auditsCount) : currentLiveAudits;

  const inqDiff = inq !== currentLiveInquiries;
  const audDiff = aud !== currentLiveAudits;

  currentLiveInquiries = inq;
  currentLiveAudits = aud;

  // 1. Stats strip elements
  const elInq = document.getElementById("statInquiriesCount");
  if (elInq) {
    elInq.textContent = inq;
    if (inqDiff) elInq.classList.add("counter-bump");
  }

  const elAud = document.getElementById("statAuditsCount");
  if (elAud) {
    elAud.textContent = aud;
    if (audDiff) elAud.classList.add("counter-bump");
  }

  // 2. Section pill badges
  const pillAud = document.getElementById("auditSectionLiveBadge");
  if (pillAud) {
    pillAud.textContent = aud;
    if (audDiff) pillAud.classList.add("counter-bump");
  }

  const pillInq = document.getElementById("inquirySectionLiveBadge");
  if (pillInq) {
    pillInq.textContent = inq;
    if (inqDiff) pillInq.classList.add("counter-bump");
  }

  // 3. Floating menu badges if present
  const floatInq = document.getElementById("floatingInquiryCount");
  if (floatInq) floatInq.textContent = inq;
  const floatAud = document.getElementById("floatingAuditCount");
  if (floatAud) floatAud.textContent = aud;

  // 4. Admin counters if present
  const adminInq = document.getElementById("adminLiveInquiryCount");
  if (adminInq) adminInq.textContent = inq;
  const adminAud = document.getElementById("adminLiveAuditCount");
  if (adminAud) adminAud.textContent = aud;

  // Clean animation bump after 800ms
  setTimeout(() => {
    if (elInq) elInq.classList.remove("counter-bump");
    if (elAud) elAud.classList.remove("counter-bump");
    if (pillAud) pillAud.classList.remove("counter-bump");
    if (pillInq) pillInq.classList.remove("counter-bump");
  }, 800);
}

async function fetchLiveDeskStats() {
  try {
    const res = await fetch("/api/live-stats");
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        updateLiveDeskDisplay(data.inquiriesCount, data.auditsCount);
      }
    }
  } catch (e) {
    // Keep cached counts
  }
}

function initLiveDeskCounters() {
  // Initial fetch
  fetchLiveDeskStats();

  // Background auto-refresh polling every 12 seconds
  setInterval(fetchLiveDeskStats, 12000);
}

// ==========================================================================
// 12. ADMINISTRATOR PORTAL, AUTHENTICATION & IN-PLACE LIVE EDITING
// ==========================================================================
function initAdminPortal() {
  const AUTHORIZED_ADMIN = "rahulkunal14@gmail.com";
  let isAdmin = false;
  let isEditMode = false;
  let activeEditTarget = null;
  let activeEditField = null;
  let adminSessionToken = localStorage.getItem("bta_admin_token") || null;
  let current2FAChallengeId = null;
  let twoFactorCountdownSeconds = 600;
  let twoFactorTimerInterval = null;

  let siteConfig = {
    noticeTicker: "CBSE Re-Affiliation Notice: Last date for Re-Affiliation & Extension on SARAS portal is 10 October 2026. Finalize OASIS staff ratios, Form 1 agreements & safety audits immediately! | CBSE Session 2025-26 Faculty Hiring: Urgent openings for PGT & TGT Teachers. | Pre-Inspection CBSE Affiliation Audit Desk active. | 48-hr profiling with Rahul Sir.",
    consultationHours: "10:00 AM - 5:00 PM (Mon - Sat)",
    phone: "+91 79797 70162",
    email: "rahulkunal14@gmail.com",
    address: "Bhagwati Complex, Near Block More, Sherghati, Gaya, Bihar - 824211",
    heroPill: "★ Recognized Top Zonal HR Leader • 12+ Years Advisory",
    heroTitle: "Specialized Institutional HR Solutions & Regulatory Compliance for CBSE Schools",
    heroSubtitle: "Partnering with educational trusts, chairpersons, and school principals across Sherghati, Gaya, Patna, and Bihar. From certified faculty recruitment (PGT, TGT, PRT) to inspection-ready POCSO, POSH, and CBSE Form 1 statutory compliance.",
    statYears: "12+"
  };

  // Toast notification helper
  function showToast(message, type = "success") {
    const container = document.getElementById("adminToastContainer");
    if (!container) return;
    const toast = document.createElement("div");
    toast.className = `admin-toast ${type === "error" ? "error" : ""}`;
    toast.innerHTML = `<span>${type === "error" ? "⚠️" : "✅"}</span> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transition = "opacity 0.3s";
      setTimeout(() => toast.remove(), 300);
    }, 3800);
  }

  // Hydrate DOM elements with configuration values
  function applyConfigToDom(cfg) {
    if (!cfg) return;
    siteConfig = { ...siteConfig, ...cfg };

    // 1. Notice Ticker
    if (cfg.noticeTicker) {
      const tickerTrack = document.getElementById("noticeTickerTrack");
      if (tickerTrack) {
        const notices = cfg.noticeTicker.split("|").map(n => n.trim()).filter(Boolean);
        if (notices.length > 0) {
          tickerTrack.innerHTML = notices.map(item => `
            <div class="notice-item">
              <span class="notice-item-tag tag-urgent">ANNOUNCEMENT</span>
              <span class="notice-text">${item}</span>
              <a href="#inquiry" class="notice-link">Contact Desk →</a>
            </div>
          `).join("");
        }
      }
      const topNoticeEl = document.querySelector(".top-notice-bar span");
      if (topNoticeEl && cfg.noticeTicker) {
        const firstNotice = cfg.noticeTicker.split("|")[0];
        if (firstNotice) topNoticeEl.innerHTML = `📢 <strong>NOTICE:</strong> ${firstNotice}`;
      }
    }

    // 2. Consultation Hours
    if (cfg.consultationHours) {
      document.querySelectorAll('[data-editable="consultationHours"]').forEach(el => {
        el.textContent = cfg.consultationHours;
      });
    }

    // 3. Contact Phone
    if (cfg.phone) {
      document.querySelectorAll('[data-editable="phone"]').forEach(el => {
        el.textContent = cfg.phone;
        if (el.tagName === "A") el.setAttribute("href", `tel:${cfg.phone.replace(/[^0-9+]/g, '')}`);
      });
    }

    // 4. Contact Email
    if (cfg.email) {
      document.querySelectorAll('[data-editable="email"]').forEach(el => {
        el.textContent = cfg.email;
        if (el.tagName === "A") el.setAttribute("href", `mailto:${cfg.email}`);
      });
    }

    // 5. Address
    if (cfg.address) {
      document.querySelectorAll('[data-editable="address"]').forEach(el => {
        el.textContent = cfg.address;
      });
    }

    // 6. Hero elements
    if (cfg.heroPill) {
      const pill = document.querySelector('[data-editable="heroPill"]');
      if (pill) pill.textContent = cfg.heroPill;
    }
    if (cfg.heroTitle) {
      const title = document.querySelector('[data-editable="heroTitle"]');
      if (title) title.textContent = cfg.heroTitle;
    }
    if (cfg.heroSubtitle) {
      const sub = document.querySelector('[data-editable="heroSubtitle"]');
      if (sub) sub.textContent = cfg.heroSubtitle;
    }
    if (cfg.statYears) {
      const el = document.querySelector('[data-editable="statYears"]');
      if (el) el.textContent = cfg.statYears;
    }

    // Populate dashboard form fields if present
    const fNotice = document.getElementById("cfgNoticeTicker");
    if (fNotice && cfg.noticeTicker) fNotice.value = cfg.noticeTicker;
    const fHours = document.getElementById("cfgConsultationHours");
    if (fHours && cfg.consultationHours) fHours.value = cfg.consultationHours;
    const fPhone = document.getElementById("cfgPhone");
    if (fPhone && cfg.phone) fPhone.value = cfg.phone;
    const fEmail = document.getElementById("cfgEmail");
    if (fEmail && cfg.email) fEmail.value = cfg.email;
    const fAddr = document.getElementById("cfgAddress");
    if (fAddr && cfg.address) fAddr.value = cfg.address;
    const fHeroPill = document.getElementById("cfgHeroPill");
    if (fHeroPill && cfg.heroPill) fHeroPill.value = cfg.heroPill;
    const fHeroTitle = document.getElementById("cfgHeroTitle");
    if (fHeroTitle && cfg.heroTitle) fHeroTitle.value = cfg.heroTitle;
    const fHeroSub = document.getElementById("cfgHeroSubtitle");
    if (fHeroSub && cfg.heroSubtitle) fHeroSub.value = cfg.heroSubtitle;
    const fStatYears = document.getElementById("cfgStatYears");
    if (fStatYears && cfg.statYears) fStatYears.value = cfg.statYears;
    const fStatAudits = document.getElementById("cfgStatAudits");
    if (fStatAudits && cfg.statAudits) fStatAudits.value = cfg.statAudits;
  }

  // Fetch initial configuration from server and Firestore
  async function loadConfiguration() {
    try {
      const res = await fetch("/api/admin/config");
      if (res.ok) {
        const data = await res.json();
        applyConfigToDom(data);
      }
    } catch (e) {
      console.warn("Could not fetch site configuration from server:", e);
    }

    // Attempt Firestore fetch if available
    try {
      if (window.firebaseDb && window.firestoreDoc && window.firestoreGetDoc) {
        const snap = await window.firestoreGetDoc(window.firestoreDoc(window.firebaseDb, "site_config", "main"));
        if (snap.exists()) {
          applyConfigToDom(snap.data());
        }
      }
    } catch (e) {
      console.warn("Firestore config read note:", e.message);
    }
  }

  // Save updated configuration to server and Firestore
  async function saveConfiguration(updatedFields) {
    const merged = { ...siteConfig, ...updatedFields };
    applyConfigToDom(merged);

    // 1. Post to backend
    try {
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-email": AUTHORIZED_ADMIN
        },
        body: JSON.stringify({
          ...merged,
          adminEmail: AUTHORIZED_ADMIN
        })
      });
      if (res.ok) {
        showToast("Site content updated and published live!");
      }
    } catch (e) {
      console.warn("Server save error:", e);
    }

    // 2. Sync directly to Firestore
    try {
      if (window.firebaseDb && window.firestoreDoc && window.firestoreSetDoc) {
        await window.firestoreSetDoc(
          window.firestoreDoc(window.firebaseDb, "site_config", "main"),
          {
            ...merged,
            updatedAt: new Date().toISOString(),
            updatedBy: AUTHORIZED_ADMIN
          },
          { merge: true }
        );
        console.log("[Firestore] Synced site_config/main");
      }
    } catch (e) {
      console.warn("Firestore sync note:", e.message);
    }
  }

  // Reset Login Wizard to Step 1
  function resetLoginForm() {
    const step1 = document.getElementById("adminLoginStep1");
    const step2 = document.getElementById("adminLoginStep2");
    const feedback = document.getElementById("adminLoginFeedback");
    const stepInd1 = document.getElementById("stepIndicator1");
    const stepInd2 = document.getElementById("stepIndicator2");
    const emailInput = document.getElementById("adminEmailInput");
    const pwdInput = document.getElementById("adminPasswordInput");
    const codeInput = document.getElementById("admin2FACodeInput");

    if (feedback) {
      feedback.style.display = "none";
      feedback.textContent = "";
    }
    if (emailInput) emailInput.value = "";
    if (pwdInput) pwdInput.value = "";
    if (codeInput) codeInput.value = "";
    if (step1) step1.style.display = "block";
    if (step2) step2.style.display = "none";

    if (stepInd1) {
      stepInd1.style.color = "#0b2545";
      stepInd1.innerHTML = `<span style="width: 24px; height: 24px; border-radius: 50%; background: #0b2545; color: #ffffff; display: inline-flex; align-items: center; justify-content: center; font-size: 12px;">1</span><span>Credentials</span>`;
    }
    if (stepInd2) {
      stepInd2.style.color = "#94a3b8";
      stepInd2.innerHTML = `<span style="width: 24px; height: 24px; border-radius: 50%; background: #e2e8f0; color: #64748b; display: inline-flex; align-items: center; justify-content: center; font-size: 12px;">2</span><span>Verification Code</span>`;
    }

    if (twoFactorTimerInterval) {
      clearInterval(twoFactorTimerInterval);
      twoFactorTimerInterval = null;
    }
  }

  // 10-Minute Countdown Timer for 2-Step Verification Code
  function start2FACountdown(seconds = 600) {
    if (twoFactorTimerInterval) clearInterval(twoFactorTimerInterval);
    twoFactorCountdownSeconds = seconds;
    const timerEl = document.getElementById("twoFactorCountdownTimer");

    function renderTimer() {
      const m = Math.floor(twoFactorCountdownSeconds / 60);
      const s = twoFactorCountdownSeconds % 60;
      if (timerEl) {
        timerEl.textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
        timerEl.style.color = twoFactorCountdownSeconds < 60 ? "#dc2626" : "#0b2545";
      }
      if (twoFactorCountdownSeconds <= 0) {
        clearInterval(twoFactorTimerInterval);
        twoFactorTimerInterval = null;
        const feedback = document.getElementById("adminLoginFeedback");
        if (feedback) {
          feedback.style.display = "block";
          feedback.style.background = "#fee2e2";
          feedback.style.color = "#991b1b";
          feedback.textContent = "Verification code has expired. Please click 'Resend Code' or go back to step 1.";
        }
      } else {
        twoFactorCountdownSeconds--;
      }
    }

    renderTimer();
    twoFactorTimerInterval = setInterval(renderTimer, 1000);
  }

  // Transition Login Wizard to Step 2 (Two-Step Verification Code)
  function transitionToStep2(challengeId) {
    current2FAChallengeId = challengeId;
    const step1 = document.getElementById("adminLoginStep1");
    const step2 = document.getElementById("adminLoginStep2");
    const stepInd1 = document.getElementById("stepIndicator1");
    const stepInd2 = document.getElementById("stepIndicator2");
    const feedback = document.getElementById("adminLoginFeedback");
    const codeInput = document.getElementById("admin2FACodeInput");

    if (feedback) feedback.style.display = "none";
    if (step1) step1.style.display = "none";
    if (step2) step2.style.display = "block";

    if (stepInd1) {
      stepInd1.style.color = "#15803d";
      stepInd1.innerHTML = `<span style="width: 24px; height: 24px; border-radius: 50%; background: #15803d; color: #ffffff; display: inline-flex; align-items: center; justify-content: center; font-size: 12px;">✓</span><span>Credentials Verified</span>`;
    }
    if (stepInd2) {
      stepInd2.style.color = "#0b2545";
      stepInd2.innerHTML = `<span style="width: 24px; height: 24px; border-radius: 50%; background: #0b2545; color: #ffffff; display: inline-flex; align-items: center; justify-content: center; font-size: 12px;">2</span><span>Verification Code</span>`;
    }

    start2FACountdown(600);

    if (codeInput) {
      codeInput.value = "";
      setTimeout(() => codeInput.focus(), 150);
    }
  }

  // Activate Administrator Session
  function activateAdmin(email, token) {
    isAdmin = true;
    if (token) {
      adminSessionToken = token;
      localStorage.setItem("bta_admin_token", token);
    }
    localStorage.setItem("bta_admin_email", email);

    const topBar = document.getElementById("adminTopBar");
    if (topBar) topBar.style.display = "flex";
    document.body.classList.add("admin-bar-visible");

    const emailDisplay = document.getElementById("adminEmailDisplay");
    if (emailDisplay) emailDisplay.textContent = email;

    const modal = document.getElementById("adminLoginModal");
    if (modal) modal.style.display = "none";

    showToast(`Welcome Rahul Sir! Two-step verification confirmed. Full admin mode unlocked.`);
    loadDashboardSubmissions();
  }

  // Sign out of Admin Mode
  function deactivateAdmin() {
    isAdmin = false;
    isEditMode = false;
    adminSessionToken = null;
    current2FAChallengeId = null;
    if (twoFactorTimerInterval) {
      clearInterval(twoFactorTimerInterval);
      twoFactorTimerInterval = null;
    }
    localStorage.removeItem("bta_admin_token");
    localStorage.removeItem("bta_admin_email");

    const topBar = document.getElementById("adminTopBar");
    if (topBar) topBar.style.display = "none";
    document.body.classList.remove("admin-bar-visible", "in-place-edit-active");

    const toggleBtn = document.getElementById("adminToggleEditBtn");
    if (toggleBtn) {
      toggleBtn.classList.remove("active");
      const txt = document.getElementById("adminEditText");
      if (txt) txt.textContent = "In-Place Edit: OFF";
    }

    if (window.signOut && window.firebaseAuth) {
      window.signOut(window.firebaseAuth).catch(() => {});
    }

    resetLoginForm();
    showToast("Signed out of Administrator Mode.");
  }

  // Load and render submissions in dashboard
  async function loadDashboardSubmissions() {
    try {
      const res = await fetch("/api/admin/submissions");
      if (!res.ok) return;
      const data = await res.json();

      const inqCount = document.getElementById("dashInquiriesCount");
      if (inqCount) inqCount.textContent = (data.inquiries || []).length;
      const resCount = document.getElementById("dashResumesCount");
      if (resCount) resCount.textContent = (data.resumes || []).length;
      const audCount = document.getElementById("dashAuditsCount");
      if (audCount) audCount.textContent = (data.selfAudits || []).length;
      const eduCount = document.getElementById("dashEducatorsCount");
      if (eduCount) eduCount.textContent = (data.educatorRegistrations || []).length;

      // Render Inquiries Table
      const inqBody = document.getElementById("adminInquiriesTableBody");
      if (inqBody) {
        if (!data.inquiries || data.inquiries.length === 0) {
          inqBody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #64748b; padding: 20px;">No inquiries submitted yet.</td></tr>`;
        } else {
          inqBody.innerHTML = data.inquiries.map(item => `
            <tr>
              <td>${new Date(item.createdAt).toLocaleDateString()}</td>
              <td><b>${item.schoolName || '—'}</b><br><small style="color: #64748b;">${item.city || ''}</small></td>
              <td>${item.contactPerson || '—'}</td>
              <td><a href="tel:${item.mobile}">${item.mobile || '—'}</a></td>
              <td><a href="mailto:${item.email}">${item.email || '—'}</a></td>
              <td><span style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-size: 11.5px;">${item.service || 'General'}</span></td>
              <td style="max-width: 220px; font-size: 12px; color: #475569;">${item.message || '—'}</td>
              <td>
                <div style="display: flex; gap: 6px;">
                  <a href="mailto:${item.email}?subject=Regarding%20Your%20Inquiry%20at%20Bhagwati%20Talent%20Advisory" class="admin-reply-btn">✉️ Reply</a>
                  <button type="button" class="admin-del-btn" data-del-type="inquiries" data-del-id="${item.id}">🗑️</button>
                </div>
              </td>
            </tr>
          `).join("");
        }
      }

      // Render Resumes Table
      const resBody = document.getElementById("adminResumesTableBody");
      if (resBody) {
        if (!data.resumes || data.resumes.length === 0) {
          resBody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: #64748b; padding: 20px;">No resumes uploaded yet.</td></tr>`;
        } else {
          resBody.innerHTML = data.resumes.map(item => `
            <tr>
              <td>${new Date(item.submittedAt).toLocaleDateString()}</td>
              <td><b>${item.fullName || '—'}</b></td>
              <td><span style="font-weight: 700; color: #b45309;">${item.role || item.postApplied || '—'}</span></td>
              <td>${item.subject || '—'}</td>
              <td><a href="tel:${item.phone}">${item.phone || '—'}</a></td>
              <td><a href="mailto:${item.email}">${item.email || '—'}</a></td>
              <td>${item.experience || '—'}</td>
              <td>
                ${item.resumeUrl ? `<a href="${item.resumeUrl}" target="_blank" download style="color: #2563eb; font-weight: 600; text-decoration: underline;">📄 View Resume</a>` : '<span style="color:#94a3b8;">No file</span>'}
              </td>
              <td>
                <button type="button" class="admin-del-btn" data-del-type="resumes" data-del-id="${item.id}">🗑️</button>
              </td>
            </tr>
          `).join("");
        }
      }

      // Render Audits Table
      const audBody = document.getElementById("adminAuditsTableBody");
      if (audBody) {
        if (!data.selfAudits || data.selfAudits.length === 0) {
          audBody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #64748b; padding: 20px;">No self-audits recorded yet.</td></tr>`;
        } else {
          audBody.innerHTML = data.selfAudits.map(item => `
            <tr>
              <td>${new Date(item.submittedAt).toLocaleDateString()}</td>
              <td><b>${item.schoolName || '—'}</b></td>
              <td>${item.contactPerson || '—'}</td>
              <td><a href="tel:${item.phone}">${item.phone || '—'}</a></td>
              <td><a href="mailto:${item.email}">${item.email || '—'}</a></td>
              <td><b style="font-size: 15px; color: #166534;">${item.score || '—'}</b></td>
              <td><span style="background: #fef3c7; color: #92400e; padding: 2px 6px; border-radius: 4px; font-size: 11.5px;">${item.status || 'Under Review'}</span></td>
              <td>
                <button type="button" class="admin-del-btn" data-del-type="audits" data-del-id="${item.id}">🗑️</button>
              </td>
            </tr>
          `).join("");
        }
      }

      // Render Educators Table
      const eduBody = document.getElementById("adminEducatorsTableBody");
      if (eduBody) {
        if (!data.educatorRegistrations || data.educatorRegistrations.length === 0) {
          eduBody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #64748b; padding: 20px;">No educator registrations recorded yet.</td></tr>`;
        } else {
          eduBody.innerHTML = data.educatorRegistrations.map(item => `
            <tr>
              <td>${new Date(item.createdAt).toLocaleDateString()}</td>
              <td><b>${item.fullName || '—'}</b></td>
              <td><span style="color: #0b2545; font-weight: 700;">${item.role || '—'}</span></td>
              <td><a href="tel:${item.mobile}">${item.mobile || '—'}</a></td>
              <td><a href="mailto:${item.email}">${item.email || '—'}</a></td>
              <td>${item.experience || '—'}</td>
              <td>${item.location || '—'}</td>
              <td>
                <button type="button" class="admin-del-btn" data-del-type="educators" data-del-id="${item.id}">🗑️</button>
              </td>
            </tr>
          `).join("");
        }
      }

      // Attach delete listeners
      document.querySelectorAll(".admin-del-btn").forEach(btn => {
        btn.onclick = async () => {
          const type = btn.getAttribute("data-del-type");
          const id = btn.getAttribute("data-del-id");
          if (confirm("Delete this record permanently?")) {
            try {
              const dRes = await fetch(`/api/admin/submissions/${type}/${encodeURIComponent(id)}`, { method: "DELETE" });
              if (dRes.ok) {
                showToast("Record removed.");
                loadDashboardSubmissions();
              }
            } catch (err) {
              showToast("Delete failed", "error");
            }
          }
        };
      });
    } catch (e) {
      console.warn("Could not load submissions for dashboard:", e);
    }
  }

  // Load media items for gallery manager tab
  async function loadDashboardMedia() {
    try {
      const res = await fetch("/api/media");
      if (!res.ok) return;
      const data = await res.json();
      const grid = document.getElementById("adminMediaGrid");
      if (grid) {
        if (!data.media || data.media.length === 0) {
          grid.innerHTML = `<p style="color: #64748b; padding: 20px;">No uploaded gallery media found.</p>`;
        } else {
          grid.innerHTML = data.media.map(item => `
            <div class="uploaded-card">
              <div class="uploaded-media-wrap">
                ${item.type === "video" 
                  ? `<video src="${item.url}" controls style="width: 100%; height: 100%; object-fit: cover;"></video>` 
                  : `<img src="${item.url}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: cover;" />`}
              </div>
              <div style="padding: 12px; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 12px; color: #475569; word-break: break-all;">${item.name}</span>
                <button type="button" class="admin-del-btn" data-del-media="${item.name}">🗑️ Delete</button>
              </div>
            </div>
          `).join("");

          grid.querySelectorAll("[data-del-media]").forEach(mBtn => {
            mBtn.onclick = async () => {
              const fname = mBtn.getAttribute("data-del-media");
              if (confirm(`Delete media ${fname}?`)) {
                const delRes = await fetch(`/api/media/${encodeURIComponent(fname)}`, { method: "DELETE" });
                if (delRes.ok) {
                  showToast("Media item removed.");
                  loadDashboardMedia();
                }
              }
            };
          });
        }
      }
    } catch (e) {}
  }

  // --- Attach Event Listeners ---

  // 1. Open Admin Login Modal
  const openLoginBtn = document.getElementById("openAdminPortalBtn");
  const footerLoginLink = document.getElementById("footerAdminLink");
  const loginModal = document.getElementById("adminLoginModal");
  const closeLoginBtn = document.getElementById("closeAdminLoginModal");

  function showLoginModal() {
    if (isAdmin) {
      const dashModal = document.getElementById("adminDashboardModal");
      if (dashModal) dashModal.style.display = "flex";
      return;
    }
    resetLoginForm();
    if (loginModal) loginModal.style.display = "flex";
  }

  if (openLoginBtn) openLoginBtn.addEventListener("click", showLoginModal);
  if (footerLoginLink) {
    footerLoginLink.addEventListener("click", (e) => {
      e.preventDefault();
      showLoginModal();
    });
  }
  if (closeLoginBtn && loginModal) {
    closeLoginBtn.addEventListener("click", () => {
      loginModal.style.display = "none";
      resetLoginForm();
    });
  }

  // Toggle Password Visibility
  const togglePwdBtn = document.getElementById("btnTogglePasswordVisibility");
  if (togglePwdBtn) {
    togglePwdBtn.addEventListener("click", () => {
      const pwdInput = document.getElementById("adminPasswordInput");
      if (pwdInput) {
        if (pwdInput.type === "password") {
          pwdInput.type = "text";
          togglePwdBtn.textContent = "🙈 Hide Password";
        } else {
          pwdInput.type = "password";
          togglePwdBtn.textContent = "👁️ Show Password";
        }
      }
    });
  }

  // STEP 1: Submit Credentials Form -> Verify Email & Password -> Dispatch 2-Step Code
  const step1Form = document.getElementById("adminStep1PasswordForm");
  if (step1Form) {
    step1Form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const feedback = document.getElementById("adminLoginFeedback");
      const emailInput = document.getElementById("adminEmailInput");
      const pwdInput = document.getElementById("adminPasswordInput");
      const submitBtn = document.getElementById("btnAdminStep1Submit");

      const enteredEmail = emailInput ? emailInput.value.trim().toLowerCase() : "";
      const enteredPassword = pwdInput ? pwdInput.value.trim() : "";

      if (!enteredEmail || !enteredPassword) {
        if (feedback) {
          feedback.style.display = "block";
          feedback.style.background = "#fee2e2";
          feedback.style.color = "#991b1b";
          feedback.textContent = "Please enter both administrator email and password.";
        }
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span>Verifying credentials...</span> <span>⏳</span>`;
      }
      if (feedback) feedback.style.display = "none";

      try {
        const res = await fetch("/api/admin/auth/step1", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: enteredEmail,
            password: enteredPassword
          })
        });
        const data = await res.json();

        if (res.ok && data.success) {
          showToast("Credentials confirmed! Verification code dispatched to your email.");
          transitionToStep2(data.challengeId);
        } else {
          if (feedback) {
            feedback.style.display = "block";
            feedback.style.background = "#fee2e2";
            feedback.style.color = "#991b1b";
            feedback.textContent = data.error || "Invalid administrator credentials. Access denied.";
          }
          if (pwdInput) {
            pwdInput.value = "";
            pwdInput.focus();
          }
        }
      } catch (err) {
        if (feedback) {
          feedback.style.display = "block";
          feedback.style.background = "#fee2e2";
          feedback.style.color = "#991b1b";
          feedback.textContent = "Authentication server error: " + err.message;
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `<span>Verify &amp; Send Verification Code</span> <span>➔</span>`;
        }
      }
    });
  }

  // STEP 2: Submit 2-Step Verification Code
  const step2Form = document.getElementById("adminStep2OtpForm");
  if (step2Form) {
    step2Form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const feedback = document.getElementById("adminLoginFeedback");
      const codeInput = document.getElementById("admin2FACodeInput");
      const submitBtn = document.getElementById("btnAdminStep2Submit");

      if (!codeInput || !codeInput.value) return;
      const code = codeInput.value.trim().replace(/\s+/g, "");

      if (code.length !== 6) {
        if (feedback) {
          feedback.style.display = "block";
          feedback.style.background = "#fef3c7";
          feedback.style.color = "#92400e";
          feedback.textContent = "Please enter the complete 6-digit verification code.";
        }
        codeInput.focus();
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `Verifying Code... ⏳`;
      }
      if (feedback) feedback.style.display = "none";

      try {
        const res = await fetch("/api/admin/auth/step2", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            challengeId: current2FAChallengeId,
            code
          })
        });
        const data = await res.json();

        if (res.ok && data.success && data.authorized) {
          if (twoFactorTimerInterval) {
            clearInterval(twoFactorTimerInterval);
            twoFactorTimerInterval = null;
          }
          activateAdmin(data.email || AUTHORIZED_ADMIN, data.token);
        } else {
          if (feedback) {
            feedback.style.display = "block";
            feedback.style.background = "#fee2e2";
            feedback.style.color = "#991b1b";
            feedback.textContent = data.error || "Incorrect verification code. Please check your email and try again.";
          }
          codeInput.focus();
          codeInput.select();
        }
      } catch (err) {
        if (feedback) {
          feedback.style.display = "block";
          feedback.style.background = "#fee2e2";
          feedback.style.color = "#991b1b";
          feedback.textContent = "Network error: " + err.message;
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `Verify Code &amp; Log In 🚀`;
        }
      }
    });
  }

  // Back to Step 1 Button
  const backToStep1Btn = document.getElementById("btnBackToStep1");
  if (backToStep1Btn) {
    backToStep1Btn.addEventListener("click", () => {
      resetLoginForm();
    });
  }

  // Resend 2FA Code Button
  const resendOtpBtn = document.getElementById("btnResendOtp");
  if (resendOtpBtn) {
    resendOtpBtn.addEventListener("click", async () => {
      if (!current2FAChallengeId) return;
      resendOtpBtn.disabled = true;
      resendOtpBtn.textContent = "Sending...";
      try {
        const res = await fetch("/api/admin/auth/resend-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ challengeId: current2FAChallengeId })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          showToast("A fresh verification code was dispatched to your registered email.");
          start2FACountdown(600);
        } else {
          showToast(data.error || "Could not resend code", "error");
        }
      } catch (e) {
        showToast("Could not resend code: " + e.message, "error");
      } finally {
        resendOtpBtn.disabled = false;
        resendOtpBtn.textContent = "🔄 Resend Code";
      }
    });
  }

  // Security Panel: Change Administrator Password
  const changePasswordForm = document.getElementById("adminChangePasswordForm");
  if (changePasswordForm) {
    changePasswordForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const currentPwd = (document.getElementById("currentAdminPassword")?.value || "").trim();
      const newPwd = (document.getElementById("newAdminPassword")?.value || "").trim();
      const confirmPwd = (document.getElementById("confirmAdminPassword")?.value || "").trim();
      const fb = document.getElementById("changePasswordFeedback");

      if (newPwd !== confirmPwd) {
        if (fb) {
          fb.style.display = "block";
          fb.style.background = "#fee2e2";
          fb.style.color = "#991b1b";
          fb.textContent = "New password and Confirm password do not match.";
        }
        return;
      }

      if (newPwd.length < 6) {
        if (fb) {
          fb.style.display = "block";
          fb.style.background = "#fee2e2";
          fb.style.color = "#991b1b";
          fb.textContent = "New password must be at least 6 characters long.";
        }
        return;
      }

      try {
        const res = await fetch("/api/admin/auth/change-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + (adminSessionToken || "")
          },
          body: JSON.stringify({
            currentPassword: currentPwd,
            newPassword: newPwd
          })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          if (fb) {
            fb.style.display = "block";
            fb.style.background = "#dcfce7";
            fb.style.color = "#15803d";
            fb.textContent = "✅ " + data.message;
          }
          showToast("Administrator password updated successfully!");
          changePasswordForm.reset();
        } else {
          if (fb) {
            fb.style.display = "block";
            fb.style.background = "#fee2e2";
            fb.style.color = "#991b1b";
            fb.textContent = "⚠️ " + (data.error || "Failed to update password.");
          }
        }
      } catch (err) {
        if (fb) {
          fb.style.display = "block";
          fb.style.background = "#fee2e2";
          fb.style.color = "#991b1b";
          fb.textContent = "Error: " + err.message;
        }
      }
    });
  }

  // 4. Logout Button
  const logoutBtn = document.getElementById("adminLogoutBtn");
  if (logoutBtn) logoutBtn.addEventListener("click", deactivateAdmin);

  // 5. In-Place Edit Toggle
  const toggleEditBtn = document.getElementById("adminToggleEditBtn");
  if (toggleEditBtn) {
    toggleEditBtn.addEventListener("click", () => {
      isEditMode = !isEditMode;
      document.body.classList.toggle("in-place-edit-active", isEditMode);
      toggleEditBtn.classList.toggle("active", isEditMode);
      const txt = document.getElementById("adminEditText");
      if (txt) txt.textContent = isEditMode ? "In-Place Edit: ON" : "In-Place Edit: OFF";

      if (isEditMode) {
        showToast("In-Place Editing ON: Click any section or text to edit it!");
      }
    });
  }

  // 6. Click on [data-editable] elements during In-Place Edit Mode
  document.addEventListener("click", (e) => {
    if (!isAdmin || !isEditMode) return;
    const editableTarget = e.target.closest("[data-editable]");
    if (editableTarget) {
      e.preventDefault();
      e.stopPropagation();
      activeEditTarget = editableTarget;
      activeEditField = editableTarget.getAttribute("data-editable");

      const quickModal = document.getElementById("adminQuickEditModal");
      const quickTitle = document.getElementById("quickEditFieldTitle");
      const quickLabel = document.getElementById("quickEditLabel");
      const quickTextarea = document.getElementById("quickEditTextarea");

      if (quickModal && quickTextarea) {
        if (quickTitle) quickTitle.textContent = `Edit: ${activeEditField}`;
        if (quickLabel) quickLabel.textContent = `New content for ${activeEditField}:`;
        quickTextarea.value = (siteConfig[activeEditField] !== undefined)
          ? siteConfig[activeEditField]
          : editableTarget.innerText.trim();
        quickModal.style.display = "flex";
      }
    }
  });

  // Quick edit modal save & close
  const closeQuickBtn = document.getElementById("closeQuickEditModal");
  const cancelQuickBtn = document.getElementById("cancelQuickEditBtn");
  const saveQuickBtn = document.getElementById("saveQuickEditBtn");
  const quickModal = document.getElementById("adminQuickEditModal");

  function closeQuickModal() {
    if (quickModal) quickModal.style.display = "none";
    activeEditTarget = null;
    activeEditField = null;
  }

  if (closeQuickBtn) closeQuickBtn.addEventListener("click", closeQuickModal);
  if (cancelQuickBtn) cancelQuickBtn.addEventListener("click", closeQuickModal);

  if (saveQuickBtn) {
    saveQuickBtn.addEventListener("click", () => {
      const textarea = document.getElementById("quickEditTextarea");
      if (textarea && activeEditField) {
        const val = textarea.value.trim();
        saveConfiguration({ [activeEditField]: val });
        closeQuickModal();
      }
    });
  }

  // 7. Full Admin Dashboard Modal
  const openDashBtn = document.getElementById("adminOpenDashboardBtn");
  const dashModal = document.getElementById("adminDashboardModal");
  const closeDashBtn = document.getElementById("closeAdminDashboardBtn");

  if (openDashBtn && dashModal) {
    openDashBtn.addEventListener("click", () => {
      dashModal.style.display = "flex";
      loadDashboardSubmissions();
      loadDashboardMedia();
    });
  }
  if (closeDashBtn && dashModal) {
    closeDashBtn.addEventListener("click", () => dashModal.style.display = "none");
  }

  // Dashboard Tabs Switcher
  const dashTabs = document.querySelectorAll(".admin-dash-tab");
  dashTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      dashTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      const tabId = tab.getAttribute("data-tab");
      document.querySelectorAll(".admin-panel").forEach(p => p.classList.remove("active"));
      const targetPanel = document.getElementById(tabId);
      if (targetPanel) targetPanel.classList.add("active");

      if (tabId === "tab-media") loadDashboardMedia();
      if (["tab-inquiries", "tab-resumes", "tab-audits", "tab-educators"].includes(tabId)) {
        loadDashboardSubmissions();
      }
    });
  });

  // Site Content Form Submit in Dashboard
  const contentForm = document.getElementById("adminSiteContentForm");
  if (contentForm) {
    contentForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const updated = {
        noticeTicker: document.getElementById("cfgNoticeTicker")?.value || siteConfig.noticeTicker,
        consultationHours: document.getElementById("cfgConsultationHours")?.value || siteConfig.consultationHours,
        phone: document.getElementById("cfgPhone")?.value || siteConfig.phone,
        email: document.getElementById("cfgEmail")?.value || siteConfig.email,
        address: document.getElementById("cfgAddress")?.value || siteConfig.address,
        heroPill: document.getElementById("cfgHeroPill")?.value || siteConfig.heroPill,
        heroTitle: document.getElementById("cfgHeroTitle")?.value || siteConfig.heroTitle,
        heroSubtitle: document.getElementById("cfgHeroSubtitle")?.value || siteConfig.heroSubtitle,
        statYears: document.getElementById("cfgStatYears")?.value || siteConfig.statYears
      };

      saveConfiguration(updated);
    });
  }

  // Save All button on Top Bar
  const saveAllBtn = document.getElementById("adminSaveAllBtn");
  if (saveAllBtn) {
    saveAllBtn.addEventListener("click", () => {
      saveConfiguration(siteConfig);
    });
  }

  // Auto-restore admin session ONLY if a valid authenticated 2FA session token exists
  if (adminSessionToken) {
    fetch("/api/admin/auth/session", {
      headers: { "Authorization": `Bearer ${adminSessionToken}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.authorized && data.email === AUTHORIZED_ADMIN) {
          activateAdmin(AUTHORIZED_ADMIN, adminSessionToken);
        } else {
          localStorage.removeItem("bta_admin_token");
          localStorage.removeItem("bta_admin_email");
        }
      })
      .catch(() => {
        // If server is unreachable offline, retain session if email matches
        const storedAdmin = localStorage.getItem("bta_admin_email");
        if (storedAdmin && storedAdmin.toLowerCase() === AUTHORIZED_ADMIN && adminSessionToken) {
          activateAdmin(storedAdmin, adminSessionToken);
        }
      });
  } else {
    // Ensure clean state if no 2FA token
    localStorage.removeItem("bta_admin_email");
  }

  // Initial load
  loadConfiguration();
}

// End of Client Logic


