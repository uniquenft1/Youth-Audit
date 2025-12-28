
import { GoogleGenAI, Type, Chat } from "@google/genai";
import { SecurityAudit, RiskLevel } from "../types";

export const geminiService = {
  analyzeContract: async (contractName: string, sourceCode: string): Promise<SecurityAudit> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
      You are a world-class blockchain security auditor for Youth. Analyze the provided code for "${contractName}". 
      
      IMPORTANT: This code could be Solidity (EVM) or Rust/Anchor (Solana). 
      - If it is Solana code, focus on: account validation, signer checks, PDA security, and arithmetic overflows.
      - If it is Solidity, focus on: reentrancy, access control, logic flaws, and gas limits.

      BE DIRECT. If it is dangerous, say so clearly. 
      Translate complex logic into plain English for a non-technical user.

      CONTRACT CODE:
      ${sourceCode.substring(0, 30000)}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        systemInstruction: "You are a smart contract security auditor. Provide analysis in a structured JSON format. Ensure all strings in the JSON are properly escaped.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            contractPurpose: { type: Type.STRING, description: "One sentence explaining what this does" },
            keyFeatures: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "3-5 main functions"
            },
            securityRisks: {
              type: Type.OBJECT,
              properties: {
                canDrainWallets: {
                  type: Type.OBJECT,
                  properties: {
                    status: { type: Type.BOOLEAN },
                    explanation: { type: Type.STRING }
                  },
                  required: ["status", "explanation"]
                },
                adminPowers: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING },
                  description: "List any owner/admin privileges"
                },
                isPausable: {
                  type: Type.OBJECT,
                  properties: {
                    status: { type: Type.BOOLEAN },
                    explanation: { type: Type.STRING }
                  },
                  required: ["status", "explanation"]
                },
                isUpgradeable: {
                  type: Type.OBJECT,
                  properties: {
                    status: { type: Type.BOOLEAN },
                    explanation: { type: Type.STRING }
                  },
                  required: ["status", "explanation"]
                },
                hiddenFees: {
                  type: Type.OBJECT,
                  properties: {
                    status: { type: Type.BOOLEAN },
                    explanation: { type: Type.STRING }
                  },
                  required: ["status", "explanation"]
                }
              },
              required: ["canDrainWallets", "adminPowers", "isPausable", "isUpgradeable", "hiddenFees"]
            },
            riskLevel: { 
              type: Type.STRING, 
              enum: ["LOW", "MEDIUM", "HIGH"] 
            },
            verdict: { type: Type.STRING, description: "Final warning or green light message" }
          },
          required: ["contractPurpose", "keyFeatures", "securityRisks", "riskLevel", "verdict"]
        }
      }
    });

    const result = JSON.parse(response.text.trim());
    return result as SecurityAudit;
  },

  createChat: (context?: string): Chat => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    return ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: {
        systemInstruction: `You are an expert Web3 Security Assistant for Youth Protocol. 
        Your goal is to help users understand smart contract security across multi-chain environments (Ethereum, L2s, Solana). 
        ${context ? `The user is currently looking at an audit for a contract with this context: ${context}` : ''}
        Keep responses professional, educational, and easy for non-technical users to understand.`
      }
    });
  }
};
