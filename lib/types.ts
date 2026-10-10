export type Appointment = {
  id: string;
  patientFirstName: string;
  visitType: string;
  datetime: string; // ISO 8601
  clinician: { name: string; specialty: string };
  location: { name: string; address: string; notes: string };
  reasonOnFile: string;
};

export type Medication = {
  id: string;
  name: string;
  dose: string;
  schedule: string;
  purpose: string;
};

export type QuestionSuggestion = {
  id: string;
  text: string;
  why: string;
};

export type BringItem = {
  id: string;
  label: string;
};

export type PrepData = {
  appointment: Appointment;
  medications: Medication[];
  suggestedQuestions: QuestionSuggestion[];
  bringList: BringItem[];
};
