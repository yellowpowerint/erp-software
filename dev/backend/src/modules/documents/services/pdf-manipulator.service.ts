import { Injectable, BadRequestException } from '@nestjs/common';
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import sharp from 'sharp';

export type PageNumberPosition =
  | 'bottom-right'
  | 'bottom-center'
  | 'bottom-left'
  | 'top-right'
  | 'top-center'
  | 'top-left';

export type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink';

@Injectable()
export class PdfManipulatorService {
  async mergePDFs(buffers: Buffer[]): Promise<Buffer> {
    if (!buffers || buffers.length < 2) {
      throw new BadRequestException('At least two PDFs are required to merge');
    }

    const merged = await PDFDocument.create();

    for (const buffer of buffers) {
      const doc = await PDFDocument.load(buffer);
      const copiedPages = await merged.copyPages(doc, doc.getPageIndices());
      for (const page of copiedPages) {
        merged.addPage(page);
      }
    }

    const bytes = await merged.save({ useObjectStreams: true });
    return Buffer.from(bytes);
  }

  async extractPages(buffer: Buffer, pages: number[]): Promise<Buffer> {
    const src = await PDFDocument.load(buffer);
    const total = src.getPageCount();

    const indices = this.normalizeUniquePageIndices(pages, total);

    const out = await PDFDocument.create();
    const copied = await out.copyPages(src, indices);
    for (const page of copied) {
      out.addPage(page);
    }

    const bytes = await out.save({ useObjectStreams: true });
    return Buffer.from(bytes);
  }

  async reorderPages(buffer: Buffer, order: number[]): Promise<Buffer> {
    const src = await PDFDocument.load(buffer);
    const total = src.getPageCount();

    if (!order || order.length !== total) {
      throw new BadRequestException(`order must contain exactly ${total} entries`);
    }

    const indices = this.normalizeUniquePageIndices(order, total);

    const out = await PDFDocument.create();
    const copied = await out.copyPages(src, indices);
    for (const page of copied) {
      out.addPage(page);
    }

    const bytes = await out.save({ useObjectStreams: true });
    return Buffer.from(bytes);
  }

  async rotatePages(buffer: Buffer, rotationDegrees: number, pages?: number[]): Promise<Buffer> {
    const doc = await PDFDocument.load(buffer);
    const total = doc.getPageCount();

    const normalizedRotation = this.normalizeRightAngleRotation(rotationDegrees);

    const indices = pages && pages.length > 0 ? this.normalizeUniquePageIndices(pages, total) : doc.getPageIndices();

    for (const index of indices) {
      const page = doc.getPage(index);
      page.setRotation(degrees(normalizedRotation));
    }

    const bytes = await doc.save({ useObjectStreams: true });
    return Buffer.from(bytes);
  }

  async annotateText(
    buffer: Buffer,
    options: {
      text: string;
      page: number;
      x: number;
      y: number;
      fontSize?: number;
      rotationDegrees?: number;
    },
  ): Promise<Buffer> {
    const text = (options.text || '').trim();
    if (!text) {
      throw new BadRequestException('text is required');
    }

    if (!Number.isFinite(options.page) || options.page < 1) {
      throw new BadRequestException('page must be >= 1');
    }

    if (![options.x, options.y].every((v) => Number.isFinite(v))) {
      throw new BadRequestException('x and y are required');
    }

    const doc = await PDFDocument.load(buffer);
    const pages = doc.getPages();

    const pageIndex = Math.floor(options.page) - 1;
    if (pageIndex < 0 || pageIndex >= pages.length) {
      throw new BadRequestException('Invalid page');
    }

    const font = await doc.embedFont(StandardFonts.Helvetica);
    const fontSize = Number.isFinite(options.fontSize) ? (options.fontSize as number) : 12;
    const rotation = degrees(this.normalizeAngle(options.rotationDegrees ?? 0));

    const page = pages[pageIndex];
    page.drawText(text, {
      x: options.x,
      y: options.y,
      size: fontSize,
      font,
      rotate: rotation,
      color: rgb(0.1, 0.1, 0.1),
    });

    const bytes = await doc.save({ useObjectStreams: true });
    return Buffer.from(bytes);
  }

