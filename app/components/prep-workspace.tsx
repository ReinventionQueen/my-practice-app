"use client";

import { useState, useSyncExternalStore } from "react";
import type { PrepData } from "@/lib/types";
import { UserButton } from "@clerk/nextjs";
import { AUTH_ENABLED } from "@/lib/auth-config";
import { DocumentStep } from "./document-step";
import { usePersistentState } from "./use-persistent-state";

const NO_STRINGS: string[] = [];
const NO_QUESTIONS: Question[] = [];
const NO_MED_FLAGS: Record<string, MedStatus> = {};

type Question = { id: string; text: string; custom: boolean };
type MedStatus = "taking" | "stopped" | "changed";

const MED_STATUS_LABEL: Record<MedStatus, string> = {
  taking: "Taking as listed",
  changed: "Taking differently",
  stopped: "Stopped",
};

const STEPS = [
  { id: "document", title: "Last visit document", short: "Document" },
  { id: "concerns", title: "Main concern", short: "Concern" },
  { id: "symptoms", title: "Symptoms and changes", short: "Symptoms" },
  { id: "questions", title: "Questions to ask", short: "Questions" },
  { id: "meds", title: "Medications", short: "Medications" },
  { id: "bring", title: "What to bring", short: "Bring" },
  { id: "review", title: "Review and print", short: "Review" },
] as const;

