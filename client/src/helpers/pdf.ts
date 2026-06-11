import type { jsPDF } from 'jspdf';
import type { UserOptions } from 'jspdf-autotable';

export async function loadPdfTools() {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable')
  ]);

  return { jsPDF, autoTable };
}

export function addPdfBrandHeader(
  doc: jsPDF,
  title: string,
  subtitle: string,
  height = 86
) {
  doc.setFillColor(15, 118, 110);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), height, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text(title, 40, 42);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(subtitle, 40, 62);
}

export function pdfTableDefaults(): UserOptions {
  return {
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 8,
      lineColor: [217, 222, 231],
      lineWidth: 0.6,
      valign: 'middle'
    },
    headStyles: {
      fillColor: [15, 118, 110],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left'
    },
    alternateRowStyles: {
      fillColor: [246, 247, 249]
    },
    margin: { left: 40, right: 40 }
  };
}

export function getLastAutoTableY(doc: jsPDF, fallback: number) {
  return (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? fallback;
}

export function ensurePdfContentY(
  doc: jsPDF,
  y: number,
  requiredHeight: number,
  topMargin = 56,
  bottomMargin = 64
) {
  if (y + requiredHeight <= doc.internal.pageSize.getHeight() - bottomMargin) {
    return y;
  }

  doc.addPage();
  return topMargin;
}

export function addWrappedPdfText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight = 14
) {
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

export function addPdfPageNumbers(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Page ${page} of ${pageCount}`, doc.internal.pageSize.getWidth() - 92, doc.internal.pageSize.getHeight() - 28);
  }
}

export function saveDatedPdf(doc: jsPDF, prefix: string) {
  doc.save(`${prefix}-${dateStamp()}.pdf`);
}

export function dateStamp() {
  return new Date().toISOString().slice(0, 10);
}
