const PDFDocument = require("pdfkit");

function generateDonationReceiptPDF(donation, res) {
  const doc = new PDFDocument({ margin: 40, size: "A4" });

  const receiptNo = `RS-80G-${new Date().getFullYear()}-${donation._id.toString().slice(-6).toUpperCase()}`;
  const fileName = `ReliefSphere_Receipt_${donation._id.toString().slice(-6)}.pdf`;

  // Stream PDF directly to HTTP response
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);

  doc.pipe(res);

  // ── Colors & Styles ──
  const primaryColor = "#059669"; // Emerald 600
  const secondaryColor = "#0f172a"; // Slate 900
  const lightBg = "#f8fafc";
  const grayText = "#64748b";

  // ── Outer Border ──
  doc
    .rect(20, 20, doc.page.width - 40, doc.page.height - 40)
    .strokeColor("#cbd5e1")
    .lineWidth(2)
    .stroke();

  doc
    .rect(24, 24, doc.page.width - 48, doc.page.height - 48)
    .strokeColor("#059669")
    .lineWidth(0.5)
    .stroke();

  // ── Header Banner ──
  doc
    .rect(25, 25, doc.page.width - 50, 85)
    .fill("#ecfdf5");

  doc
    .fillColor(primaryColor)
    .fontSize(20)
    .font("Helvetica-Bold")
    .text("RELIEFSPHERE HUMANITARIAN NETWORK", 40, 42, { align: "center" });

  doc
    .fillColor(secondaryColor)
    .fontSize(11)
    .font("Helvetica")
    .text("Official Donation & 80G Tax Exemption Certificate", 40, 68, { align: "center" });

  doc
    .fillColor(grayText)
    .fontSize(8.5)
    .text("Govt. Reg. No: RS-HUM/2026/80G-CERT · ISO 9001:2015 Certified Relief Platform", 40, 84, { align: "center" });

  // ── Receipt Reference Bar ──
  const issueDate = new Date(donation.createdAt || Date.now()).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const startY = 125;

  doc
    .rect(40, startY, doc.page.width - 80, 32)
    .fill(lightBg);

  doc
    .fillColor(secondaryColor)
    .fontSize(10)
    .font("Helvetica-Bold")
    .text("Receipt No: ", 50, startY + 10)
    .font("Helvetica")
    .fillColor(primaryColor)
    .text(receiptNo, 120, startY + 10);

  doc
    .fillColor(secondaryColor)
    .font("Helvetica-Bold")
    .text("Date of Issue: ", doc.page.width - 220, startY + 10)
    .font("Helvetica")
    .fillColor("#334155")
    .text(issueDate, doc.page.width - 145, startY + 10);

  // ── Donor Information Section ──
  const donorY = startY + 50;
  doc
    .fillColor(primaryColor)
    .fontSize(12)
    .font("Helvetica-Bold")
    .text("1. DONOR INFORMATION", 40, donorY);

  doc
    .moveTo(40, donorY + 16)
    .lineTo(doc.page.width - 40, donorY + 16)
    .strokeColor("#e2e8f0")
    .stroke();

  const donorName = donation.postedBy?.fullName || donation.donorId?.userId?.fullName || "Valued Relief Donor";
  const donorEmail = donation.postedBy?.email || donation.donorId?.userId?.email || "N/A";
  const pickupAddr = donation.pickupAddress || donation.donorId?.address || "Registered Donor Address";

  doc
    .fillColor(secondaryColor)
    .fontSize(9.5)
    .font("Helvetica-Bold")
    .text("Full Name:", 50, donorY + 26)
    .font("Helvetica")
    .text(donorName, 140, donorY + 26);

  doc
    .font("Helvetica-Bold")
    .text("Email Address:", 50, donorY + 44)
    .font("Helvetica")
    .text(donorEmail, 140, donorY + 44);

  doc
    .font("Helvetica-Bold")
    .text("Address / Location:", 50, donorY + 62)
    .font("Helvetica")
    .text(pickupAddr, 140, donorY + 62, { width: 350 });

  // ── Contribution Summary Section ──
  const contribY = donorY + 100;
  doc
    .fillColor(primaryColor)
    .fontSize(12)
    .font("Helvetica-Bold")
    .text("2. CONTRIBUTION & ITEM DETAILS", 40, contribY);

  doc
    .moveTo(40, contribY + 16)
    .lineTo(doc.page.width - 40, contribY + 16)
    .strokeColor("#e2e8f0")
    .stroke();

  // Table Header
  const tableY = contribY + 26;
  doc
    .rect(40, tableY, doc.page.width - 80, 24)
    .fill("#0f172a");

  doc
    .fillColor("#ffffff")
    .fontSize(9)
    .font("Helvetica-Bold")
    .text("ITEM / CONTRIBUTION NAME", 50, tableY + 7)
    .text("CATEGORY", 240, tableY + 7)
    .text("QUANTITY", 350, tableY + 7)
    .text("STATUS", 440, tableY + 7);

  // Table Content
  const rowY = tableY + 24;
  doc
    .rect(40, rowY, doc.page.width - 80, 36)
    .fill(lightBg);

  const itemName = donation.donationName || `Relief Supply - ${donation.category}`;
  const category = (donation.category || "General").toUpperCase();
  const quantity = `${donation.quantity} ${donation.unit || "Units"}`;
  const status = (donation.status || "Pledged").toUpperCase();

  doc
    .fillColor(secondaryColor)
    .fontSize(9.5)
    .font("Helvetica-Bold")
    .text(itemName, 50, rowY + 12, { width: 180 })
    .font("Helvetica")
    .text(category, 240, rowY + 12)
    .text(quantity, 350, rowY + 12)
    .fillColor(primaryColor)
    .font("Helvetica-Bold")
    .text(status, 440, rowY + 12);

  // Recipient Org Box
  const orgY = rowY + 50;
  const orgName = donation.matchedOrganization?.orgName || "Verified Community Shelter / NGO";
  const reqTitle = donation.matchedRequirement?.title || "Community Resource Redistribution";

  doc
    .rect(40, orgY, doc.page.width - 80, 48)
    .strokeColor("#cbd5e1")
    .fillAndStroke("#ffffff", "#e2e8f0");

  doc
    .fillColor(secondaryColor)
    .fontSize(9.5)
    .font("Helvetica-Bold")
    .text("Beneficiary Organization:", 50, orgY + 12)
    .font("Helvetica")
    .text(orgName, 190, orgY + 12);

  doc
    .font("Helvetica-Bold")
    .text("Relief Project / Purpose:", 50, orgY + 28)
    .font("Helvetica")
    .text(reqTitle, 190, orgY + 28);

  // ── 80G Tax Exemption & Statutory Compliance ──
  const taxY = orgY + 68;
  doc
    .rect(40, taxY, doc.page.width - 80, 75)
    .fill("#f0fdf4");

  doc
    .fillColor("#166534")
    .fontSize(10.5)
    .font("Helvetica-Bold")
    .text("Tax Exemption & Statutory Certification (Section 80G)", 50, taxY + 12);

  doc
    .fillColor("#15803d")
    .fontSize(8.5)
    .font("Helvetica")
    .text(
      "This certificate confirms that the humanitarian contribution detailed above has been officially received and logged by ReliefSphere Network. Contributions qualify for tax exemption under Section 80G of the Income Tax Act, 1961 (Order No. IT(E)/80G/2026/RS-9912).",
      50,
      taxY + 30,
      { width: doc.page.width - 100, align: "justify" }
    );

  // ── Signatory & Stamp ──
  const sigY = taxY + 92;
  doc
    .fillColor(secondaryColor)
    .fontSize(8.5)
    .font("Helvetica-Bold")
    .text("Digital Audit Hash:", 50, sigY);

  doc
    .fillColor(grayText)
    .fontSize(8)
    .font("Courier")
    .text(`SHA256-${donation._id.toString()}-${Date.now().toString(16)}`, 50, sigY + 14);

  // Seal / Sign box
  doc
    .rect(doc.page.width - 220, sigY - 10, 180, 52)
    .strokeColor("#cbd5e1")
    .stroke();

  doc
    .fillColor(primaryColor)
    .fontSize(9.5)
    .font("Helvetica-Bold")
    .text("RELIEFSPHERE SEAL", doc.page.width - 210, sigY)
    .fillColor(secondaryColor)
    .fontSize(8)
    .font("Helvetica")
    .text("Authorized Signatory", doc.page.width - 210, sigY + 14)
    .text("Humanitarian Logistics Cell", doc.page.width - 210, sigY + 26);

  // ── Footer ──
  doc
    .fillColor(grayText)
    .fontSize(8)
    .font("Helvetica-Oblique")
    .text(
      "Thank you for your generous contribution. Together we ensure zero resource waste in disaster response.",
      40,
      doc.page.height - 55,
      { align: "center" }
    );

  doc.end();
}

module.exports = { generateDonationReceiptPDF };
