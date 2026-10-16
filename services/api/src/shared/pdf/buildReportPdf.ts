import PDFDocument from "pdfkit";

import { ReportDocument } from "../../modules/report/types/report.types";

const PRIORITY_LABEL: Record<string, string> = {
  HIGH: "[High priority]",
  MEDIUM: "[Medium priority]",
  LOW: "[Low priority]",
};

function addSectionHeading(doc: PDFKit.PDFDocument, text: string): void {
  doc.moveDown(1);
  doc.fontSize(14).fillColor("#12172B").text(text, { underline: false });
  doc.moveDown(0.3);
  doc.fontSize(11).fillColor("#333333");
}

/**
 * Renders a ReportDocument into a PDF buffer. Kept as a pure function
 * (document in, buffer out) so it's easy to unit test without touching
 * Express req/res.
 */
export function buildReportPdf(report: ReportDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc
      .fontSize(20)
      .fillColor("#12172B")
      .text("InterviewOS - Interview Report", { align: "left" });

    doc.moveDown(0.5);
    doc.fontSize(11).fillColor("#555555");
    doc.text(`Candidate: ${report.candidateName}`);
    doc.text(
      `Interview: ${report.interviewTitle} (${report.interviewType}, ${report.interviewLevel})`
    );
    doc.text(`Generated: ${new Date().toLocaleDateString()}`);

    addSectionHeading(doc, "Executive Summary");
    doc.text(report.executiveSummary);

    addSectionHeading(doc, "Scores");
    doc.text(`Overall: ${report.overallScore}/100`);
    doc.text(`Technical: ${report.skillScores.technical}/100`);
    doc.text(`Communication: ${report.skillScores.communication}/100`);
    doc.text(`Problem Solving: ${report.skillScores.problemSolving}/100`);
    doc.text(`Confidence: ${report.skillScores.confidence}/100`);
    doc.text(`Hiring Recommendation: ${report.hiringRecommendation}`);

    if (report.strengths.length > 0) {
      addSectionHeading(doc, "Strengths");
      report.strengths.forEach((item) => doc.text(`- ${item}`));
    }

    if (report.weaknesses.length > 0) {
      addSectionHeading(doc, "Weaknesses");
      report.weaknesses.forEach((item) => doc.text(`- ${item}`));
    }

    if (report.questionEvaluations.length > 0) {
      addSectionHeading(doc, "Question-by-Question Feedback");
      report.questionEvaluations.forEach((qe) => {
        doc
          .fontSize(11)
          .fillColor("#12172B")
          .text(`Q${qe.turnNumber}: ${qe.question}`, { continued: false });
        doc
          .fontSize(10)
          .fillColor("#555555")
          .text(`Score: ${qe.score}/100 - ${qe.feedback}`);
        doc.moveDown(0.3);
      });
    }

    if (report.learningRoadmap.length > 0) {
      addSectionHeading(doc, "Coaching Roadmap");
      report.learningRoadmap.forEach((item) => {
        doc.text(
          `${PRIORITY_LABEL[item.priority] ?? ""} ${item.topic}: ${item.action}`
        );
      });
    }

    doc.end();
  });
}
