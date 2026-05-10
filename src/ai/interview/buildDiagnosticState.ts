// src/ai/interview/buildDiagnosticState.ts

// Этот файл отвечает за создание структурированного
// диагностического состояния для AI.
//
// Главная задача:
//
// Превратить хаотичную medical memory
// в понятный clinical context.
//
// AI должен видеть:
//
// - что уже подтверждено,
// - что уже спрашивали,
// - чего НЕ хватает,
// - какие есть red flags,
// - какая главная жалоба.
//
// Это сильно уменьшает:
// - повторные вопросы,
// - зацикливание,
// - useless interview loops.

import {
    classifyQuestionTopic
} from "./questionTopics.js";

import type {
    MedicalMemory
} from "../types/index.js";

import type {
    InterviewState
} from "./buildInterviewState.js";

export interface DiagnosticState {

    primaryComplaint: string;

    confirmedFindings: string[];

    alreadyCovered: string[];

    missingInformation: string[];

    redFlags: string[];
}

function detectPrimaryComplaint(
    memory: MedicalMemory
): string {

    const symptoms =
        memory.symptoms || [];

    if (!symptoms.length) {
        return "unknown complaint";
    }

    return symptoms[0];
}

function detectMissingInformation(
    memory: MedicalMemory
): string[] {

    const joined =
        (memory.extractedFacts || [])
            .join(" ")
            .toLowerCase();

    const missing: string[] = [];

    // -----------------------------------
    // TRAUMA
    // -----------------------------------

    const traumaDetected =

        joined.includes("удар")
        ||
        joined.includes("упал")
        ||
        joined.includes("травм");

    if (traumaDetected) {

        if (
            !joined.includes("отек")
            &&
            !joined.includes("опух")
        ) {

            missing.push(
                "наличие отека"
            );
        }

        if (
            !joined.includes("синяк")
            &&
            !joined.includes("гематом")
        ) {

            missing.push(
                "наличие синяка"
            );
        }

        if (
            !joined.includes("онем")
        ) {

            missing.push(
                "наличие онемения"
            );
        }

        if (
            !joined.includes("деформац")
        ) {

            missing.push(
                "наличие деформации"
            );
        }
    }

    return missing;
}

function detectRedFlags(
    memory: MedicalMemory
): string[] {

    const joined =
        (memory.extractedFacts || [])
            .join(" ")
            .toLowerCase();

    const redFlags: string[] = [];

    if (
        joined.includes("не могу дышать")
        ||
        joined.includes("удуш")
    ) {

        redFlags.push(
            "нарушение дыхания"
        );
    }

    if (
        joined.includes("кров")
    ) {

        redFlags.push(
            "кровотечение"
        );
    }

    if (
        joined.includes("потеря сознания")
    ) {

        redFlags.push(
            "потеря сознания"
        );
    }

    if (
        joined.includes("сильная боль")
    ) {

        redFlags.push(
            "выраженная боль"
        );
    }

    return redFlags;
}

export function buildDiagnosticState(
    memory: MedicalMemory,
    interviewState: InterviewState
): DiagnosticState {

    const confirmedFindings =
        (memory.extractedFacts || [])
            .slice(-15);

    return {

        primaryComplaint:
            detectPrimaryComplaint(
                memory
            ),

        confirmedFindings,

        alreadyCovered:

            interviewState.previousQuestions
                .map((q) =>
                    classifyQuestionTopic(q)
                ),

        missingInformation:
            detectMissingInformation(
                memory
            ),

        redFlags:
            detectRedFlags(
                memory
            )
    };
}