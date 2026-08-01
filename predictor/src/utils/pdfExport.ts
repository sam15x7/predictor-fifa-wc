// [WC2026 ENHANCEMENT — Task 2]
import { jsPDF } from 'jspdf';
import { format as formatDFNS } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { getCountryCode } from '../lib/fifa-utils';
import { MatchStatus } from '../types';

function getPdfMatchStatusStr(match: any, nowUTC = new Date()): string {
  const msToKickoff = new Date(match.utc).getTime() - nowUTC.getTime();
  const msSinceKickoff = nowUTC.getTime() - new Date(match.utc).getTime();

  if (match.status === MatchStatus.LIVE) return 'LIVE';
  if (match.status === MatchStatus.FINISHED) return 'FT';

  if (msToKickoff > 24 * 60 * 60 * 1000) return 'UPCOMING';
  if (msToKickoff > 60 * 60 * 1000)      return 'TODAY';
  if (msToKickoff > 0)                   return 'SOON';       
  if (msSinceKickoff < 115 * 60 * 1000) return 'LIVE';       
  return 'FT';
}

export async function generateTimetablePDF(matches: any[], options: any = {}) {
  const {
    teamName = null,
    timezone = 'Asia/Kolkata',
    tzLabel = 'IST',
    downloadImmediately = true
  } = options;

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 297;
  const pageHeight = 210;
  let pageNumber = 1;

  // Pre-load all unique team flags
  const uniqueTeams = Array.from(new Set(matches.flatMap(m => [m.home, m.away])));
  const flagCache: Record<string, HTMLImageElement> = {};
  await Promise.all(uniqueTeams.map(async team => {
    if (!team || team === 'TBD' || team === 'TBA') return;
    const code = getCountryCode(team);
    if (!code) return;
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = `https://flagcdn.com/w40/${code}.png`;
    await new Promise<void>(resolve => {
        img.onload = () => { flagCache[team] = img; resolve(); };
        img.onerror = () => resolve();
    });
  }));

  function drawPageBackground() {
    doc.setFillColor(9, 9, 30);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    
    // Watermark
    doc.setFontSize(80);
    doc.setTextColor(20, 20, 50); // Very subtle dark blue
    doc.setFont('helvetica', 'bold');
    doc.text('The Predictor', pageWidth / 2, pageHeight / 2 + 20, { align: 'center', angle: -35 });
  }

  function drawHeader() {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(240, 184, 255);
    doc.text('FIFA WORLD CUP', 14, 12);
    doc.setTextColor(217, 70, 239);
    doc.text('2026', 14 + doc.getTextWidth('FIFA WORLD CUP '), 12);
    
    doc.setFontSize(8);
    doc.setTextColor(217, 70, 239);
    doc.text('Created by Samihan Chatterjee', 14, 17);

    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184); 
    if (teamName) {
      doc.text(`MATCH SCHEDULE — ${teamName.toUpperCase()} · Times in ${tzLabel} · ${matches.length} matches`, 90, 12);
    } else {
      doc.text(`OFFICIAL TIMETABLE · Times in ${tzLabel} · ${matches.length} matches`, 90, 12);
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text('*Knockout stage alignments will update dynamically as Group matches result complete', 90, 16);
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('#', 26, 24, { align: 'right' });
    doc.text('Date & Time', 30, 24);
    doc.text('Match', 76, 24);
    doc.text('Status / Score', 160, 24);
    doc.text('Venue', 200, 24);
  }

  function drawFooter() {
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    const footerText = `Page ${pageNumber}  ·  Generated: ${new Date().toISOString()}  ·  Data: The Predictor`;
    doc.text(footerText, 14, pageHeight - 8);
  }

  drawPageBackground();
  drawHeader();

  let yPos = 28;
  const rowHeight = 11;
  let rowIndex = 0;

  const matchesByStage: Record<string, any[]> = {};
  matches.forEach(m => {
    const stage = m.stage || 'Group';
    if (!matchesByStage[stage]) matchesByStage[stage] = [];
    matchesByStage[stage].push(m);
  });

  const stagesInOrder = ["Group", "R32", "R16", "QF", "SF", "3rd", "Final", ...Object.keys(matchesByStage).filter(s => !["Group", "R32", "R16", "QF", "SF", "3rd", "Final"].includes(s))];
  
  for (const stg of stagesInOrder) {
    if (!matchesByStage[stg]) continue;

    if (yPos > pageHeight - 20) {
      drawFooter();
      doc.addPage();
      pageNumber++;
      drawPageBackground();
      drawHeader();
      yPos = 28;
    }

    doc.setFillColor(35, 18, 60);
    doc.rect(14, yPos, pageWidth - 28, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(240, 184, 255);
    doc.text(stg === 'Group' ? 'GROUP STAGE' : stg.toUpperCase(), 16, yPos + 5.5);
    yPos += 8;

    for (const match of matchesByStage[stg]) {
      if (yPos > pageHeight - 15) {
        drawFooter();
        doc.addPage();
        pageNumber++;
        drawPageBackground();
        drawHeader();
        yPos = 28;
      }

      if (rowIndex % 2 === 0) {
         doc.setFillColor(17, 15, 42);
      } else {
         doc.setFillColor(13, 12, 34);
      }
      doc.rect(14, yPos, pageWidth - 28, rowHeight, 'F');

      const zonedDate = toZonedTime(new Date(match.utc), timezone);
      const dateStr = formatDFNS(zonedDate, 'EEE, dd MMM');
      const timeStr = formatDFNS(zonedDate, 'HH:mm');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(168, 85, 247);
      doc.text(String(match.id || '-'), 26, yPos + 6.5, { align: 'right' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text(dateStr, 30, yPos + 5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(217, 70, 239);
      doc.text(`${timeStr} ${tzLabel}`, 30, yPos + 9);

      const homeStr = match.home || 'TBA';
      const awayStr = match.away || 'TBA';
      
      let xOffset = 76;
      if (flagCache[homeStr]) {
        doc.addImage(flagCache[homeStr], 'PNG', xOffset, yPos + 3.5, 6, 4);
        xOffset += 8;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text(homeStr, xOffset, yPos + 6.5);
      xOffset += doc.getTextWidth(homeStr) + 2;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      doc.text(' vs ', xOffset, yPos + 6.5);
      xOffset += doc.getTextWidth(' vs ') + 2;

      if (flagCache[awayStr]) {
        doc.addImage(flagCache[awayStr], 'PNG', xOffset, yPos + 3.5, 6, 4);
        xOffset += 8;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text(awayStr, xOffset, yPos + 6.5);

      const status = getPdfMatchStatusStr(match);
      let badgeFill = [26, 23, 64];
      let badgeText = [148, 163, 184];
      let hasBorder = false;
      let borderColor = [0, 0, 0];
      let textStr = status;

      if (status === 'UPCOMING') {
        badgeFill = [26, 23, 64]; 
        badgeText = [148, 163, 184]; 
      } else if (status === 'TODAY' || status === 'SOON') {
        badgeFill = [65, 21, 71]; 
        badgeText = [217, 70, 239];
        hasBorder = true;
        borderColor = [217, 70, 239];
        textStr = status;
      } else if (status === 'LIVE' || status === 'HT') { 
        badgeFill = [22, 66, 38]; 
        badgeText = [74, 222, 128];
        hasBorder = true;
        borderColor = [74, 222, 128];
        if (match.score) textStr = match.score;
      } else if (status === 'FT' || status === 'AET' || status === 'PENS') {
        badgeFill = [13, 12, 34]; 
        badgeText = [148, 163, 184];
        textStr = match.score ? `FT ${match.score}` : 'FT';
      }

      doc.setFillColor(badgeFill[0], badgeFill[1], badgeFill[2]);
      if (hasBorder) {
        doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
        doc.rect(160, yPos + 3, 22, 5, 'FD');
      } else {
        doc.rect(160, yPos + 3, 22, 5, 'F');
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(badgeText[0], badgeText[1], badgeText[2]);
      const tw = doc.getTextWidth(textStr);
      doc.text(textStr, 160 + 11 - tw/2, yPos + 6.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(match.venue || '', 200, yPos + 5);
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      doc.text(match.city || '', 200, yPos + 9);

      yPos += rowHeight;
      rowIndex++;
    }
  }

  drawFooter();

  if (downloadImmediately) {
    const filename = teamName
      ? `${teamName.replace(/\s+/g, '_')}_FIFA_WC_2026.pdf`
      : `FIFA_World_Cup_2026_Full_Schedule.pdf`;
    doc.save(filename);
  }
}

