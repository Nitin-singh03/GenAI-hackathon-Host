import fs from "fs";
import path from "path";
import pdf from "pdf-parse";
import mammoth from "mammoth";

const parseDocument = async (file) => {
  console.log("📄 Processing file:", file.originalname);

  const filePath = path.resolve(file.path);
  const ext = path.extname(file.originalname).toLowerCase();

  let extractedText = "";

  try {
    if (ext === ".pdf") {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdf(dataBuffer);
      extractedText = data.text;
      console.log("Extracted PDF text:", extractedText.substring(0, 200)); // Log first 200 chars
    } else if (ext === ".docx") {
      const data = await mammoth.extractRawText({ path: filePath });
      extractedText = data.value;
    } else if (ext === ".txt") {
      extractedText = fs.readFileSync(filePath, "utf8");
    } else {
      extractedText = "Unsupported file type.";
    }
  } catch (err) {
    console.error("❌ Error parsing file:", err);
    extractedText = "Error extracting text.";
  }

  // For now: return extracted raw text inside your structured object
  // Later you can plug in NLP to detect parties, dates, etc.
  return {
    language: "English",
    fullSummary: extractedText.substring(0, 1000), // limit for demo
    keyDates: {
      startDate: "N/A",
      endDate: "N/A",
      leaseTerm: "N/A",
    },
    parties: {
      landlord: "N/A",
      tenant: "N/A",
    },
    financialSummary: {
      monthlyRent: "N/A",
      securityDeposit: "N/A",
      annualEscalation: "N/A",
    },
    keyCovenants: {
      useOfPremises: "N/A",
      sublettingClause: "N/A",
    },
  };
};

export default { parseDocument };