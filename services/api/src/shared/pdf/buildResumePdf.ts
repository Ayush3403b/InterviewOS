import PDFDocument from "pdfkit";

export interface ExperienceItemDto {
  title: string;
  company: string;
  duration: string;
  location?: string;
  bullets: string[];
}

export interface EducationItemDto {
  degree: string;
  institution: string;
  year: string;
}

export interface ProjectItemDto {
  name: string;
  description: string;
  technologies?: string[];
}

export interface ExportResumeDto {
  fullName: string;
  title?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  website?: string;
  summary?: string;
  skills?: string[];
  experience?: ExperienceItemDto[];
  education?: EducationItemDto[];
  projects?: ProjectItemDto[];
  certifications?: string[];
}

function addSectionHeader(doc: PDFKit.PDFDocument, title: string): void {
  doc.moveDown(0.7);
  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor("#1E293B")
    .text(title.toUpperCase());

  // Divider line
  const startX = doc.page.margins.left;
  const endX = doc.page.width - doc.page.margins.right;
  const currentY = doc.y + 2;

  doc
    .moveTo(startX, currentY)
    .lineTo(endX, currentY)
    .lineWidth(0.8)
    .strokeColor("#CBD5E1")
    .stroke();

  doc.y = currentY + 6;
  doc.font("Helvetica").fontSize(9.5).fillColor("#334155");
}

/**
 * Pure function: renders an ExportResumeDto into an ATS-friendly, clean PDF buffer.
 */
export function buildResumePdf(data: ExportResumeDto): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 40, bottom: 40, left: 45, right: 45 },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // 1. Header: Full Name
    doc
      .font("Helvetica-Bold")
      .fontSize(20)
      .fillColor("#0F172A")
      .text(data.fullName || "Candidate Resume", { align: "center" });

    // Optional Subtitle
    if (data.title) {
      doc.moveDown(0.2);
      doc
        .font("Helvetica")
        .fontSize(11)
        .fillColor("#475569")
        .text(data.title, { align: "center" });
    }

    // Contact Information line
    const contactItems: string[] = [];
    if (data.email) contactItems.push(data.email);
    if (data.phone) contactItems.push(data.phone);
    if (data.location) contactItems.push(data.location);
    if (data.linkedin) contactItems.push(data.linkedin);
    if (data.github) contactItems.push(data.github);
    if (data.website) contactItems.push(data.website);

    if (contactItems.length > 0) {
      doc.moveDown(0.3);
      doc
        .font("Helvetica")
        .fontSize(8.5)
        .fillColor("#64748B")
        .text(contactItems.join("  |  "), { align: "center" });
    }

    doc.moveDown(0.5);

    // 2. Professional Summary
    if (data.summary && data.summary.trim()) {
      addSectionHeader(doc, "Professional Summary");
      doc
        .font("Helvetica")
        .fontSize(9.5)
        .fillColor("#334155")
        .text(data.summary.trim(), {
          align: "justify",
          lineGap: 2,
        });
    }

    // 3. Technical Skills
    if (data.skills && data.skills.length > 0) {
      addSectionHeader(doc, "Technical & Professional Skills");
      doc
        .font("Helvetica")
        .fontSize(9.5)
        .fillColor("#334155")
        .text(data.skills.join("  •  "), {
          lineGap: 2,
        });
    }

    // 4. Experience
    if (data.experience && data.experience.length > 0) {
      addSectionHeader(doc, "Experience");

      data.experience.forEach((exp, idx) => {
        if (idx > 0) doc.moveDown(0.6);

        // Role & Duration row
        const leftText = exp.title ? `${exp.title} — ${exp.company}` : exp.company;
        const rightText = [exp.location, exp.duration].filter(Boolean).join(" | ");

        doc
          .font("Helvetica-Bold")
          .fontSize(10)
          .fillColor("#0F172A")
          .text(leftText, { continued: !!rightText });

        if (rightText) {
          doc
            .font("Helvetica")
            .fontSize(9)
            .fillColor("#64748B")
            .text(rightText, { align: "right" });
        }

        doc.moveDown(0.2);

        // Bullets
        if (exp.bullets && exp.bullets.length > 0) {
          exp.bullets.forEach((bullet) => {
            if (!bullet.trim()) return;
            doc
              .font("Helvetica")
              .fontSize(9)
              .fillColor("#334155")
              .text(`•  ${bullet.trim()}`, {
                indent: 10,
                lineGap: 1.5,
              });
          });
        }
      });
    }

    // 5. Projects
    if (data.projects && data.projects.length > 0) {
      addSectionHeader(doc, "Key Projects");

      data.projects.forEach((proj, idx) => {
        if (idx > 0) doc.moveDown(0.5);

        doc
          .font("Helvetica-Bold")
          .fontSize(9.5)
          .fillColor("#0F172A")
          .text(proj.name, { continued: !!proj.technologies?.length });

        if (proj.technologies?.length) {
          doc
            .font("Helvetica")
            .fontSize(8.5)
            .fillColor("#64748B")
            .text(` (${proj.technologies.join(", ")})`);
        }

        if (proj.description) {
          doc
            .font("Helvetica")
            .fontSize(9)
            .fillColor("#334155")
            .text(proj.description, {
              indent: 10,
              lineGap: 1.5,
            });
        }
      });
    }

    // 6. Education
    if (data.education && data.education.length > 0) {
      addSectionHeader(doc, "Education");

      data.education.forEach((edu, idx) => {
        if (idx > 0) doc.moveDown(0.4);

        doc
          .font("Helvetica-Bold")
          .fontSize(9.5)
          .fillColor("#0F172A")
          .text(edu.degree, { continued: !!edu.year });

        if (edu.year) {
          doc
            .font("Helvetica")
            .fontSize(8.5)
            .fillColor("#64748B")
            .text(edu.year, { align: "right" });
        }

        doc
          .font("Helvetica")
          .fontSize(9)
          .fillColor("#475569")
          .text(edu.institution);
      });
    }

    // 7. Certifications
    if (data.certifications && data.certifications.length > 0) {
      addSectionHeader(doc, "Certifications");
      data.certifications.forEach((cert) => {
        doc
          .font("Helvetica")
          .fontSize(9)
          .fillColor("#334155")
          .text(`•  ${cert}`, { indent: 10, lineGap: 1 });
      });
    }

    doc.end();
  });
}