  async highlight(
    buffer: Buffer,
    options: {
      page: number;
      x: number;
      y: number;
      width: number;
      height: number;
      color?: HighlightColor;
      opacity?: number;
    },
  ): Promise<Buffer> {
    if (!Number.isFinite(options.page) || options.page < 1) {
      throw new BadRequestException('page must be >= 1');
    }

    if (![options.x, options.y, options.width, options.height].every((v) => Number.isFinite(v))) {
      throw new BadRequestException('x, y, width, height are required');
    }

    const doc = await PDFDocument.load(buffer);
    const pages = doc.getPages();

    const pageIndex = Math.floor(options.page) - 1;
    if (pageIndex < 0 || pageIndex >= pages.length) {
      throw new BadRequestException('Invalid page');
    }

    const page = pages[pageIndex];
    const opacity = Number.isFinite(options.opacity) ? Math.max(0, Math.min(1, options.opacity as number)) : 0.35;
    const color = this.resolveHighlightColor(options.color);

    page.drawRectangle({
      x: options.x,
      y: options.y,
      width: options.width,
      height: options.height,
      color,
      opacity,
      borderWidth: 0,
    });

    const bytes = await doc.save({ useObjectStreams: true });
    return Buffer.from(bytes);
  }

  async addPageNumbers(
    buffer: Buffer,
    options: {
      position?: PageNumberPosition;
      startAt?: number;
      fontSize?: number;
      margin?: number;
    } = {},
  ): Promise<Buffer> {
    const doc = await PDFDocument.load(buffer);
    const pages = doc.getPages();

    const font = await doc.embedFont(StandardFonts.Helvetica);
    const position = options.position || 'bottom-right';
    const startAt = Number.isFinite(options.startAt) ? (options.startAt as number) : 1;
    const fontSize = Number.isFinite(options.fontSize) ? (options.fontSize as number) : 10;
    const margin = Number.isFinite(options.margin) ? (options.margin as number) : 24;

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const { width, height } = page.getSize();
      const label = `${startAt + i} / ${startAt + pages.length - 1}`;
      const textWidth = font.widthOfTextAtSize(label, fontSize);

      const { x, y } = this.resolvePosition(position, width, height, textWidth, fontSize, margin);

      page.drawText(label, {
        x,
        y,
        size: fontSize,
        font,
        color: rgb(0.25, 0.25, 0.25),
      });
    }

