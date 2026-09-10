/* =========================================================
   FAILURETRACE — FRONTEND CONTROLLER
   ========================================================= */


/* =========================================================
   DOM REFERENCES
   ========================================================= */

const form = document.getElementById("investigation-form");

const investigationPanel =
  document.getElementById("investigation-panel");

const errorMessageInput =
  document.getElementById("error-message");

const stackTraceInput =
  document.getElementById("stack-trace");

const logsInput =
  document.getElementById("logs");

const recentChangesInput =
  document.getElementById("recent-changes");

const expectedBehaviorInput =
  document.getElementById("expected-behavior");

const investigateBtn =
  document.getElementById("investigate-btn");

const statusText =
  document.getElementById("status");

const resultCard =
  document.getElementById("result-card");

const resultStatus =
  document.getElementById("result-status");

const resultFailure =
  document.getElementById("result-failure");

const resultLocation =
  document.getElementById("result-location");

const rootCause =
  document.getElementById("root-cause");

const confidence =
  document.getElementById("confidence");

const confidenceMeterFill =
  document.getElementById("confidence-meter-fill");

const confidenceExplanation =
  document.getElementById("confidence-explanation");

const severityBadge =
  document.getElementById("severity-badge");

const severityNote =
  document.getElementById("severity-note");

const failureChain =
  document.getElementById("failure-chain");

const evidenceList =
  document.getElementById("evidence-list");

const recommendedFix =
  document.getElementById("recommended-fix");

const verificationPlan =
  document.getElementById("verification-plan");

const agentList =
  document.getElementById("agent-list");

const agentRunState =
  document.getElementById("agent-run-state");

const newInvestigationBtn =
  document.getElementById("new-investigation");

const editSignalsBtn =
  document.getElementById("edit-signals-btn");

const signalsCollapsedBar =
  document.getElementById("signals-collapsed-bar");

const verifyFixBtn =
  document.getElementById("verify-fix-btn");

const verifyFixBanner =
  document.getElementById("verify-fix-banner");


let lastPayload = null;
let agentTimers = [];


/* =========================================================
   PAGE NAVIGATION
   ========================================================= */

const views = {
  home: document.getElementById("home-view"),
  investigate: document.getElementById("investigate-view"),
  history: document.getElementById("history-view"),
  saved: document.getElementById("saved-view"),
  insights: document.getElementById("insights-view")
};


const navItems =
  document.querySelectorAll(".nav-item");