export function PrepWorkspace({
  data,
  userId,
}: {
  data: PrepData;
  userId: string;
}) {
  const { appointment, medications, suggestedQuestions, bringList } = data;
  const ns = `prep:${userId}:${appointment.id}`;

  const [concerns, setConcerns] = usePersistentState<string>(
    `${ns}:concerns`,
    "",
  );
  const [symptoms, setSymptoms] = usePersistentState<string>(
    `${ns}:symptoms`,
    "",
  );
  const [questions, setQuestions] = usePersistentState<Question[]>(
    `${ns}:questions`,
    NO_QUESTIONS,
  );
  const [medStatus, setMedStatus] = usePersistentState<
    Record<string, MedStatus>
  >(`${ns}:meds`, NO_MED_FLAGS);
  const [medNotes, setMedNotes] = usePersistentState<string>(
    `${ns}:medNotes`,
    "",
  );
  const [packed, setPacked] = usePersistentState<string[]>(
    `${ns}:packed`,
    NO_STRINGS,
  );
  const [draft, setDraft] = useState("");
  const [docNotes, setDocNotes] = usePersistentState<string>(
    `${ns}:docNotes`,
    "",
  );
  const [savedStep, setStep] = usePersistentState<number>(`${ns}:step`, 0);
  const step = Math.min(Math.max(savedStep, 0), STEPS.length - 1);
  const current = STEPS[step].id;

  const when = new Date(appointment.datetime);
  const dateLabel = when.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const timeLabel = when.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  const addedIds = new Set(questions.map((q) => q.id));
  const available = suggestedQuestions.filter((s) => !addedIds.has(s.id));

  function addQuestion(id: string, text: string, custom: boolean) {
    const clean = text.trim();
    if (!clean) return;
    setQuestions([...questions, { id, text: clean, custom }]);
  }

  const reviewedMeds = medications.filter((m) => medStatus[m.id]).length;
  const done: Record<string, boolean> = {
    concerns: concerns.trim().length > 0,
    symptoms: symptoms.trim().length > 0,
    questions: questions.length > 0,
    meds: reviewedMeds === medications.length,
    bring: packed.length === bringList.length,
  };
  const checklist = Object.values(done);
  const doneCount = checklist.filter(Boolean).length;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8">
      <header className="rounded-2xl bg-teal-700 p-6 text-white print:bg-white print:text-black print:border print:border-black">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm opacity-90">
            Hi {appointment.patientFirstName}, let&apos;s get you ready.
          </p>
          <div className="print:hidden">{AUTH_ENABLED && <UserButton />}</div>
        </div>
        <h1 className="mt-1 text-2xl font-semibold">{appointment.visitType}</h1>
        <p className="mt-2 text-lg">
          {dateLabel} at {timeLabel}
          <DaysAway target={when.getTime()} />
        </p>
        <p className="mt-1">
          {appointment.clinician.name} · {appointment.clinician.specialty}
        </p>
        <p className="mt-1 text-sm opacity-90">
          {appointment.location.name}, {appointment.location.address}
        </p>
        <p className="text-sm opacity-90">{appointment.location.notes}</p>
        <p className="mt-3 text-sm">
          <span className="opacity-90">Reason on file:</span>{" "}
          {appointment.reasonOnFile}
        </p>
      </header>

      <section aria-label="Progress" className="print:hidden">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            {doneCount} of {checklist.length} answers complete
          </span>
          <span className="text-muted">Saved on this device</span>
        </div>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={checklist.length}
          aria-valuenow={doneCount}
          className="mt-2 h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/15"
        >
          <div
            className="h-full bg-teal-600 transition-all"
            style={{ width: `${(doneCount / checklist.length) * 100}%` }}
          />
        </div>
      </section>

      <div className="md:flex md:items-start md:gap-6">
        <nav
          aria-label="Prep steps"
          className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:mb-0 md:w-56 md:shrink-0 md:flex-col md:overflow-visible md:px-0 print:hidden"
        >
          {STEPS.map((st, i) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setStep(i)}
              aria-current={i === step ? "step" : undefined}
              className={`flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm ${
                i === step
                  ? "border-teal-700 bg-teal-700 text-white"
                  : "border-black/15 hover:bg-teal-700/10 dark:border-white/20"
              }`}
            >
              <span aria-hidden className="w-4 text-center">
                {done[st.id] ? "✓" : i + 1}
              </span>
              <span className="md:hidden">{st.short}</span>
              <span className="hidden md:inline">{st.title}</span>
              {done[st.id] && <span className="sr-only">(complete)</span>}
            </button>
          ))}
        </nav>
        <div className="min-w-0 flex-1 space-y-4" aria-live="polite">
          {current === "document" && (
            <Card
              title="Bring in your last visit document"
              hint="Upload your most recent After Visit Summary, discharge notes or patient-facing visit note so you can refer to it while you prepare."
            >
              <DocumentStep storageKey={`${ns}:doc`} />
              <label
                htmlFor="doc-notes"
                className="mt-4 block text-sm font-medium"
              >
                What stood out, or what do you still not understand?
              </label>
              <textarea
                id="doc-notes"
                value={docNotes}
                onChange={(e) => setDocNotes(e.target.value)}
                rows={3}
                className="field mt-1"
              />
            </Card>
          )}
          {current === "concerns" && (
            <Card
              title="What's your main concern?"
              hint="In your own words. What do you most want to get out of this visit?"
            >
              <textarea
                value={concerns}
                onChange={(e) => setConcerns(e.target.value)}
                rows={3}
                className="field"
                placeholder="e.g. My headaches are happening more often and I'm worried about my blood pressure."
              />
            </Card>
          )}
          {current === "symptoms" && (
            <Card
              title="Symptoms and changes"
              hint="What has changed since your last visit? When did it start, how often, what makes it better or worse?"
            >
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                rows={4}
                className="field"
                placeholder="e.g. Headaches 3–4 times a week since September, mostly afternoons."
              />
            </Card>
          )}
          {current === "questions" && (
            <Card
              title="Questions to ask"
              hint="Pick suggestions or write your own. Writing them down helps you remember in the room."
            >
              {questions.length > 0 && (
                <ol className="mb-4 list-decimal space-y-2 pl-5">
                  {questions.map((q) => (
                    <li key={q.id}>
                      <span>{q.text}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setQuestions(questions.filter((x) => x.id !== q.id))
                        }
                        className="link ml-2 text-sm print:hidden"
                        aria-label={`Remove question: ${q.text}`}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ol>
              )}
              {available.length > 0 && (
                <div className="print:hidden">
                  <p className="mb-2 text-sm font-medium">Suggested</p>
                  <ul className="space-y-2">
                    {available.map((s) => (
                      <li
                        key={s.id}
                        className="flex items-start justify-between gap-3 rounded-lg border border-black/10 p-3 dark:border-white/15"
                      >
                        <div>
                          <p>{s.text}</p>
                          <p className="text-sm text-muted">{s.why}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => addQuestion(s.id, s.text, false)}
                          className="btn-secondary shrink-0"
                        >
                          Add
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <form
                className="mt-4 flex gap-2 print:hidden"
                onSubmit={(e) => {
                  e.preventDefault();
                  addQuestion(`custom-${crypto.randomUUID()}`, draft, true);
                  setDraft("");
                }}
              >
                <label htmlFor="custom-q" className="sr-only">
                  Your own question
                </label>
                <input
                  id="custom-q"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="field"
                  placeholder="Write your own question"
                />
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={!draft.trim()}
                >
                  Add
                </button>
              </form>
            </Card>
          )}
          {current === "meds" && (
            <Card
              title="Review your medications"
              hint="Does this list match what you actually take? Tell your care team about anything that differs, including supplements and over-the-counter products."
            >
              <ul className="space-y-3">
                {medications.map((m) => (
                  <li
                    key={m.id}
                    className="rounded-lg border border-black/10 p-3 dark:border-white/15"
                  >
                    <p className="font-medium">
                      {m.name} <span className="font-normal">{m.dose}</span>
                    </p>
                    <p className="text-sm text-muted">
                      {m.schedule} · {m.purpose}
                    </p>
                    <div
                      role="group"
                      aria-label={`Status of ${m.name}`}
                      className="mt-2 flex flex-wrap gap-2 print:hidden"
                    >
                      {(Object.keys(MED_STATUS_LABEL) as MedStatus[]).map(
                        (s) => (
                          <button
                            key={s}
                            type="button"
                            aria-pressed={medStatus[m.id] === s}
                            onClick={() =>
                              setMedStatus({ ...medStatus, [m.id]: s })
                            }
                            className={`chip ${medStatus[m.id] === s ? "chip-on" : ""}`}
                          >
                            {MED_STATUS_LABEL[s]}
                          </button>
                        ),
                      )}
                    </div>
                    {medStatus[m.id] && (
                      <p className="mt-2 hidden text-sm print:block">
                        Status: {MED_STATUS_LABEL[medStatus[m.id]]}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
              <label
                htmlFor="med-notes"
                className="mt-4 block text-sm font-medium"
              >
                Anything not on this list? (supplements, new prescriptions,
                missed doses)
              </label>
              <textarea
                id="med-notes"
                value={medNotes}
                onChange={(e) => setMedNotes(e.target.value)}
                rows={2}
                className="field mt-1"
              />
            </Card>
          )}
          {current === "bring" && (
            <Card title="What to bring">
              <ul className="space-y-2">
                {bringList.map((b) => {
                  const checked = packed.includes(b.id);
                  return (
                    <li key={b.id}>
                      <label className="flex cursor-pointer items-center gap-3">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setPacked(
                              checked
                                ? packed.filter((x) => x !== b.id)
                                : [...packed, b.id],
                            )
                          }
                          className="size-5 accent-teal-700"
                        />
                        <span
                          className={checked ? "text-muted line-through" : ""}
                        >
                          {b.label}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
          {current === "review" && (
            <Card
              title="Your visit summary"
              hint="Check everything, then print it or save it as a PDF to bring with you."
            >
              <dl className="space-y-4">
                <Summary label="Reason on file">
                  {appointment.reasonOnFile}
                </Summary>
                <Summary label="Main concern">{concerns}</Summary>
                <Summary label="Symptoms and changes">{symptoms}</Summary>
                <Summary label="Notes on last visit document">
                  {docNotes}
                </Summary>
                <div>
                  <dt className="text-sm font-medium text-muted">Questions</dt>
                  <dd>
                    {questions.length ? (
                      <ol className="list-decimal pl-5">
                        {questions.map((q) => (
                          <li key={q.id}>{q.text}</li>
                        ))}
                      </ol>
                    ) : (
                      <span className="text-muted">None yet</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted">
                    Medications
                  </dt>
                  <dd>
                    <ul>
                      {medications.map((m) => (
                        <li key={m.id}>
                          {m.name} {m.dose} ({m.schedule}):{" "}
                          {medStatus[m.id]
                            ? MED_STATUS_LABEL[medStatus[m.id]]
                            : "not reviewed"}
                        </li>
                      ))}
                    </ul>
                    {medNotes.trim() && (
                      <p className="mt-1">Also: {medNotes}</p>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted">To bring</dt>
                  <dd>
                    <ul>
                      {bringList.map((b) => (
                        <li key={b.id}>
                          {packed.includes(b.id) ? "☑" : "☐"} {b.label}
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              </dl>
            </Card>
          )}
          <div className="flex items-center justify-between print:hidden">
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              disabled={step === 0}
              className="btn-secondary disabled:invisible"
            >
              ← Back
            </button>
            <span className="text-sm text-muted">
              Step {step + 1} of {STEPS.length}
            </span>
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              disabled={step === STEPS.length - 1}
              className="btn-primary disabled:invisible"
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        {current === "review" ? (
          <button
            type="button"
            onClick={() => window.print()}
            className="btn-primary"
          >
            Print or save as PDF
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={() => {
            if (
              window.confirm(
                "Clear everything you've entered for this appointment?",
              )
            ) {
              setConcerns("");
              setSymptoms("");
              setQuestions(NO_QUESTIONS);
              setMedStatus(NO_MED_FLAGS);
              setMedNotes("");
              setPacked(NO_STRINGS);
              setDocNotes("");
              setStep(0);
            }
          }}
          className="link text-sm"
        >
          Clear my answers
        </button>
      </div>

      <p className="text-xs text-muted">
        Demo with fictional data. This tool helps you organize your thoughts; it
        does not give medical advice. For emergencies, call your local emergency
        number.
      </p>
    </div>
  );
}

function Card({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-black/10 p-5 dark:border-white/15 print:break-inside-avoid">
      <h2 className="text-lg font-semibold">{title}</h2>
      {hint && <p className="mb-3 mt-1 text-sm text-muted">{hint}</p>}
      {!hint && <div className="mb-3" />}
      {children}
    </section>
  );
}

const noopSubscribe = () => () => {};

// Reads the clock only on the client (null during prerender) to avoid a hydration mismatch.
function DaysAway({ target }: { target: number }) {
  const days = useSyncExternalStore(
    noopSubscribe,
    () => Math.ceil((target - Date.now()) / 86_400_000),
    () => null,
  );
  if (days === null || days <= 0) return null;
  return (
    <span className="ml-2 text-sm opacity-90 print:hidden">
      ({days} day{days === 1 ? "" : "s"} away)
    </span>
  );
}

function Summary({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const empty = typeof children === "string" && !children.trim();
  return (
    <div>
      <dt className="text-sm font-medium text-muted">{label}</dt>
      <dd className="whitespace-pre-wrap">
        {empty ? <span className="text-muted">Nothing added</span> : children}
      </dd>
    </div>
  );
}
