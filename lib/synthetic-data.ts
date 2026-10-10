import type { PrepData } from "./types";

// Entirely fictional demo data. Replace getPrepData() with a real source
// (FHIR/EHR API, database) later; the page only depends on the PrepData shape.
export async function getPrepData(): Promise<PrepData> {
  return {
    appointment: {
      id: "appt-001",
      patientFirstName: "Alex",
      visitType: "Follow-up visit",
      datetime: "2026-10-21T14:30:00",
      clinician: { name: "Dr. Priya Raman", specialty: "Primary Care" },
      location: {
        name: "Riverside Family Health (demo)",
        address: "123 Example Street, Suite 200, Springfield",
        notes: "Check in at the 2nd floor desk. Arrive 15 minutes early.",
      },
      reasonOnFile: "Follow-up on blood pressure and recurring headaches",
    },
    medications: [
      {
        id: "med-1",
        name: "Lisinopril",
        dose: "10 mg",
        schedule: "Once daily, morning",
        purpose: "Blood pressure",
      },
      {
        id: "med-2",
        name: "Atorvastatin",
        dose: "20 mg",
        schedule: "Once daily, evening",
        purpose: "Cholesterol",
      },
      {
        id: "med-3",
        name: "Ibuprofen",
        dose: "200 mg",
        schedule: "As needed",
        purpose: "Headache (over the counter)",
      },
    ],
    suggestedQuestions: [
      {
        id: "q-1",
        text: "Is my blood pressure at goal, and what should my target be?",
        why: "Helps you understand what the numbers mean for you.",
      },
      {
        id: "q-2",
        text: "Could any of my medications be contributing to my headaches?",
        why: "Frequent pain reliever use can affect headaches and blood pressure.",
      },
      {
        id: "q-3",
        text: "Are there side effects I should watch for with my current medications?",
        why: "Knowing what's normal helps you know when to call.",
      },
      {
        id: "q-4",
        text: "What tests or follow-up do I need, and when?",
        why: "Leaves you with a clear next-steps plan.",
      },
      {
        id: "q-5",
        text: "Are there lifestyle changes that would make the biggest difference?",
        why: "Prioritizes what to focus on first.",
      },
    ],
    bringList: [
      { id: "b-1", label: "Photo ID and insurance card" },
      { id: "b-2", label: "Medication bottles or an up-to-date list" },
      { id: "b-3", label: "Home blood pressure readings (if you have them)" },
      { id: "b-4", label: "Notes on symptoms, including when they happen" },
      { id: "b-5", label: "Glasses, hearing aids, or other aids you use" },
    ],
  };
}
