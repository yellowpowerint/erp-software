import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { DocumentsService } from "../documents/documents.service";
import { OCRService } from "../documents/services/ocr.service";
import { DocumentCategory, UserRole } from "@prisma/client";
import { createHash } from "crypto";
import axios from "axios";

type AiProvider = "OPENAI" | "CLAUDE";

interface AiRuntimeConfig {
  enabled: boolean;
  defaultProvider: AiProvider | null;
  openai: { apiKey: string | null; model: string | null };
  claude: { apiKey: string | null; model: string | null };
}

function normalizeText(text: string): string {
  return (text || "").replace(/\s+/g, " ").trim();
}

@Injectable()
export class DocumentAiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly documentsService: DocumentsService,
    private readonly ocrService: OCRService,
  ) {}

  private async openAiJson<T>(opts: {
    apiKey: string;
    model: string;
    system: string;
    user: string;
    temperature?: number;
  }): Promise<T> {
    const res = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: opts.model,
        temperature: opts.temperature ?? 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: opts.system },
          { role: "user", content: opts.user },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${opts.apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 60_000,
      },
    );

    const content = res?.data?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || content.trim().length === 0) {
      throw new Error("OpenAI returned empty content");
    }
    return JSON.parse(content) as T;
  }

  private async getSetting(key: string): Promise<string | null> {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key },
    });
    const value = setting?.value?.trim();
    return value && value.length > 0 ? value : null;
  }

  private async getAiRuntimeConfig(): Promise<AiRuntimeConfig> {
    const [
      enabledRaw,
      defaultProviderRaw,
      openaiKey,
      openaiModel,
      claudeKey,
      claudeModel,
    ] = await Promise.all([
      this.getSetting("AI_ENABLED"),
      this.getSetting("AI_DEFAULT_PROVIDER"),
      this.getSetting("AI_OPENAI_API_KEY"),
      this.getSetting("AI_OPENAI_MODEL"),
      this.getSetting("AI_CLAUDE_API_KEY"),
      this.getSetting("AI_CLAUDE_MODEL"),
    ]);

    const enabledRawResolved =
      enabledRaw ?? process.env.AI_ENABLED ?? process.env.OPENAI_ENABLED;
    const defaultProviderRawResolved =
      defaultProviderRaw ??
      process.env.AI_DEFAULT_PROVIDER ??
      process.env.AI_PROVIDER;

    const openaiKeyResolved =
      openaiKey ?? process.env.AI_OPENAI_API_KEY ?? process.env.OPENAI_API_KEY;
    const openaiModelResolved =
      openaiModel ?? process.env.AI_OPENAI_MODEL ?? process.env.OPENAI_MODEL;

    const claudeKeyResolved =
      claudeKey ?? process.env.AI_CLAUDE_API_KEY ?? process.env.CLAUDE_API_KEY;
    const claudeModelResolved =
      claudeModel ?? process.env.AI_CLAUDE_MODEL ?? process.env.CLAUDE_MODEL;

    const enabled = enabledRawResolved === "true";
    const defaultProviderCandidate =
      typeof defaultProviderRawResolved === "string"
        ? defaultProviderRawResolved.toUpperCase()
        : null;
    const defaultProvider =
      defaultProviderCandidate === "OPENAI" ||
      defaultProviderCandidate === "CLAUDE"
        ? (defaultProviderCandidate as AiProvider)
        : null;

    return {
      enabled,
      defaultProvider,
      openai: { apiKey: openaiKeyResolved ?? null, model: openaiModelResolved ?? null },
      claude: { apiKey: claudeKeyResolved ?? null, model: claudeModelResolved ?? null },
    };
  }

  private pseudoEmbedding(text: string, dims = 64): number[] {
    const vec = new Array<number>(dims).fill(0);
    const cleaned = normalizeText(text).toLowerCase();
    if (!cleaned) return vec;
    const toks = cleaned
      .split(" ")
      .filter((t) => t.length >= 3)
      .slice(0, 2000);
    for (const tok of toks) {
      const h = createHash("sha256").update(tok).digest();
      const idx = ((h[0] << 8) + h[1]) % dims;
      vec[idx] += 1;
    }
    const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
    return vec.map((v) => v / norm);
  }

  private cosine(a: number[], b: number[]): number {
    const n = Math.min(a.length, b.length);
    let dot = 0;
    let na = 0;
    let nb = 0;
    for (let i = 0; i < n; i++) {
      dot += a[i] * b[i];
      na += a[i] * a[i];
      nb += b[i] * b[i];
    }
    const denom = Math.sqrt(na) * Math.sqrt(nb);
    return denom ? dot / denom : 0;
  }

  private suggestCategory(text: string): DocumentCategory {
    const t = normalizeText(text).toLowerCase();
    if (/(invoice|inv\b|vat|tax\s+invoice)/.test(t))
      return DocumentCategory.INVOICE;
    if (/(receipt|cash\s+sale|pos\b)/.test(t)) return DocumentCategory.RECEIPT;
    if (/(purchase\s+order|\bpo\b)/.test(t))
      return DocumentCategory.PURCHASE_ORDER;
    if (/(quotation|quote|pro\s*forma)/.test(t))
      return DocumentCategory.QUOTATION;
    if (/(contract|agreement|terms\s+and\s+conditions)/.test(t))
      return DocumentCategory.CONTRACT;
    if (/(incident\s+report|near\s+miss)/.test(t))
      return DocumentCategory.INCIDENT_REPORT;
    if (/(safety\s+report|hazard|ppe)/.test(t))
      return DocumentCategory.SAFETY_REPORT;
    return DocumentCategory.OTHER;
  }

  private extractEntities(text: string) {
    const t = normalizeText(text);
    const dates = Array.from(
      t.matchAll(
        /(\b\d{4}-\d{1,2}-\d{1,2}\b|\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b)/g,
      ),
    )
      .map((m) => m[0])
      .slice(0, 25);

    const amounts = Array.from(
      t.matchAll(
        /(?:GHS|GH₵|₵|USD|\$|EUR|€)\s?([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?|[0-9]+(?:\.[0-9]{2})?)/g,
      ),
    )
      .map((m) => Number(String(m[1]).replace(/,/g, "")))
      .filter((n) => Number.isFinite(n))
      .slice(0, 25);

    return { dates, amounts };
  }

  private summarize(text: string): string {
    const cleaned = normalizeText(text);
    return cleaned.length <= 600 ? cleaned : `${cleaned.slice(0, 600)}…`;
  }

  private anomalyWarnings(
    category: DocumentCategory,
    entities: { amounts?: number[] },
  ) {
    if (
      category !== DocumentCategory.INVOICE &&
      category !== DocumentCategory.RECEIPT
    ) {
      return [] as string[];
    }

    const amounts = Array.isArray(entities.amounts) ? entities.amounts : [];
    if (amounts.length === 0) return ["No amounts detected"];

    const sorted = [...amounts].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const max = sorted[sorted.length - 1];
    if (median > 0 && max / median >= 20) {
      return [`Unusually large amount detected (${max} vs median ${median})`];
    }
    return [];
  }

  private async getDocumentText(documentId: string): Promise<string | null> {
    const meta = await this.prisma.documentMetadata.findUnique({
      where: { documentId },
    });
    if (meta?.extractedText && meta.extractedText.trim().length > 0)
      return meta.extractedText;
    return this.ocrService.getExtractedText(documentId);
  }

  async analyzeDocument(
    documentId: string,
    userId: string,
    userRole: UserRole,
    force = false,
  ) {
    await this.documentsService.assertCanView(documentId, userId, userRole);

    const existing = await this.prisma.documentAiInsight.findUnique({
      where: { documentId },
    });
    if (existing && !force) return existing;

    const doc = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: { metadata: true },
    });
    if (!doc) throw new NotFoundException("Document not found");

    const text =
      (doc.metadata?.extractedText ||
        (await this.getDocumentText(documentId))) ??
      "";
    if (!text || text.trim().length === 0) {
      throw new BadRequestException(
        "No extracted text available. Run OCR first.",
      );
    }

    let entities = this.extractEntities(text);
    let suggestedCategory = this.suggestCategory(text);
    let summary = this.summarize(text);
    const embedding = this.pseudoEmbedding(text);
    let suggestedTags: string[] = [];

    const cfg = await this.getAiRuntimeConfig();

    if (
      cfg.enabled &&
      cfg.defaultProvider === "OPENAI" &&
      cfg.openai.apiKey &&
      cfg.openai.model
    ) {
      try {
        const out = await this.openAiJson<{
          summary?: string;
          entities?: { dates?: string[]; amounts?: number[] };
          suggestedCategory?: DocumentCategory;
          suggestedTags?: string[];
        }>({
          apiKey: cfg.openai.apiKey,
          model: cfg.openai.model,
          system:
            "You analyze mining ERP documents. Output must be valid JSON. Keep answers concise.",
          user:
            "Return JSON with keys: summary (string <= 800 chars), entities {dates?: string[], amounts?: number[]}, suggestedCategory (one of: INVOICE, RECEIPT, PURCHASE_ORDER, QUOTATION, CONTRACT, INCIDENT_REPORT, SAFETY_REPORT, OTHER), suggestedTags (string[] <= 8). Document text: " +
            text.slice(0, 12000),
          temperature: 0.2,
        });

        if (typeof out?.summary === "string" && out.summary.trim().length > 0) {
          summary = out.summary.trim();
        }
        if (out?.entities && typeof out.entities === "object") {
          const d = Array.isArray(out.entities.dates)
            ? out.entities.dates.slice(0, 25)
            : entities.dates;
          const a = Array.isArray(out.entities.amounts)
            ? out.entities.amounts
                .map((n) => Number(n))
                .filter((n) => Number.isFinite(n))
                .slice(0, 25)
            : entities.amounts;
          entities = { dates: d, amounts: a };
        }
        if (typeof out?.suggestedCategory === "string") {
          const v = out.suggestedCategory as DocumentCategory;
          if (Object.values(DocumentCategory).includes(v)) {
            suggestedCategory = v;
          }
        }
        if (Array.isArray(out?.suggestedTags)) {
          suggestedTags = out.suggestedTags
            .map((t) => String(t).trim())
            .filter(Boolean)
            .slice(0, 8);
        }
      } catch {
        // fall back to heuristic
      }
    }

    const warnings = this.anomalyWarnings(suggestedCategory, entities);

    return this.prisma.documentAiInsight.upsert({
      where: { documentId },
      create: {
        documentId,
        provider: cfg.defaultProvider,
        model:
          cfg.defaultProvider === "OPENAI"
            ? cfg.openai.model
            : cfg.claude.model,
        summary,
        entities,
        suggestedCategory,
        suggestedTags,
        anomalies: {
          warnings,
          mode: cfg.enabled ? "ai-or-heuristic" : "heuristic",
        },
        linkedRecords: {},
        embedding,
      },
      update: {
        provider: cfg.defaultProvider,
        model:
          cfg.defaultProvider === "OPENAI"
            ? cfg.openai.model
            : cfg.claude.model,
        summary,
        entities,
        suggestedCategory,
        suggestedTags,
        anomalies: {
          warnings,
          mode: cfg.enabled ? "ai-or-heuristic" : "heuristic",
        },
        embedding,
      },
    });
  }

  async categorizeDocument(
    documentId: string,
    userId: string,
    userRole: UserRole,
  ) {
    const insight = await this.analyzeDocument(
      documentId,
      userId,
      userRole,
      false,
    );
    return { suggestedCategory: insight.suggestedCategory };
  }

  async summarizeDocument(
    documentId: string,
    userId: string,
    userRole: UserRole,
  ) {
    const insight = await this.analyzeDocument(
      documentId,
      userId,
      userRole,
      false,
    );
    return { summary: insight.summary };
  }

  async extractDocumentEntities(
    documentId: string,
    userId: string,
    userRole: UserRole,
  ) {
    const insight = await this.analyzeDocument(
      documentId,
      userId,
      userRole,
      false,
    );
    return { entities: insight.entities };
  }

  private buildPermissionWhere(userId: string, userRole: UserRole) {
    if (userRole === UserRole.SUPER_ADMIN) return {};
    return {
      OR: [
        { uploadedById: userId },
        { permissions: { some: { role: userRole, canView: true } } },
      ],
    };
  }

  async smartSearch(
    query: string,
    userId: string,
    userRole: UserRole,
    limit = 10,
    category?: DocumentCategory,
  ) {
    const q = normalizeText(query);
    if (!q) throw new BadRequestException("Query is required");

    const where: any = {
      ...this.buildPermissionWhere(userId, userRole),
    };
    if (category) where.category = category;

    const docs = await this.prisma.document.findMany({
      where,
      include: { metadata: true, aiInsight: true },
      orderBy: { createdAt: "desc" },
      take: Math.max(limit * 5, 50),
    });

    const qVec = this.pseudoEmbedding(q);
    const qTokens = q.toLowerCase().split(" ").filter(Boolean);

    const scored = docs
      .map((d) => {
        const text = d.metadata?.extractedText || "";
        const vec =
          (d.aiInsight?.embedding as unknown as number[]) ||
          this.pseudoEmbedding(text);
        const cosine = this.cosine(qVec, vec);
        const hay =
          `${d.originalName} ${d.description ?? ""} ${text}`.toLowerCase();
        const hits = qTokens.reduce(
          (acc, t) => (hay.includes(t) ? acc + 1 : acc),
          0,
        );
        const lexical = qTokens.length ? hits / qTokens.length : 0;
        const score = 0.7 * cosine + 0.3 * lexical;
        return { d, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scored.map((s) => ({
      id: s.d.id,
      score: Number(s.score.toFixed(4)),
      document: {
        id: s.d.id,
        originalName: s.d.originalName,
        category: s.d.category,
        module: s.d.module,
        referenceId: s.d.referenceId,
        createdAt: s.d.createdAt,
      },
    }));
  }

  async similarDocuments(
    documentId: string,
    userId: string,
    userRole: UserRole,
    limit = 5,
  ) {
    await this.documentsService.assertCanView(documentId, userId, userRole);

    const base = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: { metadata: true, aiInsight: true },
    });
    if (!base) throw new NotFoundException("Document not found");

    const baseVec =
      (base.aiInsight?.embedding as unknown as number[]) ||
      this.pseudoEmbedding(base.metadata?.extractedText || "");

    const where: any = {
      ...this.buildPermissionWhere(userId, userRole),
      id: { not: documentId },
    };

    const candidates = await this.prisma.document.findMany({
      where,
      include: { metadata: true, aiInsight: true },
      take: 200,
      orderBy: { createdAt: "desc" },
    });

    const scored = candidates
      .map((d) => {
        const vec =
          (d.aiInsight?.embedding as unknown as number[]) ||
          this.pseudoEmbedding(d.metadata?.extractedText || "");
        const score = this.cosine(baseVec, vec);
        return { d, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scored.map((s) => ({
      id: s.d.id,
      score: Number(s.score.toFixed(4)),
      document: {
        id: s.d.id,
        originalName: s.d.originalName,
        category: s.d.category,
        module: s.d.module,
        referenceId: s.d.referenceId,
        createdAt: s.d.createdAt,
      },
    }));
  }

  async detectDuplicates(
    userId: string,
    userRole: UserRole,
    opts: { documentId?: string; fileHash?: string },
  ) {
    const docId = opts.documentId;
    let fileHash = opts.fileHash;

    if (docId) {
      await this.documentsService.assertCanView(docId, userId, userRole);
      const doc = await this.prisma.document.findUnique({
        where: { id: docId },
      });
      if (!doc) throw new NotFoundException("Document not found");
      fileHash = doc.fileHash ?? null;
    }

    if (!fileHash)
      throw new BadRequestException("fileHash or documentId is required");

    const where: any = {
      ...this.buildPermissionWhere(userId, userRole),
      fileHash,
    };
    if (docId) where.id = { not: docId };

    const duplicates = await this.prisma.document.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return duplicates.map((d) => ({
      id: d.id,
      originalName: d.originalName,
      category: d.category,
      module: d.module,
      referenceId: d.referenceId,
      createdAt: d.createdAt,
    }));
  }

  async askQuestion(
    documentId: string,
    question: string,
    userId: string,
    userRole: UserRole,
  ) {
    await this.documentsService.assertCanView(documentId, userId, userRole);
    const q = normalizeText(question);
    if (!q) throw new BadRequestException("Question is required");

    const text = (await this.getDocumentText(documentId)) ?? "";
    if (!text || text.trim().length === 0) {
      throw new BadRequestException(
        "No extracted text available. Run OCR first.",
      );
    }

    const cfg = await this.getAiRuntimeConfig();
    if (
      cfg.enabled &&
      cfg.defaultProvider === "OPENAI" &&
      cfg.openai.apiKey &&
      cfg.openai.model
    ) {
      try {
        const out = await this.openAiJson<{
          answer: string;
          confidence?: number;
        }>({
          apiKey: cfg.openai.apiKey,
          model: cfg.openai.model,
          system:
            "You answer questions about a single document. Use only the provided text. Output must be valid JSON.",
          user:
            "Question: " +
            q +
            "\n\nDocument text: " +
            text.slice(0, 12000) +
            "\n\nReturn JSON: {answer: string, confidence?: number (0-1)}.",
          temperature: 0.2,
        });

        const ans = typeof out?.answer === "string" ? out.answer.trim() : "";
        if (ans) {
          const conf = Number(out.confidence);
          return {
            answer: ans,
            confidence: Number.isFinite(conf)
              ? Math.max(0, Math.min(1, conf))
              : 0.7,
            sources: [{ documentId, snippet: ans.slice(0, 250) }],
          };
        }
      } catch {
        // fall back to heuristic
      }
    }

    const tokens = q
      .toLowerCase()
      .split(/\s+/)
      .map((t) => t.replace(/[^a-z0-9]/g, ""))
      .filter((t) => t.length >= 3)
      .slice(0, 10);

    const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
    const ranked = sentences
      .map((s) => {
        const hay = s.toLowerCase();
        const hits = tokens.reduce(
          (acc, t) => (hay.includes(t) ? acc + 1 : acc),
          0,
        );
        return { s, hits };
      })
      .sort((a, b) => b.hits - a.hits);

    const best = ranked[0];
    const snippet = best?.hits ? best.s.trim() : sentences[0]?.trim();

    return {
      answer: snippet
        ? `Based on the document text: ${snippet}`
        : "No relevant content found in the document.",
      confidence: best?.hits ? Math.min(0.9, 0.4 + best.hits * 0.1) : 0.2,
      sources: snippet ? [{ documentId, snippet }] : [],
    };
  }
}
