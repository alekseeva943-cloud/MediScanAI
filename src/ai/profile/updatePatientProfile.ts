// src/ai/profile/updatePatientProfile.ts

// Обновление профиля пациента.
// Этот файл:
// - обновляет profile через GPT,
// - безопасно merge'ит данные,
// - НЕ теряет старые поля,
// - автоматически отмечает закрытые темы,
// - стабилизирует profile.

import { OpenAIProvider }
    from "../providers/openaiProvider.js";

import type {
    PatientProfile
} from "../profile/patientProfile.js";

import {
    PROFILE_UPDATE_PROMPT
} from "./profileUpdatePrompt.js";

// -----------------------------------
// SAFE ARRAY UNIQUE
// -----------------------------------

function uniqueArray(
    arr: string[]
): string[] {

    return [...new Set(arr)];
}

// -----------------------------------
// SAFE DEEP MERGE
// -----------------------------------

function deepMerge(
    target: any,
    source: any
): any {

    // если source пустой
    if (!source) {
        return target;
    }

    // если target пустой
    if (!target) {
        return source;
    }

    const output = {
        ...target
    };

    Object.keys(source).forEach((key) => {

        const sourceValue =
            source[key];

        const targetValue =
            target[key];

        // -----------------------------------
        // ARRAYS
        // -----------------------------------

        if (
            Array.isArray(sourceValue)
        ) {

            output[key] = uniqueArray([

                ...(Array.isArray(targetValue)
                    ? targetValue
                    : []),

                ...sourceValue
            ]);

            return;
        }

        // -----------------------------------
        // OBJECTS
        // -----------------------------------

        if (

            sourceValue

            &&

            typeof sourceValue === "object"

            &&

            !Array.isArray(sourceValue)

        ) {

            output[key] =
                deepMerge(
                    targetValue || {},
                    sourceValue
                );

            return;
        }

        // -----------------------------------
        // PRIMITIVES
        // -----------------------------------

        if (

            sourceValue !== undefined

            &&

            sourceValue !== null

            &&

            sourceValue !== ""

        ) {

            output[key] =
                sourceValue;
        }
    });

    return output;
}

// -----------------------------------
// NORMALIZE PROFILE
// -----------------------------------

function normalizeProfile(
    profile: PatientProfile
): PatientProfile {

    // -----------------------------------
    // SAFE DEFAULTS
    // -----------------------------------

    profile.pain ??= {

        location: "",

        character: "",

        severity: "",

        duration: ""
    };

    profile.trauma ??= {

        exists: false,

        mechanism: ""
    };

    profile.symptoms ??= [];

    profile.functionalLimitations ??= [];

    profile.possibleTriggers ??= [];

    profile.negativeFindings ??= [];

    profile.redFlags ??= [];

    profile.resolvedTopics ??= [];

    // -----------------------------------
    // NORMALIZE SYMPTOMS
    // -----------------------------------

    profile.symptoms =

        profile.symptoms.map(
            (item: any) => {

                // уже строка
                if (
                    typeof item === "string"
                ) {

                    return item;
                }

                // объект симптома
                if (

                    item

                    &&

                    typeof item === "object"

                ) {

                    // symptom + anatomy
                    if (
                        item.symptom
                        &&
                        item.anatomy
                    ) {

                        return `${item.symptom} (${item.anatomy})`;
                    }

                    // symptom only
                    if (
                        item.symptom
                    ) {

                        return item.symptom;
                    }

                    // type field
                    if (
                        item.type
                    ) {

                        return item.type;
                    }
                }

                // fallback
                return JSON.stringify(item);
            }
        );

    // -----------------------------------
    // RESOLVED TOPICS
    // -----------------------------------

    const resolvedTopics =
        new Set(
            profile.resolvedTopics
        );

    
    // -----------------------------------
    // PAIN
    // -----------------------------------

    if (
        profile.pain.location
    ) {

        resolvedTopics.add(
            "pain_location"
        );
    }

    if (
        profile.pain.character
    ) {

        resolvedTopics.add(
            "pain_character"
        );
    }

    if (
        profile.pain.duration
    ) {

        resolvedTopics.add(
            "pain_duration"
        );
    }

    if (
        profile.pain.severity
    ) {

        resolvedTopics.add(
            "pain_severity"
        );
    }

    // -----------------------------------
    // TRAUMA
    // -----------------------------------

    if (
        profile.trauma.exists
    ) {

        resolvedTopics.add(
            "trauma"
        );
    }

    if (
        profile.trauma.mechanism
    ) {

        resolvedTopics.add(
            "trauma_mechanism"
        );
    }

    // -----------------------------------
    // FUNCTIONAL LIMITATIONS
    // -----------------------------------

    if (
        profile.functionalLimitations.length > 0
    ) {

        resolvedTopics.add(
            "functional_limitation"
        );
    }

    // -----------------------------------
    // NEGATIVE FINDINGS
    // -----------------------------------

    const negatives =
        profile.negativeFindings
            .map((x) => x.toLowerCase());

    if (
        negatives.includes("отек")
    ) {

        resolvedTopics.add(
            "swelling"
        );
    }

    if (
        negatives.includes("онемение")
    ) {

        resolvedTopics.add(
            "numbness"
        );
    }

    // -----------------------------------
    // SAVE
    // -----------------------------------

    profile.resolvedTopics =
        Array.from(
            resolvedTopics
        );

    return profile;
}

