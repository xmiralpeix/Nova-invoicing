import { GoogleGenAI, Type } from "@google/genai";
import { Invoice, InvoiceStatus } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to convert file to base64
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = base64String.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const extractInvoiceFromImage = async (base64Image: string, mimeType: string) => {
  try {
    const model = 'gemini-2.5-flash';

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image
            }
          },
          {
            text: "Analyze this image. If it looks like an invoice or receipt, extract the following data: client name, date (YYYY-MM-DD), due date (YYYY-MM-DD, optional, infer 30 days if not present), line items (description, quantity, unit price). Return JSON matching the schema."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            clientName: { type: Type.STRING },
            issueDate: { type: Type.STRING },
            dueDate: { type: Type.STRING },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  price: { type: Type.NUMBER }
                }
              }
            }
          }
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error extracting invoice:", error);
    throw error;
  }
};

export const generateFinancialInsights = async (invoices: Invoice[]) => {
  try {
    // Summarize data for the prompt to save tokens and avoid passing PII if not needed
    const summaryData = invoices.map(inv => ({
      status: inv.status,
      date: inv.issueDate,
      total: inv.items.reduce((acc, item) => acc + (item.quantity * item.price), 0),
      client: inv.clientName
    }));

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are a financial advisor for a freelancer/small business. 
      Analyze the following invoice data and provide 3 key insights or actionable advice regarding cash flow, client concentration, or overdue payments.
      Keep it professional, encouraging, and concise (max 150 words).
      
      Data: ${JSON.stringify(summaryData)}`,
    });

    return response.text;
  } catch (error) {
    console.error("Error generating insights:", error);
    return "Unable to generate insights at this time.";
  }
};