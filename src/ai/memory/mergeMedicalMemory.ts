// src/ai/memory/mergeMedicalMemory.ts

// Этот файл отвечает за безопасное объединение
// старой медицинской памяти и новых данных,
// извлечённых AI из сообщения пользователя.
//
// Здесь:
// - убираются дубли,
// - ограничивается размер памяти,
// - объединяются массивы,
// - сохраняются старые данные,
// - добавляются новые факты.

import type {
  MedicalMemory
} from "../types/index.js";

function uniqueArray(
  arr: string[]
): string[] {

  return [...new Set(arr)];
}

function limitArray(
  arr: string[],
  limit: number
): string[] {

  return arr.slice(-limit);
}

export function mergeMedicalMemory(
  memory: MedicalMemory,
  extractedMemory: Partial<MedicalMemory>
): MedicalMemory {

  return {

    ...memory,

    ...extractedMemory,

    symptoms:

      limitArray(

        uniqueArray([

          ...memory.symptoms,

          ...(extractedMemory.symptoms || [])
        ]),

        20
      ),

    medications:

      limitArray(

        uniqueArray([

          ...memory.medications,

          ...(extractedMemory.medications || [])
        ]),

        20
      ),

    diagnoses:

      limitArray(

        uniqueArray([

          ...memory.diagnoses,

          ...(extractedMemory.diagnoses || [])
        ]),

        20
      ),

    allergies:

      limitArray(

        uniqueArray([

          ...memory.allergies,

          ...(extractedMemory.allergies || [])
        ]),

        20
      ),

    riskFactors:

      limitArray(

        uniqueArray([

          ...memory.riskFactors,

          ...(extractedMemory.riskFactors || [])
        ]),

        20
      ),

    extractedFacts:

      limitArray(

        uniqueArray([

          ...memory.extractedFacts,

          ...(extractedMemory.extractedFacts || [])

        ]),

        40
      ),

    chronicConditions:

      limitArray(

        uniqueArray([

          ...(memory.chronicConditions || []),

          ...(extractedMemory.chronicConditions || [])
        ]),

        20
      ),

    surgeries:

      limitArray(

        uniqueArray([

          ...(memory.surgeries || []),

          ...(extractedMemory.surgeries || [])
        ]),

        20
      ),

    familyHistory:

      limitArray(

        uniqueArray([

          ...(memory.familyHistory || []),

          ...(extractedMemory.familyHistory || [])
        ]),

        20
      )
  };
}