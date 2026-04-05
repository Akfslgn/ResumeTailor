import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/msword", // .doc (older Word)
  "text/plain",
]);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File is too large. Maximum size is 5 MB." },
        { status: 400 },
      );
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        {
          error:
            "Unsupported file type. Please upload a PDF, Word (.docx), or plain text file.",
        },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let text = "";

    if (file.type === "application/pdf") {
      const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs" as string);
      // Disable worker for server-side usage
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (pdfjsLib as any).GlobalWorkerOptions.workerSrc = "";
      const data = new Uint8Array(buffer);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const loadingTask = (pdfjsLib as any).getDocument({ data });
      const pdfDoc = await loadingTask.promise;
      const pages: string[] = [];
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const content = await page.getTextContent();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pageText = content.items.map((item: any) => item.str ?? "").join(" ");
        pages.push(pageText);
      }
      text = pages.join("\n");
    } else if (
      file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mammoth = require("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (file.type === "application/msword") {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mammoth = require("mammoth");
      // Older .doc format — mammoth has limited support, try and fallback
      try {
        const result = await mammoth.extractRawText({ buffer });
        text = result.value;
      } catch {
        return NextResponse.json(
          {
            error:
              "Old .doc format could not be parsed. Please save as .docx and try again.",
          },
          { status: 422 },
        );
      }
    } else if (file.type === "text/plain") {
      text = buffer.toString("utf-8");
    }

    text = text.trim();
    if (text.length < 30) {
      return NextResponse.json(
        {
          error:
            "Could not extract readable text from the file. Please check the file or paste the text manually.",
        },
        { status: 422 },
      );
    }

    return NextResponse.json({ text });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to parse file.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
