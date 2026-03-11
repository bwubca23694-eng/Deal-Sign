import jsPDF from 'jspdf';

/**
 * jsPDF's built-in fonts only support Latin characters.
 * Strip / replace non-Latin chars so the PDF doesn't render garbage.
 * Text is shown correctly everywhere else in the app — only the PDF export is affected.
 */
function s(str) {
  if (!str) return '';
  return String(str)
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u20B9/g, 'Rs.')       // ₹ → Rs.
    .replace(/\u2026/g, '...')
    // Remove anything outside printable Latin-1 range (Devanagari, Bengali, etc.)
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, '');
}

export default async function generatePDF(deal) {
  const pdf  = new jsPDF({ unit: 'mm', format: 'a4' });
  const PW   = 210;
  const ML   = 18;
  const MR   = 18;
  const TW   = PW - ML - MR;
  let   y    = 0;

  const total = deal.paymentType === 'milestone'
    ? deal.milestones.reduce((acc, m) => acc + m.amount, 0)
    : (deal.amount || 0);

  const fmtAmt = n => 'Rs.' + Number(n).toLocaleString('en-IN');
  const fmtD   = d => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '-';

  // ── Header bar ────────────────────────────────────────────────────────
  pdf.setFillColor(15, 169, 122);
  pdf.rect(0, 0, PW, 28, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.text('SERVICE AGREEMENT', ML, 12);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text('DealFlow  |  Legally binding digital contract', ML, 19);
  const now = new Date().toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  pdf.text(s(`Generated: ${now}`), PW - MR, 19, { align: 'right' });
  y = 36;

  // ── Deal ID pill ──────────────────────────────────────────────────────
  pdf.setFillColor(240, 253, 249);
  pdf.roundedRect(ML, y, TW, 9, 2, 2, 'F');
  pdf.setTextColor(8, 120, 88);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`DEAL ID: ${(deal.dealId || '').toUpperCase()}`, ML + 3, y + 6);
  y += 15;

  // ── Section helper ────────────────────────────────────────────────────
  const section = (title, lines) => {
    pdf.setTextColor(15, 169, 122);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, ML, y); y += 5;
    pdf.setDrawColor(200, 200, 200);
    pdf.line(ML, y, ML + TW, y); y += 4;
    pdf.setTextColor(50, 50, 50);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9.5);
    for (const line of lines) {
      if (!line && line !== 0) { y += 3; continue; }
      if (typeof line === 'object' && line.bold) {
        pdf.setFont('helvetica', 'bold');
        const wrapped = pdf.splitTextToSize(s(line.bold), TW);
        pdf.text(wrapped, ML, y); y += wrapped.length * 5;
        pdf.setFont('helvetica', 'normal');
      } else {
        const wrapped = pdf.splitTextToSize(s(String(line)), TW);
        pdf.text(wrapped, ML, y); y += wrapped.length * 5;
      }
    }
    y += 4;
    // Page break guard
    if (y > 260) { pdf.addPage(); y = 18; }
  };

  // ── 1. Parties ────────────────────────────────────────────────────────
  section('1. PARTIES', [
    `Service Provider: ${deal.freelancerName}   |   UPI: ${deal.freelancerUpiId}`,
    `Client: ${deal.clientName}${deal.clientEmail ? '   |   ' + deal.clientEmail : ''}`,
  ]);

  // ── 2. Scope ──────────────────────────────────────────────────────────
  section('2. SCOPE OF WORK', [
    { bold: deal.projectTitle },
    deal.projectDescription,
    '',
    `Delivery date: ${fmtD(deal.deliveryDate)}   |   Revisions included: ${deal.revisionsIncluded}`,
  ]);

  // ── 3. Payment ────────────────────────────────────────────────────────
  if (deal.paymentType === 'milestone') {
    const msLines = deal.milestones.map((m, i) =>
      `Milestone ${i + 1}: ${m.title}  -  ${fmtAmt(m.amount)}   Due: ${fmtD(m.dueDate)}${m.description ? '  (' + m.description + ')' : ''}`
    );
    section('3. PAYMENT - MILESTONE SCHEDULE', [
      `Total: ${fmtAmt(total)} (Indian Rupees)`,
      `Payment via UPI to ${deal.freelancerUpiId}`,
      '',
      ...msLines,
    ]);
  } else {
    section('3. PAYMENT', [
      `Amount: ${fmtAmt(total)} (Indian Rupees, inclusive of all charges)`,
      `Payment via UPI to ${deal.freelancerUpiId}`,
      'Payment due upon project completion unless otherwise agreed.',
    ]);
  }

  // ── 4. IP ─────────────────────────────────────────────────────────────
  section('4. INTELLECTUAL PROPERTY', [
    'Upon receipt of full payment, all intellectual property rights to the final deliverables shall transfer to the Client. The Service Provider retains the right to display the work in their portfolio unless otherwise agreed.',
  ]);

  // ── 5. General terms ──────────────────────────────────────────────────
  section('5. GENERAL TERMS', [
    'Both parties agree to communicate professionally and in good faith. Disputes shall first be resolved via mutual negotiation. This agreement is binding upon digital signature and constitutes the entire agreement between parties.',
  ]);

  // ── Signed banner ─────────────────────────────────────────────────────
  if (deal.signedAt) {
    pdf.setFillColor(240, 253, 249);
    pdf.roundedRect(ML, y, TW, 9, 2, 2, 'F');
    pdf.setTextColor(8, 120, 88);
    pdf.setFontSize(8); pdf.setFont('helvetica', 'bold');
    const signedStr = s(`Signed: ${new Date(deal.signedAt).toLocaleString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`);
    pdf.text(`SIGNED  |  ${signedStr}`, ML + 3, y + 6);
    y += 15;
  }

  // ── 6. Signatures ─────────────────────────────────────────────────────
  if (y > 220) { pdf.addPage(); y = 18; }

  pdf.setTextColor(15, 169, 122);
  pdf.setFontSize(9); pdf.setFont('helvetica', 'bold');
  pdf.text('6. SIGNATURES', ML, y); y += 5;
  pdf.setDrawColor(200, 200, 200);
  pdf.line(ML, y, ML + TW, y); y += 6;

  const col1x = ML;
  const col2x = ML + TW / 2 + 4;
  const colW  = TW / 2 - 4;

  pdf.setTextColor(100, 100, 100);
  pdf.setFontSize(8); pdf.setFont('helvetica', 'normal');
  pdf.text('SERVICE PROVIDER', col1x, y);
  pdf.text('CLIENT', col2x, y);
  y += 4;

  pdf.setFillColor(248, 248, 248);
  pdf.roundedRect(col1x, y, colW, 22, 2, 2, 'F');
  pdf.roundedRect(col2x, y, colW, 22, 2, 2, 'F');

  // Freelancer signature (Cloudinary URL)
  if (deal.freelancerSignature) {
    try {
      const imgData = await fetchImageAsBase64(deal.freelancerSignature);
      pdf.addImage(imgData, 'PNG', col1x + 2, y + 1, colW - 4, 14);
    } catch { /* skip silently */ }
  } else {
    pdf.setTextColor(180, 180, 180);
    pdf.setFontSize(8);
    pdf.text('(no signature on file)', col1x + 3, y + 10);
  }

  // Client signature (base64 PNG from canvas)
  if (deal.signatureData) {
    try {
      pdf.addImage(deal.signatureData, 'PNG', col2x + 2, y + 1, colW - 4, 14);
    } catch { /* skip silently */ }
  }

  y += 23;
  pdf.setTextColor(60, 60, 60);
  pdf.setFontSize(8); pdf.setFont('helvetica', 'bold');
  pdf.text(s(deal.freelancerName), col1x, y);
  pdf.text(s(deal.clientName),     col2x, y);
  y += 4;
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(130, 130, 130);
  pdf.text('Service Provider', col1x, y);
  if (deal.signedAt) {
    pdf.text(s(new Date(deal.signedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })), col2x, y);
  }

  // ── Footer ────────────────────────────────────────────────────────────
  pdf.setFontSize(7);
  pdf.setTextColor(180, 180, 180);
  pdf.text('Generated by DealFlow  |  This is a legally binding digital agreement', PW / 2, 290, { align: 'center' });

  const fname = `DealFlow_${s(deal.projectTitle || 'Contract').replace(/\s+/g, '_')}_${deal.dealId}.pdf`;
  pdf.save(fname);
}

async function fetchImageAsBase64(url) {
  const response = await fetch(url);
  const blob     = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror  = reject;
    reader.readAsDataURL(blob);
  });
}