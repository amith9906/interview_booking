'use strict';

const PDFDocument = require('pdfkit');

const drawField = (doc, label, value) => {
  doc.fillColor('#374151').font('Helvetica-Bold').fontSize(11).text(`${label}: `, { continued: true });
  doc.fillColor('#111827').font('Helvetica').text(value);
};

const createFeedbackReportBuffer = async ({ booking, interview }) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const buffers = [];

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', (err) => reject(err));

    doc.rect(0, 0, doc.page.width, 80).fill('#1f2937');
    doc.fillColor('#fff').fontSize(20).font('Helvetica-Bold').text('Candidate Feedback Report', 50, 28);
    doc.fillColor('#9ca3af');
    doc.fontSize(10).text('Interview Booking Platform', 50, 52);
    doc.fillColor('#000');
    doc.moveDown(2);

    const student = booking.Student;
    const interviewer = booking.Interviewer;
    const interviewDate = new Date(booking.slot_time || interview.created_at);

    drawField(doc, 'Student', student?.User?.name || 'N/A');
    drawField(doc, 'Email', student?.User?.email || 'N/A');
    drawField(doc, 'Skills', (student?.skills || []).join(', ') || 'N/A');
    drawField(doc, 'Experience', `${student?.experience_years ?? 'N/A'} years`);
    drawField(doc, 'Interviewer', interviewer?.User?.name || 'N/A');
    drawField(doc, 'Company', interviewer?.Company?.name || 'N/A');
    drawField(
      doc,
      'Interview date/time',
      interviewDate.toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    );
    doc.moveDown();

    doc.font('Helvetica-Bold').fontSize(14).text('Skill-wise breakdown');
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(11);
    const headers = ['Skill', 'Rating', 'Comments'];
    const columnWidths = [180, 60, 220];
    const cellHeight = 20;
    const tableTop = doc.y;

    const drawRow = (row, y, bold = false) => {
      let x = doc.page.margins.left;
      row.forEach((text, index) => {
        doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(11);
        doc.text(text, x + 5, y + 5, {
          width: columnWidths[index] - 10,
          align: index === 1 ? 'center' : 'left'
        });
        doc.rect(x, y, columnWidths[index], cellHeight).stroke();
        x += columnWidths[index];
      });
    };

    drawRow(headers, tableTop, true);
    const skillRatings = interview.skill_ratings || {};
    const skillCommentsSource =
      typeof interview.skill_comments === 'string' ? {} : interview.skill_comments || {};
    const allSkills = new Set(Object.keys(skillRatings));
    Object.keys(skillCommentsSource).forEach((skill) => allSkills.add(skill));
    const rows = Array.from(allSkills).map((skill) => ({
      skill,
      rating: skillRatings[skill]?.toString() || '—',
      comments: skillCommentsSource[skill] || ''
    }));

    let rowY = tableTop + cellHeight;
    if (rows.length) {
      rows.forEach((row) => {
        if (rowY + cellHeight > doc.page.height - doc.page.margins.bottom) {
          doc.addPage();
          rowY = doc.page.margins.top;
          drawRow(headers, rowY, true);
          rowY += cellHeight;
        }
        drawRow([row.skill, row.rating, row.comments], rowY);
        rowY += cellHeight;
      });
    } else {
      drawRow(['No skills recorded', '—', '—'], rowY);
      rowY += cellHeight;
    }

    doc.moveDown(2);
    doc.rect(doc.page.margins.left, doc.y, doc.page.width - doc.page.margins.left * 2, 60).stroke('#d1d5db');
    const summaryTop = doc.y + 4;
    doc.font('Helvetica-Bold').fontSize(12).text('Summary', doc.page.margins.left + 6, summaryTop);
    doc.font('Helvetica').fontSize(11);
    doc.text(`Overall rating: ${interview.overall_rating ?? 'N/A'}`, { continued: true });
    doc.text(`    Feedback: ${interview.feedback || 'N/A'}`);
    doc.text(`Improvement areas: ${interview.improve_areas?.join(', ') || 'N/A'}`);
    doc.end();
  });
};

module.exports = { createFeedbackReportBuffer };
