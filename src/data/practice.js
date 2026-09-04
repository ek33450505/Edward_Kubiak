import { CAST_STATS } from "./castStats.js";

const practice = {
  updated: "September 3, 2026",

  lede:
    "Agents write most of my code. That moves the work, it doesn't remove it — the judgment, the verification, and the consequences stay put. This is the loop I actually run, where I spend review time, and four times the output looked right and wasn't.",

  loop: [
    {
      id: "plan-before-prompting",
      title: "Plan before prompting",
      body: "Ceremony scaled to blast radius, not line count. A typo in a doc gets applied inline; anything touching a hook, a gate, or a migration gets a written plan first. A one-line edit to an enforcement file has a larger blast radius than a hundred lines of prose.",
      artifact:
        "A three-tier planning rule. Most work stays single-agent — most work does not actually fan out.",
    },
    {
      id: "articulate-intent",
      title: "Articulate intent, not instructions",
      body: "The prompt is the specification. If an agent would have to read four files before it could write anything, that context belongs in the prompt: compressed, with exact anchors and old-to-new strings.",
      artifact:
        "A dispatch contract, written after one run read eight files, produced nothing, and burned 95,000 tokens. That was an authoring failure, not a model failure.",
    },
    {
      id: "dispatch-narrow",
      title: "Dispatch narrow",
      body: "One logical unit per dispatch, sized to the agent's turn budget. Split large work rather than relying on a resume: an agent that exhausts its budget stops mid-sentence with no error and no completion signal, which reads exactly like success.",
      artifact:
        "Every agent carries a turn cap. Runs that go quiet are reaped and recorded as abandoned, not left looking finished.",
    },
    {
      id: "spend-review-time",
      title: "Spend review time where it is cheap to be wrong",
      body: "Not all output deserves equal scrutiny. Generated tests get read harder than generated implementations, because a wrong test is invisible and a wrong implementation usually isn't. Data-shaping code gets read hardest: it fails silently and then publishes.",
      artifact:
        "Review is mandatory per logical unit, and the dispatching session runs it — an agent cannot mark its own work reviewed.",
    },
    {
      id: "verify-mechanically",
      title: "Verify mechanically, then read the verdict",
      body: "Confirm the change is on disk before reading any review of it. Checksum the files before the gate, compare after. A verdict is evidence about quality; it is never evidence about existence.",
      artifact:
        "A hook that checks a claimed DONE against the real git delta and refuses the claim when the files never landed.",
    },
  ],

  reviewBudget: [
    { label: "Specialist agents", value: `${CAST_STATS.agents}` },
    { label: "Tests", value: CAST_STATS.tests.toLocaleString("en-US") },
    { label: "Record tables", value: `${CAST_STATS.tables}` },
    { label: "Packages", value: `${CAST_STATS.packages}` },
  ],

  cases: [
    {
      id: "denominator-numerator",
      title: "The denominator that didn't match its numerator",
      symptom: "None. Every page rendered. Every number looked reasonable.",
      lookedRight:
        "A state summary disclosed how many facilities backed a reported capacity figure.",
      actuallyWas:
        "The facility count included cancelled projects. The megawatt sum excluded them. The disclosure was false on more than ten states.",
      caughtBy:
        "A reviewer checking the count against the sum — not a test, and not a reading of the code, which is correct in isolation on both lines.",
      fix: "Align the population filter across both aggregates; add the cancelled-facility edge case to the suite before re-submission.",
      lesson:
        "Two correct expressions can still disagree with each other. The bug lived in the gap between them, which is exactly where no unit test looks.",
      provenance: "Compute Atlas · 2026-08-31 · surfaced in review, recorded in the execution log",
    },
    {
      id: "guard-could-not-fire",
      title: "The guard that could not fire",
      symptom: "None. The suite was green.",
      lookedRight: "A dead-client guard wrapped a socket write in try/catch.",
      actuallyWas:
        "That write does not throw synchronously, so the catch was unreachable. The guard had never protected anything — and its test passed because the test mocked throwing semantics the runtime does not have.",
      caughtBy: "A reviewer who ran it instead of reading it.",
      fix: "Handle the asynchronous error path the runtime actually uses; rewrite the test against real semantics.",
      lesson:
        "The worst failure mode available: a passing test concealing the defect it was written to catch. The test did not miss the bug. It argued for it.",
      provenance: "Observability dashboard · 2026-09-02 · empirically verified in review",
    },
    {
      id: "fifteen-of-fifteen",
      title: "Fifteen of fifteen passing, on code that was never written",
      symptom: "None. A clean approval.",
      lookedRight: "A review returned APPROVED AS-IS, 15/15 passing.",
      actuallyWas: "The change had never been written to disk. A grep found no trace of it.",
      caughtBy: "Checking the diff before reading the verdict.",
      fix: "A standing rule — confirm the change exists before evaluating whether it is good.",
      lesson:
        "A review verdict is evidence about quality, never about existence. Those are different questions, and only one of them had been asked.",
      provenance: "CAST · 2026-08-15",
    },
    {
      id: "reviewer-reverted-subject",
      title: "The reviewer that reverted its own subject",
      symptom: "None at review time. A clean DONE.",
      lookedRight: "A read-only reviewer returned an approval.",
      actuallyWas: "It had silently reverted the file it was reviewing back to HEAD.",
      caughtBy: "git status, before commit.",
      fix: "Reviewers are told explicitly that they are read-only; files are checksummed before the gate and re-compared after it.",
      lesson:
        "Verify content after the gate, not only before. A tool with write access will sometimes use it, whatever its role says.",
      provenance: "CAST · 2026-08-15",
    },
  ],

  principles: [
    {
      title: "Plausible is not correct — and plausible is the default output.",
      body: "The failure mode of a competent agent is not nonsense. It is confident, well-formed, wrong work.",
    },
    {
      title: "A description is load-bearing, and it drifts.",
      body: "A comment, a test name, a status line: people read it and stop. When the thing beneath it changes, the description keeps asserting the old world. Most defects I find live in that gap.",
    },
    {
      title: "A gate that cannot fail is not a gate.",
      body: "Every new check is mutation-tested: revert the fix, confirm the check goes red, restore. An assertion that never fails is indistinguishable from one that cannot.",
    },
    {
      title: "Silence is not success.",
      body: "Truncation, timeouts and abandoned runs all look like completion from the outside. They are recorded as what they are.",
    },
    {
      title: "Own the outcome, not the output.",
      body: "Done means it landed and it works — not that an agent said so.",
    },
  ],
};

export default practice;
