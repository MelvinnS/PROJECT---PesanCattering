/**
 * Generator ESC/POS untuk Printer Thermal 58mm (Algoo / POS-58)
 * Karakter per baris: 32 karakter (standar kertas 58mm)
 */

export const LINE_WIDTH = 32;

// ESC/POS Commands
const ESC = "\x1B";
const GS = "\x1D";

const CMD = {
  INIT: `${ESC}@`,
  ALIGN_LEFT: `${ESC}a\x00`,
  ALIGN_CENTER: `${ESC}a\x01`,
  ALIGN_RIGHT: `${ESC}a\x02`,
  BOLD_ON: `${ESC}E\x01`,
  BOLD_OFF: `${ESC}E\x00`,
  DOUBLE_HEIGHT_ON: `${GS}!\x01`,
  DOUBLE_WIDTH_ON: `${GS}!\x10`,
  DOUBLE_ON: `${GS}!\x11`,
  NORMAL: `${GS}!\x00`,
  FEED_LINES: (n: number) => `${ESC}d${String.fromCharCode(n)}`,
  CUT: `${GS}V\x41\x00`,
};

/**
 * Membersihkan karakter non-ASCII dan unicode yang tidak didukung printer thermal
 */
export function sanitizeAscii(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Hilangkan diakritik
    .replace(/[^\x20-\x7E\n]/g, " ") // Hanya simpan karakter ASCII tercetak
    .replace(/\s+/g, " ");
}

/**
 * Memotong atau membungkus teks panjang agar pas dengan lebar kolom
 */
