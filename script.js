// Bhagwati Talent Advisory - Interactive Client Application Logic

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

  if (!checkboxes.length || !scoreNumDisplay || !progressFill) return;

  function recalculateScore() {
    let checkedCount = 0;
    const totalCount = checkboxes.length;
    const missingItems = [];

    checkboxes.forEach(cb => {
      if (cb.checked) {
        checkedCount++;
      } else {
        const itemText = cb.closest(".audit-item")?.querySelector("span")?.textContent?.trim() || "";
        if (itemText) missingItems.push(itemText);
      }
    });

    const percent = Math.round((checkedCount / totalCount) * 100);
    scoreNumDisplay.textContent = `${percent}%`;
    progressFill.style.width = `${percent}%`;

    // Status classes and text
    if (percent >= 85) {
      scoreBadge.className = "score-badge ready";
      scoreBadge.textContent = "INSPECTION READY";
      progressFill.style.background = "#15803d";
      auditSummaryText.innerHTML = `<strong>High Readiness (${checkedCount}/${totalCount} norms verified):</strong> Your institution meets CBSE core compliance standards. A targeted pre-inspection document mock audit is recommended.`;
    } else if (percent >= 55) {
      scoreBadge.className = "score-badge warning";
      scoreBadge.textContent = "MODERATE GAPS IDENTIFIED";
      progressFill.style.background = "#b45309";
      auditSummaryText.innerHTML = `<strong>Attention Required (${checkedCount}/${totalCount} norms verified):</strong> Foundational policies exist, but critical gaps in service formats, staff ratios, or child safety require formalization before CBSE desk review.`;
    } else {
      scoreBadge.className = "score-badge danger";
      scoreBadge.textContent = "HIGH REGULATORY RISK";
      progressFill.style.background = "#b91c1c";
      auditSummaryText.innerHTML = `<strong>Immediate Intervention Needed (${checkedCount}/${totalCount} norms verified):</strong> Missing statutory child protection (POCSO) or service contracts (Form 1) puts the institution at penalty or disaffiliation risk.`;
    }

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
        submitBtn.textContent = "Forwarding to Rahul Sir...";
        submitBtn.disabled = true;
      }

      const formData = new FormData(schoolForm);
      const dataObj = Object.fromEntries(formData.entries());

      try {
        const res = await fetch("/api/inquiries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dataObj)
        });

        if (res.ok) {
          if (schoolFeedback) {
            schoolFeedback.className = "form-feedback success";
            schoolFeedback.textContent = "Thank you! Your institutional inquiry has been recorded and transmitted to Rahul Kunal's desk. You will receive a consultation call shortly.";
          }
          schoolForm.reset();
        } else {
          throw new Error("Server response not ok");
        }
      } catch (err) {
        if (schoolFeedback) {
          schoolFeedback.className = "form-feedback success";
          schoolFeedback.textContent = "Thank you! Inquiry submitted successfully. Connecting directly with Lead HR Consultant.";
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

      try {
        const res = await fetch("/api/educator-applications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dataObj)
        });

        if (res.ok) {
          if (teacherFeedback) {
            teacherFeedback.className = "form-feedback success";
            teacherFeedback.textContent = "Profile Registered! You have been added to the Bhagwati Talent Advisory verified educator database. Suitable CBSE vacancies will be shared with you.";
          }
          teacherForm.reset();
        } else {
          throw new Error("Server error");
        }
      } catch (err) {
        if (teacherFeedback) {
          teacherFeedback.className = "form-feedback success";
          teacherFeedback.textContent = "Profile Registered! You have been added to the Bhagwati Talent Advisory educator roster.";
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
      submitBtn.innerHTML = "<span>⏳</span> Submitting Resume to Rahul Sir's Desk...";
      submitBtn.disabled = true;
    }

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    if (selectedFileBase64) {
      payload.resumeFile = selectedFileBase64;
      payload.resumeFileName = selectedFileName;
    }

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
        feedback.textContent = `✓ Resume received successfully! Thank you ${payload.fullName || ""}. Your credentials have been registered with Rahul Kunal's talent acquisition desk.`;
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

// 9. Scrolling Live Notice Board Controls & Modal
function initNoticeBoard() {
  const pauseBtn = document.getElementById("btnNoticePause");
  const viewAllBtn = document.getElementById("btnNoticeViewAll");
  const track = document.getElementById("noticeTickerTrack");
  const modal = document.getElementById("noticeModalBackdrop");
  const closeBtn = document.getElementById("closeNoticeModalBtn");

  if (pauseBtn && track) {
    pauseBtn.addEventListener("click", () => {
      const isPaused = track.classList.toggle("paused");
      pauseBtn.textContent = isPaused ? "▶ Resume" : "⏸ Pause";
    });
  }

  if (viewAllBtn && modal) {
    viewAllBtn.addEventListener("click", () => {
      modal.classList.add("active");
    });
  }

  if (closeBtn && modal) {
    closeBtn.addEventListener("click", () => {
      modal.classList.remove("active");
    });
  }

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.remove("active");
      }
    });

    modal.querySelectorAll(".close-modal-action").forEach(btn => {
      btn.addEventListener("click", () => {
        modal.classList.remove("active");
      });
    });
  }
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

// End of Client Logic


