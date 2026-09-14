import React, { useState, useEffect, useRef } from 'react';
import { productAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import './AdminSoldProducts.css';

// Detects Arabic characters
const hasArabic = (str) => /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(str);

// Strips non-Latin characters (such as Arabic glyphs) that corrupt jsPDF standard font rendering
const sanitizeForJsPDF = (str = '') => {
  if (!str) return '';
  return str.replace(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g, '').trim();
};

// Splits a product name into {en, ar} parts
// Handles formats: "English / Arabic", "English - Arabic", or plain
const parseProductName = (name = '') => {
  // Try common separators: " / ", " - ", " | "
  const separators = [' / ', ' - ', ' | ', '\n'];
  for (const sep of separators) {
    if (name.includes(sep)) {
      const parts = name.split(sep).map(p => p.trim());
      const ar = parts.find(p => hasArabic(p));
      const en = parts.find(p => !hasArabic(p));
      if (ar && en) return { en, ar };
      if (ar) return { en: '', ar: parts.join(' ') };
    }
  }
  // No separator — if whole string is Arabic return as ar
  if (hasArabic(name)) return { en: '', ar: name };
  return { en: name, ar: '' };
};

// Calculate ISO week (e.g. "2026-W33")
const getCurrentISOWeek = () => {
  const date = new Date();
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  const weekNum = 1 + Math.ceil((firstThursday - target) / 604800000);
  const year = date.getFullYear();
  return `${year}-W${String(weekNum).padStart(2, '0')}`;
};

const getWeekRange = (weekStr) => {
  if (!weekStr || !weekStr.includes('-W')) return { start: null, end: null };
  const [yearStr, weekNumStr] = weekStr.split('-W');
  const year = parseInt(yearStr, 10);
  const week = parseInt(weekNumStr, 10);
  if (isNaN(year) || isNaN(week)) return { start: null, end: null };

  const simple = new Date(Date.UTC(year, 0, 4));
  const dayOfWeek = simple.getUTCDay() || 7;
  const mondayOfWeek1 = new Date(simple);
  mondayOfWeek1.setUTCDate(simple.getUTCDate() - dayOfWeek + 1);

  const start = new Date(mondayOfWeek1);
  start.setUTCDate(mondayOfWeek1.getUTCDate() + (week - 1) * 7);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

const getMonthRange = (monthStr) => {
  if (!monthStr || !monthStr.includes('-')) return { start: null, end: null };
  const [yearStr, monthNumStr] = monthStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthNumStr, 10) - 1;
  if (isNaN(year) || isNaN(month)) return { start: null, end: null };

  const start = new Date(year, month, 1, 0, 0, 0, 0);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return { start, end };
};

const AdminSoldProducts = () => {
  const { isAdmin, isSuperAdmin } = useAuth();
  const [soldProducts, setSoldProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState(null);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState('active'); // 'active' | 'deleted' | 'all'
  const cardRef = useRef(null);

  // Attach customer modal state
  const [attachItem, setAttachItem] = useState(null);
  const [attachName, setAttachName] = useState('');
  const [attachPhone, setAttachPhone] = useState('');
  const [attaching, setAttaching] = useState(false);

  // Date selection states (today | specific-date | specific-week | specific-month | custom | all)
  const [dateFilterMode, setDateFilterMode] = useState('today');
  const [selectedDay, setSelectedDay] = useState(new Date().toISOString().split('T')[0]);
  const [selectedWeek, setSelectedWeek] = useState(getCurrentISOWeek());
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterTableByDate, setFilterTableByDate] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadSoldProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterTab, isAdmin]);

  const loadSoldProducts = async () => {
    try {
      setLoading(true);
      const params = isAdmin ? { includeDeleted: 'true' } : {};
      const { data } = await productAPI.getSoldProducts(params);
      setSoldProducts(data);
    } catch (error) {
      toast.error('Failed to load sold products');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSoldProduct = async (item) => {
    if (!window.confirm(`Are you sure you want to delete/revoke sold product (UOO: ${item.uooNumber})?\n\nThis will add 1 unit back to product stock.`)) return;
    try {
      await productAPI.deleteSoldProduct(item._id);
      toast.success(`Sold product record ${item.uooNumber} deleted and stock restored.`);
      loadSoldProducts();
    } catch (error) {
      toast.error(error.displayMessage || 'Failed to delete sold product');
    }
  };

  const handleRestoreSoldProduct = async (item) => {
    if (!window.confirm(`Are you sure you want to restore sold product (UOO: ${item.uooNumber})?\n\nThis will deduct 1 unit from stock if available.`)) return;
    try {
      await productAPI.restoreSoldProduct(item._id);
      toast.success(`Sold product record ${item.uooNumber} restored.`);
      loadSoldProducts();
    } catch (error) {
      toast.error(error.displayMessage || 'Failed to restore sold product');
    }
  };

  const handleViewCard = (item) => {
    setSelectedCard(item);
  };

  const openAttachModal = (item) => {
    setAttachItem(item);
    setAttachName(item.customerName || '');
    setAttachPhone(item.customerPhone || '');
  };

  const closeAttachModal = () => {
    setAttachItem(null);
    setAttachName('');
    setAttachPhone('');
  };

  const handleAttachCustomer = async () => {
    if (!attachItem) return;
    setAttaching(true);
    try {
      await productAPI.updateSoldProductCustomer(attachItem._id, {
        customerName: attachName.trim() || undefined,
        customerPhone: attachPhone.trim() || undefined
      });
      toast.success('Customer info attached to certificate');
      closeAttachModal();
      loadSoldProducts();
    } catch (error) {
      toast.error(error.displayMessage || 'Failed to attach customer info');
    } finally {
      setAttaching(false);
    }
  };

  const handlePrint = () => {
    window.__cardExportAllowed = true;
    window.print();
    window.__cardExportAllowed = false;
  };

  const handleDownloadImage = async (item) => {
    const cardEl = cardRef.current;
    if (!cardEl) return;

    window.__cardExportAllowed = true;

    let toastId;
    try {
      toastId = toast.loading('Generating premium authenticity card image...');

      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }

      const qrImg = cardEl.querySelector('.auth-qr-image-box img');
      if (qrImg && qrImg.src.startsWith('http')) {
        try {
          const response = await fetch(qrImg.src);
          const blob = await response.blob();
          const dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          qrImg.src = dataUrl;
        } catch (qrError) {
          console.warn('Failed to fetch QR image for html2canvas:', qrError);
        }
      }

      await new Promise(r => setTimeout(r, 60));

      const canvas = await html2canvas(cardEl, {
        useCORS: true,
        allowTaint: false,
        scale: 3,
        backgroundColor: '#14120f',
        logging: false
      });

      const link = document.createElement('a');
      link.download = `FirstEdition_Authenticity_${item.uooNumber}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast.update(toastId, {
        render: 'Card downloaded successfully!',
        type: 'success',
        isLoading: false,
        autoClose: 4000
      });
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate image. Try print or screenshot.');
    } finally {
      window.__cardExportAllowed = false;
    }
  };

  const getFilteredDateRange = () => {
    const today = new Date();
    if (dateFilterMode === 'today') {
      const start = new Date(today);
      start.setHours(0, 0, 0, 0);
      const end = new Date(today);
      end.setHours(23, 59, 59, 999);
      return {
        start,
        end,
        label: `Today (${today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })})`,
        fileTag: today.toISOString().split('T')[0]
      };
    }

    if (dateFilterMode === 'specific-date') {
      if (!selectedDay) return { start: null, end: null, label: 'No date selected', fileTag: 'date' };
      const [y, m, d] = selectedDay.split('-').map(Number);
      const start = new Date(y, m - 1, d, 0, 0, 0, 0);
      const end = new Date(y, m - 1, d, 23, 59, 59, 999);
      return {
        start,
        end,
        label: start.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }),
        fileTag: selectedDay
      };
    }

    if (dateFilterMode === 'specific-week') {
      const { start, end } = getWeekRange(selectedWeek);
      if (!start || !end) return { start: null, end: null, label: 'No week selected', fileTag: 'week' };
      const weekNum = selectedWeek.split('-W')[1] || selectedWeek;
      return {
        start,
        end,
        label: `Week ${weekNum} (${start.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} — ${end.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })})`,
        fileTag: `Week_${selectedWeek}`
      };
    }

    if (dateFilterMode === 'specific-month') {
      const { start, end } = getMonthRange(selectedMonth);
      if (!start || !end) return { start: null, end: null, label: 'No month selected', fileTag: 'month' };
      return {
        start,
        end,
        label: start.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
        fileTag: `Month_${selectedMonth}`
      };
    }

    if (dateFilterMode === 'custom') {
      const from = dateFrom ? new Date(dateFrom + 'T00:00:00') : null;
      const to = dateTo ? new Date(dateTo + 'T23:59:59.999') : null;
      const label = from && to
        ? `${from.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} — ${to.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`
        : 'Custom Range';
      const fileTag = from && to ? `${dateFrom}_${dateTo}` : 'custom';
      return { start: from, end: to, label, fileTag };
    }

    if (dateFilterMode === 'all') {
      return { start: null, end: null, label: 'All Recorded Sales', fileTag: 'All_Time' };
    }

    return { start: null, end: null, label: '', fileTag: 'export' };
  };

  const handleDownloadUUOPdf = async () => {
    const { start, end, label, fileTag } = getFilteredDateRange();
    if (dateFilterMode !== 'all' && (!start || !end)) {
      return toast.error('Please select a valid date or period');
    }

    setExporting(true);
    let toastId;
    try {
      toastId = toast.loading('Loading sold products for PDF...');

      const params = isAdmin ? { includeDeleted: 'true' } : {};
      if (start) params.dateFrom = start.toISOString();
      if (end) params.dateTo = end.toISOString();

      const { data } = await productAPI.getSoldProducts(params);
      const items = data.filter(sp => {
        if (!start || !end) return true;
        const d = new Date(sp.soldAt);
        return d >= start && d <= end;
      });

      if (items.length === 0) {
        toast.update(toastId, { render: `No sold products found for ${label}`, type: 'warning', isLoading: false, autoClose: 4000 });
        return;
      }

      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text('First Edition - UOO Numbers Report', 14, 20);
      doc.setFontSize(11);
      doc.text(`Period: ${label}`, 14, 28);
      doc.text(`Total Records: ${items.length}`, 14, 34);

      const tableColumn = ['#', 'Product Number', 'UOO Number', 'Product Name', 'Size', 'Customer', 'Phone', 'Date', 'Channel'];
      const tableRows = [];

      items.forEach((item, idx) => {
        const { en: nameEn } = parseProductName(item.productName || '');
        let cleanName = sanitizeForJsPDF(nameEn || item.productName || '');
        cleanName = cleanName.replace(/[/|\s-]+$/, '').trim();
        if (!cleanName) {
          cleanName = item.productNumber ? `Product #${item.productNumber}` : 'First Edition Item';
        }

        let cleanCustomer = sanitizeForJsPDF(item.customerName || '');
        if (!cleanCustomer) {
          cleanCustomer = item.customerName && !hasArabic(item.customerName) ? item.customerName : 'Direct Customer';
        }

        const row = [
          idx + 1,
          item.productNumber || '',
          item.uooNumber || '',
          cleanName.substring(0, 45),
          item.size || '',
          cleanCustomer.substring(0, 30),
          item.customerPhone || '-',
          new Date(item.soldAt).toLocaleDateString('en-GB'),
          item.saleChannel === 'amazon' ? 'Amazon' : 'Website'
        ];
        tableRows.push(row);
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 40,
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [26, 22, 18], textColor: [201, 169, 110], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [252, 251, 248] },
        margin: { left: 14, right: 14 }
      });

      doc.save(`FirstEdition_UOO_Report_${fileTag}.pdf`);
      toast.update(toastId, { render: 'UOO PDF downloaded successfully!', type: 'success', isLoading: false, autoClose: 4000 });
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate UOO PDF');
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadCardsZip = async () => {
    const { start, end, label, fileTag } = getFilteredDateRange();
    if (dateFilterMode !== 'all' && (!start || !end)) {
      return toast.error('Please select a valid date or period');
    }

    setExporting(true);
    let toastId;
    try {
      toastId = toast.loading('Loading sold products for cards...');

      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }

      const params = isAdmin ? { includeDeleted: 'true' } : {};
      if (start) params.dateFrom = start.toISOString();
      if (end) params.dateTo = end.toISOString();

      const { data } = await productAPI.getSoldProducts(params);
      const items = data.filter(sp => {
        if (!start || !end) return true;
        const d = new Date(sp.soldAt);
        return d >= start && d <= end;
      });

      if (items.length === 0) {
        toast.update(toastId, { render: `No sold products found for ${label}`, type: 'warning', isLoading: false, autoClose: 4000 });
        return;
      }

      toast.update(toastId, { render: `Generating ${items.length} card(s)...`, type: 'info', isLoading: true, autoClose: 0 });

      const zip = new JSZip();
      const tempContainer = document.createElement('div');
      tempContainer.style.cssText = 'position:fixed;top:0;left:0;width:600px;z-index:-9999;opacity:0;pointer-events:none;';
      document.body.appendChild(tempContainer);

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const cardHtml = buildCardHtml(item);
        tempContainer.innerHTML = cardHtml;

        const cardEl = tempContainer.firstElementChild;
        if (!cardEl) continue;

        const qrImg = cardEl.querySelector('.auth-qr-image-box img');
        if (qrImg && qrImg.src.startsWith('http')) {
          try {
            const response = await fetch(qrImg.src);
            const blob = await response.blob();
            const dataUrl = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
            qrImg.src = dataUrl;
          } catch (qrError) {
            console.warn('Failed to fetch QR image for card:', qrError);
          }
        }

        await new Promise(r => setTimeout(r, 40));

        const canvas = await html2canvas(cardEl, {
          useCORS: true,
          allowTaint: false,
          scale: 3,
          backgroundColor: '#14120f',
          logging: false
        });

        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        zip.file(`FirstEdition_Authenticity_${item.uooNumber}.png`, blob);

        if (i % 5 === 0 || i === items.length - 1) {
          toast.update(toastId, { render: `Generating cards... ${i + 1}/${items.length}`, type: 'info', isLoading: true, autoClose: 0 });
        }
      }

      document.body.removeChild(tempContainer);

      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `FirstEdition_Cards_${fileTag}.zip`);

      toast.update(toastId, { render: 'Cards ZIP downloaded successfully!', type: 'success', isLoading: false, autoClose: 4000 });
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate cards ZIP');
    } finally {
      setExporting(false);
    }
  };

  const buildCardHtml = (item) => {
    const { en, ar } = parseProductName(item.productName);
    const customerRow = (item.customerName || item.customerPhone)
      ? `<div style="background:#FFFFFF;padding:0.6rem 0.8rem;border-radius:6px;border:1px solid #C8A45D;margin-bottom:1rem;display:flex;justify-content:space-between;align-items:center">
          <div style="text-align:left">
            <span style="display:block;font-size:0.6rem;color:#C8A45D;font-weight:700;letter-spacing:1px">ISSUED TO CUSTOMER</span>
            <span style="display:block;font-size:0.85rem;color:#000000;font-weight:700;font-family:'Cairo','Inter',sans-serif;letter-spacing:0" dir="auto">${item.customerName || 'Direct Customer'}</span>
          </div>
          ${item.customerPhone ? `<span style="font-size:0.85rem;color:#000000;font-family:monospace;font-weight:700">${item.customerPhone}</span>` : ''}
        </div>`
      : '';
    const qrData = encodeURIComponent(`${window.location.origin}/verify?productNumber=${encodeURIComponent(item.productNumber)}&uoo=${encodeURIComponent(item.uooNumber)}`);

    return `
      <div class="auth-card" style="width:560px;padding:1.75rem 2rem 1.5rem;background:linear-gradient(135deg,#FCFBF8 0%,#F7F3EA 60%,#EFE8DC 100%);border:1px solid #D4AF37;border-radius:20px;color:#2C2416;font-family:sans-serif;box-sizing:border-box;position:relative">
        <div style="display:flex;flex-direction:column;align-items:center;gap:0.4rem;margin-bottom:1rem">
          <span style="font-size:0.8rem;font-weight:700;letter-spacing:0.3em;color:#1A1612;text-transform:uppercase">FIRST EDITION</span>
        </div>
        <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1rem">
          <div style="flex:1;height:1px;background:linear-gradient(90deg,transparent,#C8A45D 50%,transparent)"></div>
          <h2 style="font-family:Georgia,serif;font-size:1.15rem;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#8E6826;margin:0;white-space:nowrap">Certificate of Authenticity</h2>
          <div style="flex:1;height:1px;background:linear-gradient(90deg,transparent,#C8A45D 50%,transparent)"></div>
        </div>
        <div style="text-align:center;margin-bottom:1.25rem">
          ${en ? `<p style="font-family:Georgia,serif;font-size:1.75rem;font-weight:700;color:#1A1612;margin:0 0 0.35rem;direction:ltr;text-align:center;letter-spacing:-0.01em">${en}</p>` : ''}
          ${ar ? `<p style="font-family:'Cairo','Noto Naskh Arabic','Amiri',Tahoma,sans-serif;font-size:1.5rem;font-weight:700;color:#3A2E1E;margin:0.1rem 0 0.5rem;direction:rtl;text-align:center;letter-spacing:0" lang="ar" dir="rtl">${ar}</p>` : ''}
          ${!en && !ar ? `<p style="font-size:1.3rem;font-weight:700;color:#1A1612;margin:0;font-family:'Cairo','Noto Naskh Arabic','Amiri',sans-serif;text-align:center;letter-spacing:0" dir="auto">${item.productName}</p>` : ''}
          <span style="display:inline-block;background:#1A1612;color:#FCFBF8;padding:0.3rem 1.25rem;border-radius:50px;font-size:0.75rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin-top:0.5rem">Size ${item.size}</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.25rem">
          <div style="background:#FCFBF8;border:1px solid rgba(200,164,93,0.3);border-radius:12px;padding:1.25rem 1rem;text-align:center">
            <span style="display:block;font-size:0.65rem;font-weight:700;letter-spacing:0.12em;color:#7A6F5E;text-transform:uppercase;margin-bottom:0.4rem">PRODUCT NUMBER</span>
            <span style="display:block;font-size:1.2rem;font-weight:800;font-family:'Courier New',monospace;color:#2C2416;letter-spacing:0.05em">${item.productNumber}</span>
          </div>
          <div style="background:linear-gradient(135deg,#FCFBF8,#FBF8F0);border:1px dashed #C8A45D;border-radius:12px;padding:1.25rem 1rem;text-align:center">
            <span style="display:block;font-size:0.65rem;font-weight:700;letter-spacing:0.12em;color:#7A6F5E;text-transform:uppercase;margin-bottom:0.4rem">UOO NUMBER</span>
            <span style="display:block;font-size:1.3rem;font-weight:800;font-family:'Courier New',monospace;color:#8E6826;letter-spacing:0.1em">${item.uooNumber}</span>
            <span style="display:block;font-size:0.6rem;color:#C8A45D;margin-top:0.25rem;font-weight:600">Unique Original Order</span>
          </div>
        </div>
        ${customerRow}
        <div style="display:flex;align-items:center;justify-content:center;gap:2rem;margin-bottom:1.25rem;padding:0.85rem;background:rgba(200,164,93,0.06);border-radius:10px;border:1px solid rgba(200,164,93,0.12)">
          <div style="text-align:center">
            <span style="display:block;font-size:0.6rem;font-weight:700;letter-spacing:0.12em;color:#7A6F5E;text-transform:uppercase;margin-bottom:0.25rem">DATE OF SALE</span>
            <span style="display:block;font-size:0.8rem;font-weight:700;color:#1A1612">${new Date(item.soldAt).toLocaleDateString('en-GB',{day:'2-digit',month:'long',year:'numeric'})}</span>
          </div>
          <div style="width:1px;height:28px;background:rgba(200,164,93,0.25)"></div>
          <div style="text-align:center">
            <span style="display:block;font-size:0.6rem;font-weight:700;letter-spacing:0.12em;color:#7A6F5E;text-transform:uppercase;margin-bottom:0.25rem">VERIFIED BY</span>
            <span style="display:block;font-size:0.8rem;font-weight:700;color:#1A1612">${item.soldBy?.name || 'First Edition Team'}</span>
          </div>
        </div>
        <p style="font-size:0.7rem;color:#7A6F5E;text-align:center;line-height:1.6;margin:0 0 1.25rem;font-style:italic;max-width:90%;margin-left:auto;margin-right:auto">This card certifies that the item bearing the UOO Number above is a genuine First Edition product. This number is unique and cannot be replicated.</p>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:1.25rem;gap:1.5rem;border-top:1px dashed rgba(200,164,93,0.25);padding-top:1.25rem">
          <div style="width:54px;height:54px;border-radius:50%;background:linear-gradient(135deg,#ECC870 0%,#B88E3E 50%,#ECC870 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:0 0 0 3px #FCFBF8,0 0 0 4px #D4AF37,0 8px 20px rgba(184,142,62,0.2)">
            <span style="font-size:0.95rem;color:#FCFBF8">✦</span>
            <span style="font-size:0.45rem;font-weight:900;letter-spacing:0.15em;color:#FCFBF8">AUTHENTIC</span>
          </div>
          <div style="display:flex;align-items:center;gap:0.85rem;background:#FCFBF8;padding:0.5rem 0.75rem;border-radius:12px;border:1px solid rgba(200,164,93,0.35);box-shadow:inset 0 1px 3px rgba(0,0,0,0.02)">
            <div style="width:60px;height:60px;background:#fff;padding:2px;border:1px solid #E8E0D0;border-radius:6px;display:flex;align-items:center;justify-content:center">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${qrData}" alt="Verify QR" style="width:100%;height:100%;object-fit:contain" />
            </div>
            <div style="text-align:left">
              <span style="display:block;font-size:0.65rem;font-weight:700;color:#1A1612;letter-spacing:0.05em;text-transform:uppercase">Scan to Verify</span>
              <span style="display:block;font-size:0.55rem;color:#7A6F5E;margin-top:0.1rem;line-height:1.2">First Edition Security Registry</span>
            </div>
          </div>
        </div>
      </div>
    `;
  };

  const handleDownloadCardPdf = async (item) => {
    const cardEl = cardRef.current;
    if (!cardEl) return;

    window.__cardExportAllowed = true;
    let toastId;
    try {
      toastId = toast.loading('Generating PDF...');

      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }

      const qrImg = cardEl.querySelector('.auth-qr-image-box img');
      if (qrImg && qrImg.src.startsWith('http')) {
        try {
          const response = await fetch(qrImg.src);
          const blob = await response.blob();
          const dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          qrImg.src = dataUrl;
        } catch (qrError) {
          console.warn('Failed to fetch QR image for PDF:', qrError);
        }
      }

      await new Promise(r => setTimeout(r, 60));

      const canvas = await html2canvas(cardEl, {
        useCORS: true,
        allowTaint: false,
        scale: 3,
        backgroundColor: '#14120f',
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min((pdfWidth - 20) / imgWidth, (pdfHeight - 20) / imgHeight);
      const width = imgWidth * ratio;
      const height = imgHeight * ratio;
      const x = (pdfWidth - width) / 2;
      const y = (pdfHeight - height) / 2;

      pdf.addImage(imgData, 'PNG', x, y, width, height);
      pdf.save(`FirstEdition_Authenticity_${item.uooNumber}.pdf`);

      toast.update(toastId, { render: 'Card PDF downloaded successfully!', type: 'success', isLoading: false, autoClose: 4000 });
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate PDF. Try print or screenshot.');
    } finally {
      window.__cardExportAllowed = false;
    }
  };

  const { start: dateRangeStart, end: dateRangeEnd, label: dateRangeLabel } = getFilteredDateRange();

  const exportMatchingCount = soldProducts.filter(sp => {
    if (dateFilterMode === 'all' || !dateRangeStart || !dateRangeEnd) return true;
    const d = new Date(sp.soldAt);
    return d >= dateRangeStart && d <= dateRangeEnd;
  }).length;

  const filtered = soldProducts.filter(sp => {
    if (isAdmin) {
      if (filterTab === 'active' && sp.isDeleted) return false;
      if (filterTab === 'deleted' && !sp.isDeleted) return false;
    } else {
      if (sp.isDeleted) return false;
    }

    if (filterTableByDate && dateFilterMode !== 'all' && dateRangeStart && dateRangeEnd) {
      const itemDate = new Date(sp.soldAt);
      if (itemDate < dateRangeStart || itemDate > dateRangeEnd) return false;
    }

    const q = search.toLowerCase();
    return (
      sp.productName?.toLowerCase().includes(q) ||
      sp.productNumber?.toLowerCase().includes(q) ||
      sp.uooNumber?.toLowerCase().includes(q) ||
      sp.size?.toLowerCase().includes(q) ||
      sp.customerName?.toLowerCase().includes(q) ||
      sp.customerPhone?.toLowerCase().includes(q)
    );
  });

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

  const formatCardDate = (date) =>
    new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'long', year: 'numeric'
    });

  return (
    <div className="sold-products-page">
      <div className="container">
        {/* Header */}
        <div className="sp-header">
          <div className="sp-title-group">
            <h1 className="sp-title">Sold Products</h1>
            <p className="sp-subtitle">Authenticity records for every sold item</p>
          </div>
          <div className="sp-badge">{filtered.length} Sales</div>
        </div>

        {/* Admin Filter Tabs & Search Bar */}
        {isAdmin && (
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`sp-card-btn ${filterTab === 'active' ? 'active' : ''}`}
              style={{ background: filterTab === 'active' ? 'var(--dark-charcoal)' : 'var(--surface)', color: filterTab === 'active' ? '#fff' : 'var(--text-dark)', padding: '0.5rem 1rem' }}
              onClick={() => setFilterTab('active')}
            >
              Active Sales
            </button>
            <button
              type="button"
              className={`sp-card-btn ${filterTab === 'deleted' ? 'active' : ''}`}
              style={{ background: filterTab === 'deleted' ? '#C62828' : 'var(--surface)', color: filterTab === 'deleted' ? '#fff' : '#C62828', border: '1px solid #EF5350', padding: '0.5rem 1rem' }}
              onClick={() => setFilterTab('deleted')}
            >
              🗑️ Deleted Sales
            </button>
            <button
              type="button"
              className={`sp-card-btn ${filterTab === 'all' ? 'active' : ''}`}
              style={{ background: filterTab === 'all' ? 'var(--dark-charcoal)' : 'var(--surface)', color: filterTab === 'all' ? '#fff' : 'var(--text-dark)', padding: '0.5rem 1rem' }}
              onClick={() => setFilterTab('all')}
            >
              All Records
            </button>
          </div>
        )}

        {/* Search bar */}
        <div className="sp-search-wrap">
          <span className="sp-search-icon">🔍</span>
          <input
            className="sp-search"
            type="text"
            placeholder="Search by name, product number, UOO, or size…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Export tools (superadmin only) */}
        {isSuperAdmin && (
          <div style={{ background: '#fff', border: '1px solid #E8E0D0', borderRadius: '16px', padding: '1.25rem', marginBottom: '1.5rem', boxShadow: '0 2px 12px rgba(26,22,18,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.2rem' }}>📊</span>
                <strong style={{ color: '#1A1612', fontSize: '1.05rem' }}>Export & Printing Tools</strong>
                <span style={{ fontSize: '0.8rem', color: '#7A6F5E', marginLeft: '0.25rem' }}>Download certificates & reports for printing</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#FBF8F0', padding: '0.35rem 0.75rem', borderRadius: '8px', border: '1px solid #E8E0D0' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#8E6826' }}>
                  📦 {exportMatchingCount} item(s) in selected period
                </span>
              </div>
            </div>

            {/* Selection modes buttons */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <button
                type="button"
                className={`sp-card-btn ${dateFilterMode === 'today' ? 'active' : ''}`}
                style={dateFilterMode === 'today' ? { background: 'var(--dark-charcoal)', color: '#fff' } : { background: '#F5F0E8', color: '#1A1612' }}
                onClick={() => setDateFilterMode('today')}
              >
                📅 Today
              </button>
              <button
                type="button"
                className={`sp-card-btn ${dateFilterMode === 'specific-date' ? 'active' : ''}`}
                style={dateFilterMode === 'specific-date' ? { background: 'var(--dark-charcoal)', color: '#fff' } : { background: '#F5F0E8', color: '#1A1612' }}
                onClick={() => setDateFilterMode('specific-date')}
              >
                📆 Specific Date
              </button>
              <button
                type="button"
                className={`sp-card-btn ${dateFilterMode === 'specific-week' ? 'active' : ''}`}
                style={dateFilterMode === 'specific-week' ? { background: 'var(--dark-charcoal)', color: '#fff' } : { background: '#F5F0E8', color: '#1A1612' }}
                onClick={() => setDateFilterMode('specific-week')}
              >
                🗓️ Specific Week
              </button>
              <button
                type="button"
                className={`sp-card-btn ${dateFilterMode === 'specific-month' ? 'active' : ''}`}
                style={dateFilterMode === 'specific-month' ? { background: 'var(--dark-charcoal)', color: '#fff' } : { background: '#F5F0E8', color: '#1A1612' }}
                onClick={() => setDateFilterMode('specific-month')}
              >
                📊 Specific Month
              </button>
              <button
                type="button"
                className={`sp-card-btn ${dateFilterMode === 'custom' ? 'active' : ''}`}
                style={dateFilterMode === 'custom' ? { background: 'var(--dark-charcoal)', color: '#fff' } : { background: '#F5F0E8', color: '#1A1612' }}
                onClick={() => setDateFilterMode('custom')}
              >
                ↔️ Custom Range
              </button>
              <button
                type="button"
                className={`sp-card-btn ${dateFilterMode === 'all' ? 'active' : ''}`}
                style={dateFilterMode === 'all' ? { background: 'var(--dark-charcoal)', color: '#fff' } : { background: '#F5F0E8', color: '#1A1612' }}
                onClick={() => setDateFilterMode('all')}
              >
                🌐 All Time
              </button>
            </div>

            {/* Mode-specific input controls */}
            <div style={{ background: '#FAF8F5', border: '1px solid #EFE8DC', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' }}>
              {dateFilterMode === 'today' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#5C4E38', fontSize: '0.9rem' }}>
                  <span>📅</span>
                  <span>Active Selection: <strong>{dateRangeLabel}</strong></span>
                </div>
              )}

              {dateFilterMode === 'specific-date' && (
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#7A6F5E', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pick Day</label>
                    <input
                      type="date"
                      className="sell-select"
                      value={selectedDay}
                      onChange={e => setSelectedDay(e.target.value)}
                      style={{ padding: '0.55rem 0.85rem', background: '#fff', minWidth: '180px' }}
                    />
                  </div>
                  <div style={{ color: '#8E6826', fontSize: '0.88rem', fontWeight: '600', marginTop: '1.1rem' }}>
                    🗓️ Showing: {dateRangeLabel}
                  </div>
                </div>
              )}

              {dateFilterMode === 'specific-week' && (
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#7A6F5E', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pick Week</label>
                    <input
                      type="week"
                      className="sell-select"
                      value={selectedWeek}
                      onChange={e => setSelectedWeek(e.target.value)}
                      style={{ padding: '0.55rem 0.85rem', background: '#fff', minWidth: '180px' }}
                    />
                  </div>
                  <div style={{ color: '#8E6826', fontSize: '0.88rem', fontWeight: '600', marginTop: '1.1rem' }}>
                    🗓️ {dateRangeLabel}
                  </div>
                </div>
              )}

              {dateFilterMode === 'specific-month' && (
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#7A6F5E', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pick Month</label>
                    <input
                      type="month"
                      className="sell-select"
                      value={selectedMonth}
                      onChange={e => setSelectedMonth(e.target.value)}
                      style={{ padding: '0.55rem 0.85rem', background: '#fff', minWidth: '180px' }}
                    />
                  </div>
                  <div style={{ color: '#8E6826', fontSize: '0.88rem', fontWeight: '600', marginTop: '1.1rem' }}>
                    📊 {dateRangeLabel}
                  </div>
                </div>
              )}

              {dateFilterMode === 'custom' && (
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#7A6F5E', textTransform: 'uppercase', letterSpacing: '0.05em' }}>From</label>
                    <input
                      type="date"
                      className="sell-select"
                      value={dateFrom}
                      onChange={e => setDateFrom(e.target.value)}
                      style={{ padding: '0.55rem 0.75rem', background: '#fff' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#7A6F5E', textTransform: 'uppercase', letterSpacing: '0.05em' }}>To</label>
                    <input
                      type="date"
                      className="sell-select"
                      value={dateTo}
                      onChange={e => setDateTo(e.target.value)}
                      style={{ padding: '0.55rem 0.75rem', background: '#fff' }}
                    />
                  </div>
                  <div style={{ color: '#8E6826', fontSize: '0.88rem', fontWeight: '600', marginTop: '1.1rem' }}>
                    {dateRangeLabel}
                  </div>
                </div>
              )}

              {dateFilterMode === 'all' && (
                <div style={{ color: '#5C4E38', fontSize: '0.9rem' }}>
                  🌐 Exporting all sold products from day one.
                </div>
              )}

              {/* Checkbox to filter the page table as well */}
              <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed #E0D6C4' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: '#1A1612', fontWeight: '600' }}>
                  <input
                    type="checkbox"
                    checked={filterTableByDate}
                    onChange={e => setFilterTableByDate(e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#C9A96E' }}
                  />
                  Also filter the table list below by this selected period
                </label>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="card-action-btn card-action-btn--print"
                onClick={handleDownloadUUOPdf}
                disabled={exporting}
                style={{ flex: '0 1 auto', minWidth: '220px' }}
              >
                {exporting ? '⏳ Generating...' : '📋 Download UUO PDF Table'}
              </button>
              <button
                type="button"
                className="card-action-btn card-action-btn--image"
                onClick={handleDownloadCardsZip}
                disabled={exporting}
                style={{ flex: '0 1 auto', minWidth: '220px' }}
              >
                {exporting ? '⏳ Generating...' : '📦 Download Cards ZIP'}
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="sp-loading">
            <div className="sp-spinner" />
            <p>Loading records…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="sp-empty">
            <span className="sp-empty-icon">📦</span>
            <h3>{search ? 'No matches found' : 'No sales recorded yet'}</h3>
            <p>{search ? 'Try a different search term.' : 'Sold items will appear here after the first sale.'}</p>
          </div>
        ) : (
          <div className="sp-table-wrap">
            <table className="sp-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Product #</th>
                  <th>UOO Number</th>
                  <th>Size</th>
                  <th>Channel</th>
                  <th>Customer Info</th>
                  <th>Sold By</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <tr key={item._id} style={item.isDeleted ? { opacity: 0.75, background: 'rgba(255, 235, 238, 0.3)' } : {}}>
                    <td>
                      <div className="sp-product-cell">
                        {item.product?.images?.[0]?.url && (
                          <img
                            className="sp-thumb"
                            src={item.product.images[0].url}
                            alt={item.productName}
                          />
                        )}
                        <span className="sp-product-name">
                          {item.productName}
                          {item.isDeleted && (
                            <span style={{
                              display: 'inline-block',
                              padding: '0.15rem 0.4rem',
                              borderRadius: '4px',
                              fontSize: '0.65rem',
                              fontWeight: '700',
                              background: '#FFEBEE',
                              color: '#C62828',
                              marginLeft: '0.4rem'
                            }}>DELETED</span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="sp-product-num">{item.productNumber}</span>
                    </td>
                    <td>
                      <span className="sp-uoo" style={item.isDeleted ? { textDecoration: 'line-through', color: '#888' } : {}}>{item.uooNumber}</span>
                    </td>
                    <td>
                      <div className="sp-specs" style={{ display: 'flex', gap: '0.4rem', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <span className="sp-size-badge" style={{ minWidth: '32px', textAlign: 'center' }}>Size {item.size}</span>
                        {item.color && (
                          <span className="sp-color-badge" style={{
                            display: 'inline-block',
                            padding: '0.2rem 0.5rem',
                            background: '#F0EAE0',
                            color: '#5C4E38',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            textTransform: 'uppercase'
                          }}>{item.color}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.6rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        background: item.saleChannel === 'amazon' ? '#FFF3E0' : '#E8F5E9',
                        color: item.saleChannel === 'amazon' ? '#E65100' : '#2E7D32',
                        border: `1px solid ${item.saleChannel === 'amazon' ? '#FF9900' : '#4CAF50'}`
                      }}>
                        {item.saleChannel === 'amazon' ? '📦 Amazon' : '🌐 Website'}
                      </span>
                    </td>
                    <td>
                      <div className="sp-customer-cell" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <span style={{ fontWeight: '700', color: '#000000', fontSize: '0.85rem' }}>
                          {item.customerName || 'Direct Customer'}
                        </span>
                        {item.customerPhone ? (
                          <span style={{ fontSize: '0.75rem', color: '#000000', fontFamily: 'monospace', fontWeight: '700' }}>
                            📞 {item.customerPhone}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#888888', fontStyle: 'italic' }}>No phone recorded</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="sp-sold-by">{item.soldBy?.name || 'Admin'}</span>
                    </td>
                    <td>
                      <span className="sp-date">{formatDate(item.soldAt)}</span>
                    </td>
                    <td>
                      <button
                        className="sp-card-btn"
                        onClick={() => handleViewCard(item)}
                        title="View Authenticity Card"
                      >
                        🪹 View Card
                      </button>
                      {item.saleChannel === 'amazon' && !item.isDeleted && (
                        <button
                          className="sp-card-btn"
                          style={{ marginTop: '0.4rem', background: '#FFF3E0', color: '#E65100', border: '1px solid #FF9900' }}
                          onClick={() => openAttachModal(item)}
                          title="Attach buyer info to certificate"
                        >
                          👤 Attach Customer
                        </button>
                      )}
                      {isAdmin && (
                        item.isDeleted ? (
                          <button
                            className="sp-card-btn"
                            style={{ marginTop: '0.4rem', background: '#E8F5E9', color: '#2E7D32', border: '1px solid #4CAF50' }}
                            onClick={() => handleRestoreSoldProduct(item)}
                            title="Restore this deleted sale"
                          >
                            🔄 Restore
                          </button>
                        ) : (
                          <button
                            className="sp-card-btn"
                            style={{ marginTop: '0.4rem', background: '#FFEBEE', color: '#C62828', border: '1px solid #EF5350' }}
                            onClick={() => handleDeleteSoldProduct(item)}
                            title="Delete/revoke this sale"
                          >
                            🗑️ Delete
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Card Modal */}
      {selectedCard && (
        <div className="card-overlay" onClick={() => setSelectedCard(null)}>
          <div className="card-modal" onClick={e => e.stopPropagation()}>
            <button className="card-close" onClick={() => setSelectedCard(null)}>✕</button>

            {/* The printable card */}
            <div className="auth-card" ref={cardRef} id="printable-card">
              {/* Card background decorations */}
              <div className="auth-card-bg-circle auth-card-bg-circle--1" data-html2canvas-ignore="true" />
              <div className="auth-card-bg-circle auth-card-bg-circle--2" data-html2canvas-ignore="true" />

              {/* Logo / Brand */}
              <div className="auth-card-logo">
                <img src="/logo.png" alt="First Edition" className="auth-logo-img" onError={e => e.target.style.display='none'} />
                <span className="auth-brand">FIRST EDITION</span>
              </div>

              {/* Title */}
              <div className="auth-card-title-row">
                <div className="auth-divider" />
                <h2 className="auth-card-title">Certificate of Authenticity</h2>
                <div className="auth-divider" />
              </div>

              {/* Product info */}
              <div className="auth-product-info">
                {(() => {
                  const { en, ar } = parseProductName(selectedCard.productName);
                  return (
                    <>
                      {en && (
                        <p className="auth-product-name auth-product-name--en" dir="ltr">
                          {en}
                        </p>
                      )}
                      {ar && (
                        <p className="auth-product-name auth-product-name--ar" dir="rtl" lang="ar">
                          {ar}
                        </p>
                      )}
                      {!en && !ar && (
                        <p className="auth-product-name" dir="auto">
                          {selectedCard.productName}
                        </p>
                      )}
                    </>
                  );
                })()}
                <span className="auth-size-tag">Size {selectedCard.size}</span>
              </div>

              {/* Numbers grid */}
              <div className="auth-numbers-grid">
                <div className="auth-number-block auth-number-block--product">
                  <span className="auth-number-label">PRODUCT NUMBER</span>
                  <span className="auth-number-value">{selectedCard.productNumber}</span>
                </div>
                <div className="auth-number-block auth-number-block--uoo">
                  <span className="auth-number-label">UOO NUMBER</span>
                  <span className="auth-number-value auth-uoo-value">{selectedCard.uooNumber}</span>
                  <span className="auth-number-sub">Unique Original Order</span>
                </div>
              </div>

              {/* Customer Info Row if available */}
              {(selectedCard.customerName || selectedCard.customerPhone) && (
                <div className="auth-customer-row" style={{
                  background: '#FFFFFF',
                  padding: '0.6rem 0.8rem',
                  borderRadius: '6px',
                  border: '1px solid #C8A45D',
                  marginBottom: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ textAlign: 'left' }}>
                    <span style={{ display: 'block', fontSize: '0.6rem', color: '#C8A45D', fontWeight: '700', letterSpacing: '1px' }}>ISSUED TO CUSTOMER</span>
                    <span style={{ display: 'block', fontSize: '0.85rem', color: '#000000', fontWeight: '700' }}>{selectedCard.customerName || 'Direct Customer'}</span>
                  </div>
                  {selectedCard.customerPhone && (
                    <span style={{ fontSize: '0.85rem', color: '#000000', fontFamily: 'monospace', fontWeight: '700' }}>
                      {selectedCard.customerPhone}
                    </span>
                  )}
                </div>
              )}

              {/* Date & Sold by */}
              <div className="auth-footer-row">
                <div className="auth-footer-item">
                  <span className="auth-footer-label">DATE OF SALE</span>
                  <span className="auth-footer-value">{formatCardDate(selectedCard.soldAt)}</span>
                </div>
                <div className="auth-footer-sep" />
                <div className="auth-footer-item">
                  <span className="auth-footer-label">VERIFIED BY</span>
                  <span className="auth-footer-value">{selectedCard.soldBy?.name || 'First Edition Team'}</span>
                </div>
                </div>

              {/* Authenticity note */}
              <p className="auth-guarantee">
                This card certifies that the item bearing the UOO Number above is a genuine
                First Edition product. This number is unique and cannot be replicated.
              </p>

              {/* Bottom security row (Seal & QR Code) */}
              <div className="auth-security-row" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '1.25rem',
                gap: '1.5rem',
                borderTop: '1px dashed rgba(200,164,93,0.25)',
                paddingTop: '1.25rem'
              }}>
                {/* Gold seal */}
                <div className="auth-seal" style={{ margin: 0 }}>
                  <div className="auth-seal-inner">
                    <span className="auth-seal-icon">✦</span>
                    <span className="auth-seal-text">AUTHENTIC</span>
                  </div>
                </div>

                {/* QR Code */}
                <div className="auth-qrcode-wrap" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  background: '#FCFBF8',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '12px',
                  border: '1px solid rgba(200, 164, 93, 0.35)',
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.02)'
                }}>
                  <div className="auth-qr-image-box" style={{
                    width: '60px',
                    height: '60px',
                    background: '#fff',
                    padding: '2px',
                    border: '1px solid #E8E0D0',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
                        `${window.location.origin}/verify?productNumber=${encodeURIComponent(selectedCard.productNumber)}&uoo=${encodeURIComponent(selectedCard.uooNumber)}`
                      )}`}
                      alt="Verify QR"
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </div>
                  <div className="auth-qr-text-box" style={{ textAlign: 'left' }}>
                    <span style={{
                      display: 'block',
                      fontSize: '0.65rem',
                      fontWeight: '700',
                      color: '#1A1612',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase'
                    }}>Scan to Verify</span>
                    <span style={{
                      display: 'block',
                      fontSize: '0.55rem',
                      color: '#7A6F5E',
                      marginTop: '0.1rem',
                      lineHeight: 1.2
                    }}>First Edition Security Registry</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="card-actions">
              <button className="card-action-btn card-action-btn--print" onClick={handlePrint}>
                🖨️ Print
              </button>
              <button className="card-action-btn card-action-btn--image" onClick={() => handleDownloadImage(selectedCard)}>
                📥 Download Image
              </button>
              <button className="card-action-btn card-action-btn--print" onClick={() => handleDownloadCardPdf(selectedCard)} style={{ border: '1px solid #D4AF37', background: '#FCFBF8' }}>
                📄 Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Attach Customer Modal (Amazon sales) */}
      {attachItem && (
        <div className="card-overlay" onClick={closeAttachModal}>
          <div className="card-modal" style={{ maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
            <button className="card-close" onClick={closeAttachModal}>✕</button>
            <h2 style={{ marginBottom: '0.25rem' }}>👤 Attach Customer Info</h2>
            <p style={{ fontSize: '0.85rem', color: '#7A6F5E', marginBottom: '1.25rem' }}>
              Amazon sale — UOO: <strong>{attachItem.uooNumber}</strong>
            </p>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem' }}>Customer Name</label>
              <input
                type="text"
                className="sell-select"
                placeholder="e.g. Ahmed Hassan"
                value={attachName}
                onChange={e => setAttachName(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem' }}>Customer Phone</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ padding: '0.8rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', fontWeight: '600', fontSize: '0.9rem' }}>🇪🇬 +20</span>
                <input
                  type="tel"
                  className="sell-select"
                  placeholder="e.g. 01012345678"
                  value={attachPhone}
                  onChange={e => setAttachPhone(e.target.value)}
                  style={{ flex: 1 }}
                />
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="btn-confirm-sell"
                style={{ background: '#FF9900', borderColor: '#FF9900' }}
                onClick={handleAttachCustomer}
                disabled={attaching || (!attachName.trim() && !attachPhone.trim())}
              >
                {attaching ? 'Saving...' : 'Save to Certificate'}
              </button>
              <button className="btn-cancel-sell" onClick={closeAttachModal} disabled={attaching}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSoldProducts;