export class PatientProfileUpdater {

    private provider:
        OpenAIProvider;

    constructor(apiKey: string) {

        this.provider =
            new OpenAIProvider(apiKey);
    }

    async updateProfile(

        currentProfile: PatientProfile,

        userMessage: string,

        history: any[] = []

    ): Promise<PatientProfile> {

        try {

            const recentConversation =

                history

                    .slice(-6)

                    .map((m: any) =>

                        `${m.role}: ${String(m.content)}`
                    )

                    .join("\n");

            const prompt = `

${PROFILE_UPDATE_PROMPT}

CURRENT PROFILE:
${JSON.stringify(
                currentProfile,
                null,
                2
            )}

NEW USER MESSAGE:
${userMessage}

RECENT HISTORY:
${JSON.stringify(history, null, 2)}

Return ONLY valid JSON.
`;

            const response =

                await this.provider
                    .generateRouterDecision(
                        prompt
                    );

            const cleaned =

                response

                    .replace(/```json/g, "")

                    .replace(/```/g, "")

                    .trim();

            let partialUpdate = {};

            try {

                partialUpdate =
                    JSON.parse(cleaned);

            } catch (jsonError) {

                console.error(
                    "Profile JSON parse error:",
                    jsonError
                );

                return currentProfile;
            }

            // -----------------------------------
            // MERGE
            // -----------------------------------

            const mergedProfile =

                deepMerge(
                    currentProfile,
                    partialUpdate
                );

            // -----------------------------------
            // AUTO BUILD MAIN COMPLAINT
            // -----------------------------------

            if (
                !mergedProfile.mainComplaint
            ) {

                const firstSymptom =

                    Array.isArray(
                        mergedProfile.symptoms
                    )

                        ? mergedProfile.symptoms[0]

                        : "";

                const painLocation =
                    mergedProfile?.pain?.location;

                if (
                    firstSymptom &&
                    painLocation
                ) {

                    mergedProfile.mainComplaint =
                        `${firstSymptom} в ${painLocation}`;
                }

                else if (firstSymptom) {

                    mergedProfile.mainComplaint =
                        firstSymptom;
                }
            }

            // -----------------------------------
            // IMPROVE EXISTING COMPLAINT
            // -----------------------------------

            if (
                mergedProfile.mainComplaint
            ) {

                const trigger =

                    mergedProfile
                        ?.possibleTriggers?.[0];

                if (

                    trigger

                    &&

                    !mergedProfile
                        .mainComplaint
                        .includes(trigger)

                ) {

                    mergedProfile.mainComplaint +=
                        ` после ${trigger}`;
                }
            }

            // -----------------------------------
            // NORMALIZE
            // -----------------------------------

            const normalizedProfile =

                normalizeProfile(
                    mergedProfile
                );

            console.log(
                "Updated patient profile:",
                JSON.stringify(
                    normalizedProfile,
                    null,
                    2
                )
            );

            return normalizedProfile;

        } catch (error) {

            console.error(
                "Profile update error:",
                error
            );

            return currentProfile;
        }
    }
}