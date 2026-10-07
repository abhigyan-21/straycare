const { GoogleGenAI, Type } = require('@google/genai');

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

const analyzeAnimalImage = async (imageDataUrl, userDescription = '') => {
    // imageDataUrl:
    // data:image/jpeg;base64,/9j/4AAQ...

    const [header, base64Data] = imageDataUrl.split(',');

    if (!header || !base64Data) {
        throw new Error('Invalid image data');
    }

    const mimeType = header.match(/data:(.*);base64/)?.[1];

    if (!mimeType || !mimeType.startsWith('image/')) {
        throw new Error('Invalid image MIME type');
    }

    const prompt = `
You are an AI assistant helping Furzo create
animal rescue reports.

Analyze the provided photograph and the user's description.

Your primary purpose is to identify VISIBLE signs of injury
or distress that could help rescuers and veterinarians prepare
for the case.

IMPORTANT:
- Do NOT diagnose diseases.
- Do NOT claim an injury is medically confirmed.
- Only report things that can reasonably be observed.
- If something cannot be determined, return "unknown".
- Distinguish visual observations from possible concerns.
- Do not invent information.

User description:
${userDescription}

Analyze:
- animal type
- possible breed/type
- approximate age category
- visible injury
- injury type
- injury location
- visible bleeding
- swelling
- open wound
- abnormal limb positioning
- visible mobility problems
- visible distress
- overall urgency based on visible evidence

Return structured information.
`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',

        contents: [
            {
                inlineData: {
                    mimeType,
                    data: base64Data,
                },
            },
            {
                text: prompt,
            },
        ],

        config: {
            responseMimeType: 'application/json',

            responseSchema: {
                type: Type.OBJECT,

                properties: {
                    animalType: {
                        type: Type.STRING,
                    },

                    breed: {
                        type: Type.STRING,
                    },

                    ageCategory: {
                        type: Type.STRING,
                    },

                    injuryDetected: {
                        type: Type.BOOLEAN,
                    },

                    injuries: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                type: {
                                    type: Type.STRING,
                                },
                                location: {
                                    type: Type.STRING,
                                },
                                bleeding: {
                                    type: Type.STRING,
                                },
                                swelling: {
                                    type: Type.STRING,
                                },
                                openWound: {
                                    type: Type.STRING,
                                },
                                abnormalPosition: {
                                    type: Type.STRING,
                                },
                                confidence: {
                                    type: Type.NUMBER,
                                },
                            },
                            required: [
                                'type',
                                'location',
                                'bleeding',
                                'swelling',
                                'openWound',
                                'abnormalPosition',
                                'confidence',
                            ],
                        },
                    },

                    mobility: {
                        type: Type.OBJECT,
                        properties: {
                            observation: {
                                type: Type.STRING,
                            },
                            confidence: {
                                type: Type.NUMBER,
                            },
                        },
                        required: [
                            'observation',
                            'confidence',
                        ],
                    },

                    visibleDistress: {
                        type: Type.STRING,
                    },

                    urgency: {
                        type: Type.STRING,
                    },

                    summary: {
                        type: Type.STRING,
                    },

                    limitations: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.STRING,
                        },
                    },
                },

                required: [
                    'animalType',
                    'breed',
                    'ageCategory',
                    'injuryDetected',
                    'injuries',
                    'mobility',
                    'visibleDistress',
                    'urgency',
                    'summary',
                    'limitations',
                ],
            },
        },
    });

    return JSON.parse(response.text);
};

module.exports = {
    analyzeAnimalImage,
};