function showView(viewName) {

  Object.values(views).forEach((view) => {

    if (view) {
      view.classList.add("hidden");
    }

  });


  const selectedView =
    views[viewName];

  if (selectedView) {
    selectedView.classList.remove("hidden");
  }


  navItems.forEach((item) => {

    item.classList.toggle(
      "active",
      item.dataset.view === viewName
    );

  });


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


/* Sidebar navigation */

navItems.forEach((item) => {

  item.addEventListener(
    "click",
    (event) => {

      event.preventDefault();

      const view =
        item.dataset.view;

      if (view) {
        showView(view);
      }

    }
  );

});


/* =========================================================
   START INVESTIGATION ACTIONS
   ========================================================= */

function openInvestigation() {

  showView("investigate");

  setTimeout(() => {

    errorMessageInput.focus();

  }, 250);

}


function expandSignalsForm() {

  if (investigationPanel) {
    investigationPanel.classList.remove("is-collapsed");
  }

  if (editSignalsBtn) {
    editSignalsBtn.classList.add("hidden");
  }

  if (signalsCollapsedBar) {
    signalsCollapsedBar.classList.add("hidden");
  }

}


function collapseSignalsForm() {

  if (investigationPanel) {
    investigationPanel.classList.add("is-collapsed");
  }

  if (editSignalsBtn) {
    editSignalsBtn.classList.remove("hidden");
  }

  if (signalsCollapsedBar) {
    signalsCollapsedBar.classList.remove("hidden");
  }

}


document
  .querySelectorAll(
    '[data-action="start-investigation"]'
  )
  .forEach((button) => {

    button.addEventListener(
      "click",
      () => {

        openInvestigation();

      }
    );

  });


/* Sidebar New Investigation */

newInvestigationBtn.addEventListener(
  "click",
  () => {

    form.reset();

    clearResults();

    expandSignalsForm();

    showView("investigate");

    statusText.textContent =
      "Ready for a new investigation.";

    setTimeout(() => {

      errorMessageInput.focus();

    }, 250);

  }
);


if (editSignalsBtn) {

  editSignalsBtn.addEventListener(
    "click",
    () => {

      expandSignalsForm();

      errorMessageInput.focus();

    }
  );

}


if (verifyFixBtn) {

  verifyFixBtn.addEventListener(
    "click",
    () => {

      if (verifyFixBanner) {
        verifyFixBanner.classList.remove("hidden");
      }

    }
  );

}


/* =========================================================
   EXAMPLE INVESTIGATIONS
   ========================================================= */

const examples = {

  keyerror: {

    error_message:
      "KeyError: user_id",

    stack_trace:
      `Traceback (most recent call last):
  File "app.py", line 42, in get_user
    user_id = user["user_id"]
KeyError: user_id`,

    logs:
      `Application started successfully.
Request received for user profile.
Request failed with KeyError.`,

    recent_changes:
      "No recent code changes.",

    expected_behavior:
      "The application should retrieve the user profile successfully."

  },


  "api-500": {

    error_message:
      "500 Internal Server Error",

    stack_trace:
      `Traceback (most recent call last):
  File "api.py", line 87, in create_order
    result = database.insert(order)
DatabaseError: connection refused`,

    logs:
      `API server started successfully.
POST /orders received.
Database connection failed.
POST /orders returned 500.`,

    recent_changes:
      "Database configuration was updated during the latest deployment.",

    expected_behavior:
      "The API should create the order and return a successful response."

  },


  docker: {

    error_message:
      "Container exited with code 1",

    stack_trace:
      `Application startup failed.
Error: PORT environment variable is not defined
Process exited with code 1`,

    logs:
      `Starting production container.
Loading environment configuration.
Application startup failed.
Container stopped.`,

    recent_changes:
      "Application was moved to a new Docker deployment configuration.",

    expected_behavior:
      "The container should start successfully and expose the application."

  },


  database: {

    error_message:
      "Database connection timeout",

    stack_trace:
      `DatabaseError: connection timeout
  at database.connect()
  at application.start()`,

    logs:
      `Application started.
Attempting database connection.
Connection attempt timed out.
Application startup delayed.`,

    recent_changes:
      "Database endpoint configuration was changed recently.",

    expected_behavior:
      "The application should establish a database connection successfully."

  }

};


function loadExample(exampleName) {

  const example =
    examples[exampleName];

  if (!example) {
    return;
  }


  expandSignalsForm();

  openInvestigation();


  errorMessageInput.value =
    example.error_message;

  stackTraceInput.value =
    example.stack_trace;

  logsInput.value =
    example.logs;

  recentChangesInput.value =
    example.recent_changes;

  expectedBehaviorInput.value =
    example.expected_behavior;


  statusText.textContent =
    "Example investigation loaded. Ready to analyze.";

}


/* Quick investigation buttons */

document
  .querySelectorAll("[data-example]")
  .forEach((button) => {

    button.addEventListener(
      "click",
      () => {

        loadExample(
          button.dataset.example
        );

      }
    );

  });


/* Try Example hero button */

const tryExampleButton =
  document.querySelector(
    '[data-action="try-example"]'
  );

if (tryExampleButton) {

  tryExampleButton.addEventListener(
    "click",
    () => {

      loadExample("keyerror");

    }
  );

}


/* =========================================================
   FAILURE CATEGORIES
   ========================================================= */

document
  .querySelectorAll("[data-category]")
  .forEach((card) => {

    card.addEventListener(
      "click",
      () => {

        expandSignalsForm();

        openInvestigation();

        const category =
          card.dataset.category;


        /*
          Give the investigation screen
          a useful contextual placeholder.
        */

        const categoryMessages = {

          runtime:
            "Describe the runtime error you encountered...",

          api:
            "Describe the API failure or HTTP error...",

          database:
            "Describe the database or query failure...",

          deployment:
            "Describe the deployment or production failure...",

          build:
            "Describe the build or CI failure...",

          network:
            "Describe the network or connectivity issue..."

        };


        if (
          categoryMessages[category]
        ) {

          errorMessageInput.placeholder =
            categoryMessages[category];

        }

      }
    );

  });


/* =========================================================
   BACKEND HEALTH
   ========================================================= */

async function checkHealth() {

  try {

    const response =
      await fetch("/health");


    if (!response.ok) {
      throw new Error(
        "Backend unavailable"
      );
    }


    const data =
      await response.json();


    if (
      data.status === "ok"
    ) {

      statusText.textContent =
        "System ready • Backend connected";

    } else {

      statusText.textContent =
        "Backend connected • Status unknown";

    }

  } catch (error) {

    statusText.textContent =
      "Backend connection failed";

  }

}


/* =========================================================
   SEVERITY / CONFIDENCE / CHAIN HELPERS
   ========================================================= */

function resetSeverity() {

  if (!severityBadge) {
    return;
  }

  severityBadge.textContent =
    "—";

  severityBadge.className =
    "severity-badge severity-unknown";

  if (severityNote) {

    severityNote.textContent =
      "Frontend-derived estimate. The investigation API does not currently provide a severity field.";

  }

}


function estimateSeverity(data, payload) {

  const confidenceValue =
    data &&
    data.root_cause &&
    typeof data.root_cause.confidence === "number"
      ? data.root_cause.confidence
      : 0;

  const haystack = [
    data && data.failure,
    data && data.location,
    payload && payload.error_message,
    payload && payload.stack_trace
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const criticalHints = [
    "crash",
    "fatal",
    "panic",
    "segfault",
    "out of memory",
    "oom",
    "connection refused",
    "500",
    "data loss"
  ];

  const highHints = [
    "timeout",
    "exception",
    "failed",
    "error",
    "refused",
    "unavailable",
    "exited with code"
  ];

  const hasHint = (hints) =>
    hints.some((hint) => haystack.includes(hint));

  let level = "medium";

  if (hasHint(criticalHints) || confidenceValue >= 0.85) {
    level = "critical";
  } else if (hasHint(highHints) || confidenceValue >= 0.65) {
    level = "high";
  } else if (confidenceValue > 0 && confidenceValue < 0.4) {
    level = "low";
  } else if (!haystack) {
    level = "unknown";
  }

  return level;

}


function renderSeverity(data, payload) {

  const level =
    estimateSeverity(data, payload);

  const labels = {
    critical: "CRITICAL",
    high: "HIGH",
    medium: "MEDIUM",
    low: "LOW",
    unknown: "UNKNOWN"
  };

  severityBadge.textContent =
    labels[level] || "UNKNOWN";

  severityBadge.className =
    `severity-badge severity-${level}`;

  severityNote.textContent =
    `Estimated ${labels[level] || "UNKNOWN"} severity is frontend-derived from the failure text and returned confidence. The investigation API does not currently provide a severity field.`;

}


function explainConfidence(percentage, evidenceCount) {

  const evidencePhrase =
    evidenceCount === 1
      ? "1 evidence item"
      : `${evidenceCount} evidence items`;

  if (percentage === null) {

    return "The API did not return a numeric confidence value with the root-cause hypothesis.";

  }

  if (percentage >= 80) {

    return `${percentage}% confidence was returned with this hypothesis, along with ${evidencePhrase}. This is a high confidence value from the API, not a separate explanation field.`;

  }

  if (percentage >= 50) {

    return `${percentage}% confidence was returned with this hypothesis, along with ${evidencePhrase}. Moderate confidence means the hypothesis still needs verification.`;

  }

  return `${percentage}% confidence was returned with this hypothesis, along with ${evidencePhrase}. Lower confidence means the API is less certain and the result should be treated as tentative.`;

}


function mapFailureChain(data, payload) {

  const steps =
    Array.isArray(data.failure_chain)
      ? data.failure_chain.filter(
          (step) =>
            typeof step === "string" &&
            step.trim()
        )
      : [];

  const cause =
    data.root_cause &&
    data.root_cause.cause
      ? data.root_cause.cause
      : "Root cause could not be determined.";

  const expected =
    payload &&
    payload.expected_behavior
      ? payload.expected_behavior
      : "";

  const impactFallback =
    expected
      ? `Expected: ${expected}`
      : (
          data.location
            ? `Observed at ${data.location}`
            : "Impact was not identified."
        );

  let symptom = data.failure || "Symptom not identified.";
  let contributing = "No contributing failure was returned.";
  let root = cause;
  let impact = impactFallback;

  if (steps.length >= 4) {

    symptom = steps[0];
    contributing = steps.slice(1, -2).join(" ");
    root = steps[steps.length - 2];
    impact = steps[steps.length - 1];

  } else if (steps.length === 3) {

    symptom = steps[0];
    contributing = steps[1];
    root = steps[2];
    impact = impactFallback;

  } else if (steps.length === 2) {

    symptom = steps[0];
    contributing = steps[1];
    root = cause;
    impact = impactFallback;

  } else if (steps.length === 1) {

    symptom = steps[0];
    contributing = "No additional contributing step was returned.";
    root = cause;
    impact = impactFallback;

  }

  return [
    {
      stage: "Symptom",
      text: symptom
    },
    {
      stage: "Contributing Failure",
      text: contributing
    },
    {
      stage: "Root Cause",
      text: root
    },
    {
      stage: "Impact",
      text: impact
    }
  ];

}


function inferEvidenceSource(text) {

  const value =
    String(text || "").toLowerCase();

  if (
    value.includes("traceback") ||
    value.includes("stack") ||
    value.includes("file \"")
  ) {
    return "STACK TRACE";
  }

  if (
    value.includes("log") ||
    value.includes("error ") ||
    /\d{2}:\d{2}/.test(value)
  ) {
    return "LOGS";
  }

  if (
    value.includes("deploy") ||
    value.includes("config") ||
    value.includes("changed")
  ) {
    return "RECENT CHANGES";
  }

  return "EVIDENCE";

}


/* =========================================================
   AGENT PANEL
   ========================================================= */

function clearAgentTimers() {

  agentTimers.forEach((timer) => {
    clearTimeout(timer);
  });

  agentTimers = [];

}


function setAgentState(row, state, label) {

  row.classList.remove(
    "is-waiting",
    "is-analyzing",
    "is-complete",
    "is-skipped"
  );

  row.classList.add(`is-${state}`);

  const status =
    row.querySelector(".agent-status");

  if (status) {
    status.textContent = label;
  }

}


function resetAgents() {

  clearAgentTimers();

  if (agentRunState) {
    agentRunState.textContent = "Idle";
  }

  if (!agentList) {
    return;
  }

  agentList
    .querySelectorAll(".agent-row")
    .forEach((row) => {

      setAgentState(row, "waiting", "Idle");

    });

}


function startAgentInvestigation(payload) {

  clearAgentTimers();

  if (agentRunState) {
    agentRunState.textContent = "INVESTIGATING";
  }

  const rows =
    agentList
      ? Array.from(
          agentList.querySelectorAll(".agent-row")
        )
      : [];

  rows.forEach((row) => {

    const signal =
      row.dataset.signal;

    if (
      signal &&
      payload &&
      !String(payload[signal] || "").trim()
    ) {

      setAgentState(row, "skipped", "Skipped");

    } else {

      setAgentState(row, "waiting", "Waiting");

    }

  });

  const orchestrator =
    agentList &&
    agentList.querySelector(
      '[data-agent="orchestrator"]'
    );

  if (orchestrator) {
    setAgentState(
      orchestrator,
      "analyzing",
      "Coordinating"
    );
  }

  const activeRows =
    rows.filter((row) => {

      return (
        row.dataset.agent !== "orchestrator" &&
        !row.classList.contains("is-skipped")
      );

    });

  activeRows.forEach((row, index) => {

    const timer =
      setTimeout(() => {

        setAgentState(
          row,
          "analyzing",
          "Analyzing"
        );

      }, 350 * (index + 1));

    agentTimers.push(timer);

  });

}


function completeAgentInvestigation(success) {

  clearAgentTimers();

  if (agentRunState) {

    agentRunState.textContent =
      success
        ? "COMPLETE"
        : "FAILED";

  }

  if (!agentList) {
    return;
  }

  agentList
    .querySelectorAll(".agent-row")
    .forEach((row) => {

      if (row.classList.contains("is-skipped")) {
        return;
      }

      setAgentState(
        row,
        "complete",
        success ? "Complete" : "Stopped"
      );

    });

}


/* =========================================================
   RESULT HELPERS
   ========================================================= */

function clearResults() {

  lastPayload = null;

  resetAgents();

  resultFailure.textContent =
    "—";

  resultLocation.textContent =
    "—";

  rootCause.textContent =
    "—";

  confidence.textContent =
    "—";

  if (confidenceMeterFill) {
    confidenceMeterFill.style.width = "0%";
  }

  if (confidenceExplanation) {

    confidenceExplanation.textContent =
      "Confidence is the value returned with the root cause.";

  }

  resetSeverity();

  failureChain.innerHTML =
    "";

  if (evidenceList) {
    evidenceList.innerHTML = "";
  }

  recommendedFix.innerHTML =
    "";

  verificationPlan.innerHTML =
    "";

  if (verifyFixBanner) {
    verifyFixBanner.classList.add("hidden");
  }

  resultCard.classList.remove("is-investigating");

  resultCard.classList.add(
    "hidden"
  );

}


function createChainItem(stage, text) {

  const item =
    document.createElement("div");


  item.className =
    "chain-item";


  const stageEl =
    document.createElement("div");

  stageEl.className =
    "chain-stage";

  stageEl.textContent =
    stage;


  const textEl =
    document.createElement("div");

  textEl.className =
    "chain-text";

  textEl.textContent =
    text;


  item.appendChild(stageEl);
  item.appendChild(textEl);


  return item;

}


function createEvidenceItem(text) {

  const item =
    document.createElement("div");

  item.className =
    "evidence-item";

  const top =
    document.createElement("div");

  top.className =
    "evidence-item-top";

  const source =
    document.createElement("span");

  source.className =
    "evidence-source";

  source.textContent =
    inferEvidenceSource(text);

  top.appendChild(source);

  const body =
    document.createElement("div");

  body.className =
    "evidence-text";

  body.textContent =
    text;

  const support =
    document.createElement("p");

  support.className =
    "evidence-support";

  support.textContent =
    "This evidence was returned with the root-cause hypothesis and is consistent with it. The API does not provide a separate rationale for this item.";

  item.appendChild(top);
  item.appendChild(body);
  item.appendChild(support);

  return item;

}


function createRecommendation(
  text,
  index
) {

  const item =
    document.createElement("div");


  item.className =
    "recommendation-item";


  const number =
    document.createElement("div");

  number.className =
    "recommendation-number";

  number.textContent =
    String(index + 1).padStart(2, "0");


  const body =
    document.createElement("div");

  body.textContent =
    text;


  const copyBtn =
    document.createElement("button");

  copyBtn.type =
    "button";

  copyBtn.className =
    "copy-fix-btn";

  copyBtn.textContent =
    "Copy";

  copyBtn.addEventListener(
    "click",
    async () => {

      const original =
        copyBtn.textContent;

      try {

        if (
          navigator.clipboard &&
          navigator.clipboard.writeText
        ) {

          await navigator.clipboard.writeText(text);

        } else {

          const area =
            document.createElement("textarea");

          area.value = text;

          document.body.appendChild(area);

          area.select();

          document.execCommand("copy");

          area.remove();

        }

        copyBtn.textContent =
          "Copied";

      } catch (error) {

        copyBtn.textContent =
          "Copy failed";

      }

      setTimeout(() => {

        copyBtn.textContent =
          original;

      }, 1400);

    }
  );


  item.appendChild(number);
  item.appendChild(body);
  item.appendChild(copyBtn);


  return item;

}


function createVerificationItem(
  text
) {

  const item =
    document.createElement("div");


  item.className =
    "verification-item";


  const check =
    document.createElement("div");

  check.className =
    "verification-check";

  check.textContent =
    "✓";


  const body =
    document.createElement("div");

  body.textContent =
    text;


  item.appendChild(check);
  item.appendChild(body);


  return item;

}


/* =========================================================
   RENDER AI RESULT
   ========================================================= */

function renderResult(data) {


  resultCard.classList.remove("is-investigating");

  failureChain.innerHTML = "";
  recommendedFix.innerHTML = "";
  verificationPlan.innerHTML = "";

  if (evidenceList) {
    evidenceList.innerHTML = "";
  }


  /* FAILURE */

  resultFailure.textContent =
    data.failure ||
    "Unknown failure";


  /* LOCATION */

  resultLocation.textContent =
    data.location ||
    "Location not identified";


  /* STATUS */

  const status =
    data.status ||
    "unknown";


  resultStatus.textContent =
    status
      .replaceAll("_", " ")
      .toUpperCase();


  /* SEVERITY (frontend-derived) */

  renderSeverity(data, lastPayload);


  /* ROOT CAUSE + CONFIDENCE */

  let evidenceItems = [];

  if (data.root_cause) {

    rootCause.textContent =
      data.root_cause.cause ||
      "Root cause could not be determined.";


    if (
      Array.isArray(data.root_cause.evidence)
    ) {

      evidenceItems =
        data.root_cause.evidence.filter(
          (item) =>
            typeof item === "string" &&
            item.trim()
        );

    }


    if (
      typeof data.root_cause.confidence ===
      "number"
    ) {

      const percentage =
        Math.round(
          data.root_cause.confidence * 100
        );


      confidence.textContent =
        `${percentage}% CONFIDENCE`;

      if (confidenceMeterFill) {
        confidenceMeterFill.style.width =
          `${Math.max(0, Math.min(100, percentage))}%`;
      }

      if (confidenceExplanation) {

        confidenceExplanation.textContent =
          explainConfidence(
            percentage,
            evidenceItems.length
          );

      }

    } else {

      confidence.textContent =
        "CONFIDENCE UNKNOWN";

      if (confidenceMeterFill) {
        confidenceMeterFill.style.width = "0%";
      }

      if (confidenceExplanation) {

        confidenceExplanation.textContent =
          explainConfidence(
            null,
            evidenceItems.length
          );

      }

    }

  } else {

    rootCause.textContent =
      "Root cause could not be determined.";

    confidence.textContent =
      "CONFIDENCE UNKNOWN";

    if (confidenceMeterFill) {
      confidenceMeterFill.style.width = "0%";
    }

    if (confidenceExplanation) {

      confidenceExplanation.textContent =
        explainConfidence(null, 0);

    }

  }


  /* EVIDENCE */

  if (evidenceList) {

    evidenceList.innerHTML = "";

    if (evidenceItems.length > 0) {

      evidenceItems.forEach((item) => {

        evidenceList.appendChild(
          createEvidenceItem(item)
        );

      });

    } else {

      const empty =
        document.createElement("div");

      empty.className =
        "evidence-item";

      empty.textContent =
        "No evidence items were returned with this hypothesis.";

      evidenceList.appendChild(empty);

    }

  }


  /* FAILURE CHAIN */

  failureChain.innerHTML = "";

  mapFailureChain(data, lastPayload)
    .forEach((step) => {

      failureChain.appendChild(
        createChainItem(
          step.stage,
          step.text
        )
      );

    });


  /* RECOMMENDED FIX */

  if (data.recommended_fix) {

    const fix =
      data.recommended_fix;


    const recommendations =
      [];


    if (Array.isArray(fix)) {

      recommendations.push(
        ...fix
      );

    } else {

      Object.values(fix).forEach(
        (value) => {

          if (
            typeof value === "string"
          ) {

            recommendations.push(
              value
            );

          }

        }
      );

    }


    recommendations.forEach(
      (item, index) => {

        recommendedFix.appendChild(
          createRecommendation(
            item,
            index
          )
        );

      }
    );

  }


  if (
    recommendedFix.children.length === 0
  ) {

    recommendedFix.appendChild(
      createRecommendation(
        "No specific recommendation was returned.",
        0
      )
    );

  }


  /* VERIFICATION PLAN */

  if (data.verification_plan) {

    const plan =
      data.verification_plan;


    const steps =
      [];


    if (Array.isArray(plan)) {

      steps.push(
        ...plan
      );

    } else {

      Object.values(plan).forEach(
        (value) => {

          if (
            typeof value === "string"
          ) {

            steps.push(
              value
            );

          }

        }
      );

    }


    steps.forEach(
      (step) => {

        verificationPlan.appendChild(
          createVerificationItem(step)
        );

      }
    );

  }


  if (
    verificationPlan.children.length === 0
  ) {

    verificationPlan.appendChild(
      createVerificationItem(
        "No verification steps were returned."
      )
    );

  }


  completeAgentInvestigation(true);

  collapseSignalsForm();


  /* SHOW RESULTS */

  resultCard.classList.remove(
    "hidden"
  );


  setTimeout(() => {

    resultCard.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

  }, 100);

}


/* =========================================================
   INVESTIGATION REQUEST
   ========================================================= */

form.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();


    const payload = {

      error_message:
        errorMessageInput.value.trim(),

      stack_trace:
        stackTraceInput.value.trim(),

      logs:
        logsInput.value.trim(),

      recent_changes:
        recentChangesInput.value.trim(),

      expected_behavior:
        expectedBehaviorInput.value.trim()

    };


    /* Validation */

    if (
      !payload.error_message
    ) {

      statusText.textContent =
        "Please provide an error message.";

      errorMessageInput.focus();

      return;

    }


    /* Investigation state */

    lastPayload = payload;


    investigateBtn.disabled =
      true;


    investigateBtn.innerHTML = `
      <span class="btn-icon">◌</span>
      <span>Analyzing Failure...</span>
      <span class="btn-arrow">→</span>
    `;


    statusText.textContent =
      "FailureTrace is analyzing the failure signals...";


    resultFailure.textContent =
      "Analyzing submitted signals…";

    resultLocation.textContent =
      "Location pending";

    rootCause.textContent =
      "Waiting for the investigation result.";

    confidence.textContent =
      "…";

    if (confidenceMeterFill) {
      confidenceMeterFill.style.width = "8%";
    }

    if (confidenceExplanation) {

      confidenceExplanation.textContent =
        "Waiting for the confidence value returned with the root cause.";

    }

    resetSeverity();

    failureChain.innerHTML = "";
    recommendedFix.innerHTML = "";
    verificationPlan.innerHTML = "";

    if (evidenceList) {
      evidenceList.innerHTML = "";
    }

    if (verifyFixBanner) {
      verifyFixBanner.classList.add("hidden");
    }

    startAgentInvestigation(payload);

    resultCard.classList.add("is-investigating");

    resultCard.classList.remove("hidden");

    expandSignalsForm();


    try {

      const response =
        await fetch(
          "/investigate",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body:
              JSON.stringify(payload)

          }
        );


      const data =
        await response.json();


      /* Server / validation errors */

      if (!response.ok) {

        if (data.detail) {

          if (
            Array.isArray(data.detail)
          ) {

            throw new Error(
              data.detail
                .map(
                  item =>
                    item.msg
                )
                .join(" • ")
            );

          }


          throw new Error(
            data.detail
          );

        }


        throw new Error(
          "Investigation failed."
        );

      }


      /* Render result */

      recommendedFix.innerHTML = "";
      verificationPlan.innerHTML = "";

      /* Render result */

recommendedFix.innerHTML = "";
verificationPlan.innerHTML = "";

renderResult(data);

/* Save completed investigation to local history */

const historyItem = {
  id: Date.now(),
  createdAt: new Date().toISOString(),
  input: payload,
  result: data
};

const history =
  JSON.parse(
    localStorage.getItem("failuretrace_history") || "[]"
  );

history.unshift(historyItem);

localStorage.setItem(
  "failuretrace_history",
  JSON.stringify(history.slice(0, 20))
);

statusText.textContent =
  "Investigation completed successfully ✓";


    } catch (error) {

      console.error(
        "FailureTrace investigation error:",
        error
      );


      statusText.textContent =
        "Investigation failed ✕";


      resultCard.classList.remove("is-investigating");

      completeAgentInvestigation(false);


      resultFailure.textContent =
        "Unable to complete investigation.";


      resultLocation.textContent =
        error.message;


      rootCause.textContent =
        "The AI investigation could not be completed.";


      confidence.textContent =
        "ERROR";

      if (confidenceMeterFill) {
        confidenceMeterFill.style.width = "0%";
      }

      if (confidenceExplanation) {

        confidenceExplanation.textContent =
          "No confidence value is available because the investigation did not complete.";

      }

      resetSeverity();

      if (severityBadge) {
        severityBadge.textContent = "UNKNOWN";
      }


      failureChain.innerHTML =
        "";


      if (evidenceList) {
        evidenceList.innerHTML = "";
      }


      recommendedFix.innerHTML =
        "";


      verificationPlan.innerHTML =
        "";


      resultCard.classList.remove(
        "hidden"
      );


    } finally {

      investigateBtn.disabled =
        false;


      investigateBtn.innerHTML = `
        <span class="btn-icon">⌁</span>
        <span>Analyze Failure</span>
        <span class="btn-arrow">→</span>
      `;

    }

  }
);