    const bytes = await doc.save({ useObjectStreams: true });
    return Buffer.from(bytes);
  }

  async addHeaderFooter(
    buffer: Buffer,
    options: {
      headerText?: string;
      footerText?: string;
      fontSize?: number;
      margin?: number;
    } = {},
  ): Promise<Buffer> {
    const doc = await PDFDocument.load(buffer);
    const pages = doc.getPages();

    const font = await doc.embedFont(StandardFonts.Helvetica);
    const headerText = (options.headerText || '').trim();
    const footerText = (options.footerText || '').trim();
    const fontSize = Number.isFinite(options.fontSize) ? (options.fontSize as number) : 10;
    const margin = Number.isFinite(options.margin) ? (options.margin as number) : 24;

    for (const page of pages) {
      const { width, height } = page.getSize();

      if (headerText) {
        page.drawText(headerText, {
          x: margin,
          y: height - margin - fontSize,
          size: fontSize,
          font,
          color: rgb(0.15, 0.15, 0.15),
        });
      }

      if (footerText) {
        page.drawText(footerText, {
          x: margin,
          y: margin / 2,
          size: fontSize,
          font,
          color: rgb(0.15, 0.15, 0.15),
        });
      }
    }

    const bytes = await doc.save({ useObjectStreams: true });
    return Buffer.from(bytes);
  }

  async watermark(
    buffer: Buffer,
    options: {
      text: string;
      opacity?: number;
      rotationDegrees?: number;
      fontSize?: number;
    },
  ): Promise<Buffer> {
    const text = (options.text || '').trim();
    if (!text) {
      throw new BadRequestException('watermark text is required');
    }

    const doc = await PDFDocument.load(buffer);
    const pages = doc.getPages();

    const font = await doc.embedFont(StandardFonts.HelveticaBold);
    const opacity = Number.isFinite(options.opacity) ? Math.max(0, Math.min(1, options.opacity as number)) : 0.15;
    const rotation = degrees(this.normalizeAngle(options.rotationDegrees ?? -35));
    const fontSize = Number.isFinite(options.fontSize) ? (options.fontSize as number) : 72;

    for (const page of pages) {
      const { width, height } = page.getSize();

      const textWidth = font.widthOfTextAtSize(text, fontSize);
      const x = (width - textWidth) / 2;
      const y = height / 2;

      page.drawText(text, {
        x,
        y,
        size: fontSize,
        font,
        rotate: rotation,
        opacity,
        color: rgb(0.2, 0.2, 0.2),
      });
    }

    const bytes = await doc.save({ useObjectStreams: true });
    return Buffer.from(bytes);
  }

  async stamp(
    buffer: Buffer,
    options: {
      text: string;
      page?: number;
      x?: number;
      y?: number;
      fontSize?: number;
      rotationDegrees?: number;
    },
  ): Promise<Buffer> {
    const text = (options.text || '').trim();
    if (!text) {
      throw new BadRequestException('stamp text is required');
    }

    const doc = await PDFDocument.load(buffer);
    const pages = doc.getPages();

    const pageIndex = Number.isFinite(options.page) ? Math.max(0, (options.page as number) - 1) : 0;
    if (pageIndex < 0 || pageIndex >= pages.length) {
      throw new BadRequestException('Invalid page number for stamp');
    }

    const font = await doc.embedFont(StandardFonts.HelveticaBold);
    const fontSize = Number.isFinite(options.fontSize) ? (options.fontSize as number) : 36;
    const rotation = degrees(this.normalizeAngle(options.rotationDegrees ?? 0));

    const target = pages[pageIndex];
    const { width, height } = target.getSize();

    const x = Number.isFinite(options.x) ? (options.x as number) : width - 220;
    const y = Number.isFinite(options.y) ? (options.y as number) : height - 120;

    target.drawText(text, {
      x,
      y,
      size: fontSize,
      font,
      rotate: rotation,
      color: rgb(0.75, 0.1, 0.1),
      opacity: 0.85,
    });

    const bytes = await doc.save({ useObjectStreams: true });
    return Buffer.from(bytes);
  }

  async compress(
    buffer: Buffer,
    options: {
      rasterize?: boolean;
      density?: number;
      jpegQuality?: number;
    } = {},
  ): Promise<Buffer> {
    if (options.rasterize) {
      return this.rasterizeToPDF(buffer, {
        density: options.density,
        jpegQuality: options.jpegQuality,
      });
    }

    const doc = await PDFDocument.load(buffer);
    const bytes = await doc.save({ useObjectStreams: true });
    return Buffer.from(bytes);
  }

  async redactByRasterize(
    buffer: Buffer,
    options: {
      redactions: Array<{ page: number; x: number; y: number; width: number; height: number }>;
      density?: number;
    },
  ): Promise<Buffer> {
    if (!options.redactions || options.redactions.length === 0) {
      throw new BadRequestException('redactions are required');
    }

    const src = await PDFDocument.load(buffer);
    const totalPages = src.getPageCount();
    const density = Number.isFinite(options.density) ? (options.density as number) : 200;

    const out = await PDFDocument.create();

    for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
      const srcPage = src.getPage(pageIndex);
      const { width, height } = srcPage.getSize();

      const pageRedactions = options.redactions.filter((r) => r.page === pageIndex + 1);
      const png = await sharp(buffer, { density, page: pageIndex }).png().toBuffer();

      let image = sharp(png);
      const metadata = await image.metadata();
      const imageWidth = metadata.width || 0;
      const imageHeight = metadata.height || 0;
      if (imageWidth <= 0 || imageHeight <= 0) {
        throw new BadRequestException('Failed to determine rasterized PDF page size');
      }

      const composites: sharp.OverlayOptions[] = [];
      for (const r of pageRedactions) {
        if (![r.x, r.y, r.width, r.height].every((v) => Number.isFinite(v))) {
          throw new BadRequestException('Invalid redaction coordinates');
        }
        if ([r.x, r.y, r.width, r.height].some((v) => v < 0 || v > 1)) {
          throw new BadRequestException('Redaction coordinates must be normalized (0..1)');
        }

        const left = Math.round(r.x * imageWidth);
        const top = Math.round(r.y * imageHeight);
        const w = Math.max(1, Math.round(r.width * imageWidth));
        const h = Math.max(1, Math.round(r.height * imageHeight));

        const overlay = await sharp({
          create: {
            width: w,
            height: h,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 1 },
          },
        })
          .png()
          .toBuffer();

        composites.push({ input: overlay, left, top });
      }

      if (composites.length > 0) {
        image = image.composite(composites);
      }

      const redactedPng = await image.png().toBuffer();
      const embedded = await out.embedPng(redactedPng);
      const page = out.addPage([width, height]);
      page.drawImage(embedded, { x: 0, y: 0, width, height });
    }

    const bytes = await out.save({ useObjectStreams: true });
    return Buffer.from(bytes);
  }

  async splitToPDFBuffers(buffer: Buffer): Promise<Buffer[]> {
    const src = await PDFDocument.load(buffer);
    const total = src.getPageCount();

    const outBuffers: Buffer[] = [];
    for (let pageIndex = 0; pageIndex < total; pageIndex++) {
      const out = await PDFDocument.create();
      const [copied] = await out.copyPages(src, [pageIndex]);
      out.addPage(copied);
      const bytes = await out.save({ useObjectStreams: true });
      outBuffers.push(Buffer.from(bytes));
    }

    return outBuffers;
  }

  private async rasterizeToPDF(
    buffer: Buffer,
    options: { density?: number; jpegQuality?: number } = {},
  ): Promise<Buffer> {
    const src = await PDFDocument.load(buffer);
    const totalPages = src.getPageCount();

    const density = Number.isFinite(options.density) ? (options.density as number) : 180;
    const jpegQuality = Number.isFinite(options.jpegQuality) ? (options.jpegQuality as number) : 75;

    const out = await PDFDocument.create();

    for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
      const srcPage = src.getPage(pageIndex);
      const { width, height } = srcPage.getSize();

      const jpeg = await sharp(buffer, { density, page: pageIndex }).jpeg({ quality: jpegQuality }).toBuffer();
      const embedded = await out.embedJpg(jpeg);

      const page = out.addPage([width, height]);
      page.drawImage(embedded, { x: 0, y: 0, width, height });
    }

    const bytes = await out.save({ useObjectStreams: true });
    return Buffer.from(bytes);
  }

  private normalizeUniquePageIndices(pages: number[], total: number): number[] {
    if (!pages || pages.length === 0) {
      throw new BadRequestException('pages are required');
    }

    const indices = pages.map((p) => {
      if (!Number.isFinite(p)) {
        throw new BadRequestException('Invalid page value');
      }
      const idx = Math.floor(p as number) - 1;
      if (idx < 0 || idx >= total) {
        throw new BadRequestException(`Page out of range: ${p}`);
      }
      return idx;
    });

    const unique = Array.from(new Set(indices));
    if (unique.length !== indices.length) {
      throw new BadRequestException('Duplicate page entries are not allowed');
    }

    return unique;
  }

  private normalizeRightAngleRotation(rotation: number): number {
    const raw = Number.isFinite(rotation) ? (rotation as number) : 0;
    const normalized = ((raw % 360) + 360) % 360;

    const allowed = [0, 90, 180, 270];
    if (!allowed.includes(normalized)) {
      throw new BadRequestException('rotationDegrees must be one of 0, 90, 180, 270');
    }

    return normalized;
  }

  private normalizeAngle(rotation: number): number {
    const raw = Number.isFinite(rotation) ? (rotation as number) : 0;
    return ((raw % 360) + 360) % 360;
  }

  private resolvePosition(
    position: PageNumberPosition,
    pageWidth: number,
    pageHeight: number,
    textWidth: number,
    fontSize: number,
    margin: number,
  ) {
    switch (position) {
      case 'bottom-left':
        return { x: margin, y: margin / 2 };
      case 'bottom-center':
        return { x: (pageWidth - textWidth) / 2, y: margin / 2 };
      case 'top-left':
        return { x: margin, y: pageHeight - margin - fontSize };
      case 'top-center':
        return { x: (pageWidth - textWidth) / 2, y: pageHeight - margin - fontSize };
      case 'top-right':
        return { x: pageWidth - margin - textWidth, y: pageHeight - margin - fontSize };
      case 'bottom-right':
      default:
        return { x: pageWidth - margin - textWidth, y: margin / 2 };
    }
  }

  private resolveHighlightColor(color?: HighlightColor) {
    switch (color) {
      case 'green':
        return rgb(0.55, 0.95, 0.55);
      case 'blue':
        return rgb(0.55, 0.75, 1);
      case 'pink':
        return rgb(1, 0.65, 0.85);
      case 'yellow':
      default:
        return rgb(1, 0.95, 0.3);
    }
  }
}