export function wrapText(text: string, maxWidth: number = LINE_WIDTH): string[] {
  const words = sanitizeAscii(text).split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if (!word) continue;
    if ((currentLine + (currentLine ? " " : "") + word).length <= maxWidth) {
      currentLine += (currentLine ? " " : "") + word;
    } else {
      if (currentLine) lines.push(currentLine);
      if (word.length > maxWidth) {
        // Potong kata yang lebih panjang dari lebar kolom
        for (let i = 0; i < word.length; i += maxWidth) {
          lines.push(word.substring(i, i + maxWidth));
        }
        currentLine = "";
      } else {
        currentLine = word;
      }
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Format 2 kolom (kiri - kanan rata pinggir)
 * Contoh: "Ayam Goreng       Rp 28.000"
 */
export function formatRow(left: string, right: string, width: number = LINE_WIDTH): string {
  const cleanLeft = sanitizeAscii(left);
  const cleanRight = sanitizeAscii(right);
  const spaceNeeded = width - cleanLeft.length - cleanRight.length;

  if (spaceNeeded >= 0) {
    return cleanLeft + " ".repeat(spaceNeeded) + cleanRight + "\n";
  }

  // Jika tidak muat dalam 1 baris, wrap teks kiri
  const leftLines = wrapText(cleanLeft, width - cleanRight.length - 1);
  let res = "";
  for (let i = 0; i < leftLines.length - 1; i++) {
    res += leftLines[i] + "\n";
  }
  const lastLeft = leftLines[leftLines.length - 1] || "";
  const lastSpace = width - lastLeft.length - cleanRight.length;
  res += lastLeft + " ".repeat(Math.max(1, lastSpace)) + cleanRight + "\n";
  return res;
}

/**
 * Garis pemisah garis putus-putus
 */
export function separator(char: string = "-", width: number = LINE_WIDTH): string {
  return char.repeat(width) + "\n";
}

export interface ReceiptData {
  storeName: string;
  orderNumber: string;
  customerCode: string;
  customerName: string;
  waNumber: string;
  address: string;
  orderDate: string;
  paymentMethod: string;
  paymentStatus: string;
  note?: string | null;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    subtotal: number;
    note?: string | null;
  }>;
  subtotal: number;
  deliveryFee: number;
  total: number;
}

/**
 * Menyusun data ESC/POS lengkap untuk struk pesanan
 */
export function generateOrderReceiptEscpos(data: ReceiptData): string {
  let esc = "";

  // Inisialisasi
  esc += CMD.INIT;

  // Header Toko (Tengah & Tebal)
  esc += CMD.ALIGN_CENTER;
  esc += CMD.BOLD_ON;
  esc += CMD.DOUBLE_HEIGHT_ON;
  esc += sanitizeAscii(data.storeName.toUpperCase()) + "\n";
  esc += CMD.NORMAL;
  esc += CMD.BOLD_OFF;
  esc += "Katering Masakan Harian\n";
  esc += separator("=");

  // Info Pesanan (Rata Kiri)
  esc += CMD.ALIGN_LEFT;
  esc += `No. Pesanan: ${data.orderNumber}\n`;
  esc += `ID Pelanggan: ${data.customerCode}\n`;
  esc += `Tanggal    : ${data.orderDate}\n`;
  esc += separator("-");

  // Data Pelanggan & Alamat LENGKAP
  esc += CMD.BOLD_ON;
  esc += `Penerima: ${sanitizeAscii(data.customerName)}\n`;
  esc += CMD.BOLD_OFF;
  esc += `No. WA  : +${data.waNumber}\n`;
  esc += "Alamat Pengantaran:\n";
  const addrLines = wrapText(data.address, LINE_WIDTH);
  for (const line of addrLines) {
    esc += `  ${line}\n`;
  }
  esc += separator("-");

  // Rincian Item Masakan
  esc += CMD.BOLD_ON;
  esc += formatRow("MENU", "TOTAL");
  esc += CMD.BOLD_OFF;

  for (const item of data.items) {
    const itemHeader = `${item.quantity}x ${item.name}`;
    const priceStr = `Rp ${item.subtotal.toLocaleString("id-ID")}`;
    esc += formatRow(itemHeader, priceStr);

    if (item.note) {
      const noteLines = wrapText(`(Catatan: ${item.note})`, LINE_WIDTH - 2);
      for (const nl of noteLines) {
        esc += `  ${nl}\n`;
      }
    }
  }

  // Catatan Khusus Pesanan
  if (data.note) {
    esc += separator("-");
    esc += "Catatan Dapur:\n";
    const orderNoteLines = wrapText(data.note, LINE_WIDTH);
    for (const onl of orderNoteLines) {
      esc += `  ${onl}\n`;
    }
  }

  // Ringkasan Pembayaran
  esc += separator("-");
  esc += formatRow("Subtotal", `Rp ${data.subtotal.toLocaleString("id-ID")}`);
  esc += formatRow("Ongkir", `Rp ${data.deliveryFee.toLocaleString("id-ID")}`);
  esc += CMD.BOLD_ON;
  esc += formatRow("TOTAL", `Rp ${data.total.toLocaleString("id-ID")}`);
  esc += CMD.BOLD_OFF;
  esc += separator("-");

  // Metode & Status Bayar
  esc += `Pembayaran : ${data.paymentMethod.toUpperCase()}\n`;
  esc += `Status Bayar: ${data.paymentStatus.toUpperCase()}\n`;
  esc += separator("=");

  // Footer
  esc += CMD.ALIGN_CENTER;
  esc += "Terima Kasih!\n";
  esc += "Selamat Menikmati Hidangan Kami\n";
  esc += CMD.FEED_LINES(3);

  return esc;
}

/**
 * Menyusun data ESC/POS untuk Rekap Masak Dapur
 */
export function generateCookingRecapEscpos(
  dateFormatted: string,
  recapItems: Array<{ menuName: string; totalPortions: number }>,
  orderNotes: Array<{ orderNumber: string; note: string }>
): string {
  let esc = "";
  esc += CMD.INIT;
  esc += CMD.ALIGN_CENTER;
  esc += CMD.BOLD_ON;
  esc += "REKAP MASAK DAPUR\n";
  esc += CMD.BOLD_OFF;
  esc += `Tanggal: ${dateFormatted}\n`;
  esc += separator("=");

  esc += CMD.ALIGN_LEFT;
  esc += CMD.BOLD_ON;
  esc += formatRow("NAMA MENU", "PORSI");
  esc += CMD.BOLD_OFF;
  esc += separator("-");

  let grandTotal = 0;
  for (const item of recapItems) {
    grandTotal += item.totalPortions;
    esc += CMD.BOLD_ON;
    esc += formatRow(item.menuName, `${item.totalPortions} porsi`);
    esc += CMD.BOLD_OFF;
  }

  esc += separator("=");
  esc += CMD.BOLD_ON;
  esc += formatRow("TOTAL PORSI", `${grandTotal} porsi`);
  esc += CMD.BOLD_OFF;

  // Catatan Khusus dari Pesanan
  if (orderNotes.length > 0) {
    esc += separator("-");
    esc += CMD.BOLD_ON;
    esc += "CATATAN KHUSUS PELANGGAN:\n";
    esc += CMD.BOLD_OFF;

    for (const n of orderNotes) {
      esc += `* ${n.orderNumber}:\n`;
      const lines = wrapText(n.note, LINE_WIDTH - 2);
      for (const l of lines) {
        esc += `  ${l}\n`;
      }
    }
  }

  esc += separator("=");
  esc += CMD.ALIGN_CENTER;
  esc += "DK CATERING - SIAP MASAK\n";
  esc += CMD.FEED_LINES(3);

  return esc;
}

/**
 * Menghasilkan URL scheme `rawbt:base64,...` untuk integrasi cetak Android RawBT
 */
export function createRawbtUrl(escposString: string): string {
  // Ubah string ESC/POS ke binary buffer lalu base64
  const bytes = new Uint8Array(escposString.length);
  for (let i = 0; i < escposString.length; i++) {
    bytes[i] = escposString.charCodeAt(i) & 0xff;
  }
  
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  
  const base64 = btoa(binary);
  return `rawbt:base64,${base64}`;
}