/* =========================================================
   STARTUP
   ========================================================= */

checkHealth();

/* =========================================================
   INVESTIGATION HISTORY
   ========================================================= */

function renderHistory() {
  const historyList =
    document.getElementById("history-list");

  if (!historyList) {
    return;
  }

  const history =
    JSON.parse(
      localStorage.getItem("failuretrace_history") || "[]"
    );

  if (history.length === 0) {
    historyList.innerHTML = `
      <div class="empty-workspace">
        <div class="empty-icon">◷</div>

        <div class="home-kicker">
          NO INVESTIGATIONS YET
        </div>

        <h2>
          Your investigation history is empty.
        </h2>

        <p>
          Completed investigations will appear here.
        </p>

        <button
          class="primary-action"
          data-action="start-investigation"
          type="button"
        >
          Start an Investigation
          <span>→</span>
        </button>
      </div>
    `;

    return;
  }

  historyList.innerHTML = history.map((item) => {
    const result = item.result || {};
    const rootCause = result.root_cause || {};

    const date = new Date(item.createdAt);

    return `
      <button
        class="history-card"
        type="button"
        data-history-id="${item.id}"
      >
        <div class="history-card-top">
          <span class="history-date">
            ${date.toLocaleString()}
          </span>

          <span class="history-status">
            ${result.status || "needs_verification"}
          </span>
        </div>

        <h3>
          ${result.failure || "Investigation"}
        </h3>

        <p>
          ${rootCause.cause || "Root cause available"}
        </p>

        <div class="history-card-footer">
          <span>
            Confidence:
            ${Math.round((rootCause.confidence || 0) * 100)}%
          </span>

          <span>
            View Investigation →
          </span>
        </div>
      </button>
    `;
  }).join("");

  historyList
    .querySelectorAll(".history-card")
    .forEach((card) => {
      card.addEventListener("click", () => {
        const id = Number(card.dataset.historyId);

        const selected =
          history.find((item) => item.id === id);

        if (!selected) {
          return;
        }

        renderResult(selected.result);

        showView("investigate");
      });
    });
}


/* Load history whenever History is opened */

navItems.forEach((item) => {

  item.addEventListener("click", () => {

    if (item.dataset.view === "history") {
      renderHistory();
    }

  });

});


/* Clear history */

const clearHistoryBtn =
  document.getElementById("clear-history-btn");

if (clearHistoryBtn) {

  clearHistoryBtn.addEventListener("click", () => {

    const confirmed =
      window.confirm(
        "Clear all saved investigation history?"
      );

    if (!confirmed) {
      return;
    }

    localStorage.removeItem(
      "failuretrace_history"
    );

    renderHistory();

  });

}