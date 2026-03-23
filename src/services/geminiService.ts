import { GoogleGenAI, Type } from "@google/genai";
import { Space } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateThemeSpaces(theme: string): Promise<{ spaces: Space[], playerNames: string[] }> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate a custom Monopoly board with 40 spaces based on the theme: "${theme}".
    
    Also generate 2 creative player titles/names that fit the theme perfectly (e.g., for Space: "Astronaut", "Alien").
    
    The board must have exactly 40 spaces.
    The indices must match standard Monopoly:
    - 0: Go (type: 'go', name: related to starting/funding)
    - 10: Jail (type: 'jail', name: related to being stuck/audited)
    - 20: Free Parking (type: 'parking', name: related to resting/retreat)
    - 30: Go to Jail (type: 'gotojail', name: related to getting caught/subpoenaed)
    
    Other spaces should be distributed as follows:
    - 22 'property' spaces (grouped into 8 color sets: 2 brown, 3 light blue, 3 pink, 3 orange, 3 red, 3 yellow, 3 green, 2 dark blue).
    - 4 'railroad' spaces (type: 'railroad', price: 200, rent: [25, 50, 100, 200]).
    - 2 'utility' spaces (type: 'utility', price: 150).
    - 3 'chance' spaces.
    - 3 'chest' spaces (Community Chest).
    - 2 'tax' spaces (price: 100 or 200).
    
    For 'property' spaces, include:
    - color: A valid CSS hex color code representing the property group.
    - price: The purchase price (e.g., 60 to 400).
    - rent: An array of 6 numbers representing rent with [0 houses, 1 house, 2 houses, 3 houses, 4 houses, hotel].
    - houseCost: The cost to buy a house/upgrade (e.g., 50, 100, 150, 200).
    
    Make the names creative and fitting the theme perfectly!`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          playerNames: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Array of 2 player titles/names fitting the theme"
          },
          spaces: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.INTEGER, description: "The space index (0-39)" },
                name: { type: Type.STRING, description: "The name of the space" },
                type: { 
                  type: Type.STRING, 
                  description: "Must be one of: 'property', 'go', 'chance', 'chest', 'tax', 'jail', 'parking', 'gotojail', 'railroad', 'utility'" 
                },
                color: { type: Type.STRING, description: "Hex color code for properties" },
                price: { type: Type.INTEGER, description: "Purchase price or tax amount" },
                rent: { 
                  type: Type.ARRAY, 
                  items: { type: Type.INTEGER },
                  description: "Array of 6 rent values for properties, or 4 for railroads" 
                },
                houseCost: { type: Type.INTEGER, description: "Cost per house/upgrade for properties" }
              },
              required: ["id", "name", "type"]
            }
          }
        },
        required: ["playerNames", "spaces"]
      }
    }
  });

  const jsonStr = response.text?.trim() || "{}";
  const data = JSON.parse(jsonStr);
  const spaces: Space[] = data.spaces || [];
  const playerNames: string[] = data.playerNames || ["Player 1", "Player 2"];
  
  // Ensure exactly 40 spaces and correct IDs
  if (spaces.length !== 40) {
    throw new Error("Generated board does not have exactly 40 spaces.");
  }
  
  return {
    spaces: spaces.map((space, index) => ({
      ...space,
      id: index // Enforce correct IDs
    })),
    playerNames
  };
}
