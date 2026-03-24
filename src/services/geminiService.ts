import { GoogleGenAI, Type } from "@google/genai";
import { Space } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function expandTheme(theme: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `The user wants a Monopoly board themed around '${theme}'. Write a rich, 3-sentence description expanding this into a broad world with locations, characters, and items. This will be used as inspiration to generate the board spaces.`,
    });
    return response.text?.trim() || theme;
  } catch (err) {
    console.error("Failed to expand theme:", err);
    return theme;
  }
}

export async function generateThemeSpaces(theme: string, expandedTheme?: string): Promise<{ spaces: Space[], playerNames: string[], playerIcons: string[] }> {
  const themeContext = expandedTheme 
    ? `Theme: "${theme}"\n\nExpanded World Inspiration:\n${expandedTheme}`
    : `Theme: "${theme}"`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate a custom Monopoly board with 40 spaces based on the following theme context:
    
    ${themeContext}
    
    Also generate 2 creative player titles/names that fit the theme perfectly (e.g., for Space: "Astronaut", "Alien").
    Also generate 2 distinct emoji icons that match those player titles (e.g., "🧑‍🚀", "👽").
    
    For each space, provide a max 2-line description explaining its origin and connection to the theme.
    
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
          playerIcons: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Array of 2 distinct emoji icons fitting the player titles/names"
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
                houseCost: { type: Type.INTEGER, description: "Cost per house/upgrade for properties" },
                description: { type: Type.STRING, description: "Max 2-line explanation of the space's connection to the theme" }
              },
              required: ["id", "name", "type", "description"]
            }
          }
        },
        required: ["playerNames", "playerIcons", "spaces"]
      }
    }
  });

  const jsonStr = response.text?.trim() || "{}";
  const data = JSON.parse(jsonStr);
  const spaces: Space[] = data.spaces || [];
  const playerNames: string[] = data.playerNames || ["Player 1", "Player 2"];
  const playerIcons: string[] = data.playerIcons || ["👤", "👤"];
  
  // Ensure exactly 40 spaces and correct IDs
  if (spaces.length !== 40) {
    throw new Error("Generated board does not have exactly 40 spaces.");
  }
  
  return {
    spaces: spaces.map((space, index) => ({
      ...space,
      id: index // Enforce correct IDs
    })),
    playerNames,
    playerIcons
  };
}

export const compressImage = (base64Str: string, maxWidth = 512, maxHeight = 512): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.6));
    };
    img.onerror = () => resolve(base64Str); // Fallback if image loading fails
  });
};

export async function generateThemeImage(theme: string): Promise<string | undefined> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `A clean, minimalist vector-style illustration representing the theme "${theme}". It should be suitable for the center of a board game. White background.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K"
        }
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const originalBase64 = `data:image/png;base64,${part.inlineData.data}`;
        return await compressImage(originalBase64);
      }
    }
  } catch (err) {
    console.error("Failed to generate theme image:", err);
  }
  return undefined;
}
