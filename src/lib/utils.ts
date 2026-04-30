import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface PDFOptions {
  title: string;
  filename: string;
  periodText?: string;
  totalHours?: string;
}

export function exportToPDF(data: any[], options: PDFOptions) {
  if (data.length === 0) return;

  const { title, filename, periodText, totalHours } = options;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // Premium Dark Header
  const headerHeight = periodText ? 55 : 45;
  doc.setFillColor(12, 10, 9); // Deep dark neutral color
  doc.rect(0, 0, pageWidth, headerHeight, 'F');

  // "3D" Gold Accent Line under header
  doc.setFillColor(234, 179, 8); // Gold color
  doc.rect(0, headerHeight, pageWidth, 3, 'F');
  doc.setFillColor(161, 98, 7); // Darker gold for a slight 3D bottom bevel
  doc.rect(0, headerHeight + 3, pageWidth, 1, 'F');

  // Title with Premium Gold color
  doc.setTextColor(234, 179, 8); 
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 26);
  
  // Subtitle / Generated Date
  doc.setTextColor(163, 163, 163); // Light gray
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`OFFICIAL LOG REPORT   |   GENERATED: ${new Date().toLocaleDateString().toUpperCase()}`, 14, 36);

  if (periodText) {
    doc.setTextColor(200, 200, 200);
    doc.text(`PERIOD: ${periodText.toUpperCase()}`, 14, 46);
  }
  
  if (totalHours) {
    doc.setTextColor(234, 179, 8); // Gold
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL HOURS: ${totalHours}`, pageWidth - 14, 46, { align: 'right' });
  }

  const headers = Object.keys(data[0]);
  const rows = data.map(row => headers.map(header => row[header]));

  // AutoTable configuration for a sleek, premium look
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: headerHeight + 15,
    theme: 'plain',
    styles: { 
      font: 'helvetica',
      fontSize: 10, 
      cellPadding: 6,
      textColor: [40, 40, 40],
      lineColor: [229, 231, 235],
      lineWidth: { bottom: 0.5 }
    },
    headStyles: { 
      fillColor: [250, 250, 250], 
      textColor: [12, 10, 9],
      fontStyle: 'bold',
      lineWidth: { top: 0, bottom: 2 }, // Thicker bottom border for header
      lineColor: [234, 179, 8] // Gold underline for table headers
    },
    alternateRowStyles: {
      fillColor: [253, 253, 253]
    }
  });

  // Add Premium Footer on all pages
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    // Dark footer bar
    doc.setFillColor(12, 10, 9);
    doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
    // Gold line above footer
    doc.setFillColor(234, 179, 8);
    doc.rect(0, pageHeight - 16, pageWidth, 1, 'F');

    // Footer Text
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('KAMARAJ JCB', 14, pageHeight - 6);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text(`PAGE ${i} OF ${pageCount}`, pageWidth - 20, pageHeight - 6, { align: 'right' });
  }

  doc.save(`${filename}.pdf`);
}
