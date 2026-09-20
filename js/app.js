let questions = [...questionBank];
let index = 0;
let score = 0;
let selected = null;
let answers = [];
let marked = new Set();
let activeTestBank = questionBank;
let activeTestLabel = "TEST 01";

const $ = (id) => document.getElementById(id);
const home = $("home-screen");
const quiz = $("quiz-screen");
const result = $("result-screen");

$("test-1-btn").addEventListener("click", () => startTest(questionBank, "TEST 01"));
$("test-2-btn").addEventListener("click", () => startTest(test2Questions, "TEST 02"));
$("test-3-btn").addEventListener("click", () => startTest(test3Questions, "TEST 03"));
$("home-btn").addEventListener("click", showHome);
$("result-home-btn").addEventListener("click", showHome);
$("previous-btn").addEventListener("click", previousQuestion);
$("save-next-btn").addEventListener("click", saveAndNext);
$("clear-btn").addEventListener("click", clearSelection);
$("review-btn").addEventListener("click", toggleReview);
$("explanation-btn").addEventListener("click", toggleExplanation);
$("submit-btn").addEventListener("click", submitAssessment);

$("retry-btn").addEventListener("click", () => {
  const retry = answers
    .filter(a => !a.correct)
    .map(a => activeTestBank.find(q => q.id === a.id))
    .filter(Boolean);
  startTest(retry.length ? retry : activeTestBank, activeTestLabel);
});

$("new-btn").addEventListener("click", () => startTest(activeTestBank, activeTestLabel));
$("review-answers-btn").addEventListener("click", () => {
  document.querySelector(".review-card").scrollIntoView({behavior:"smooth", block:"start"});
});
document.querySelectorAll(".filter-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach((item) => item.classList.remove("active"));
    btn.classList.add("active");
    renderReviewList(btn.dataset.filter || "all");
  });
});

function startTest(bank, testLabel = "") {
  activeTestBank = bank;
  questions = [...bank];
  activeTestLabel = testLabel || "CURRENT AFFAIRS";
  index = 0;
  score = 0;
  selected = null;
  answers = [];
  marked = new Set();

  home.classList.add("hidden");
  result.classList.add("hidden");
  quiz.classList.remove("hidden");

  $("exam-subtitle").textContent = testLabel
    ? \`CBT-1 • CURRENT AFFAIRS • ${testLabel} • PRACTICE\`
    : "CBT-1 • CURRENT AFFAIRS • PRACTICE";

  window.scrollTo({top: 0, behavior: "smooth"});
  render();
}

function render() {
  const q = questions[index];
  const saved = answers.find(a => a.id === q.id);

  $("question-count").textContent = \`Question ${index + 1} of ${questions.length}\`;
  $("question-number-label").textContent = \`Question ${index + 1} of ${questions.length}\`;
  $("score-live").textContent = \`Score ${score}/${questions.length}\`;
  $("progress-bar").style.width = \`${((index + 1) / questions.length) * 100}%\`;
  $("question-topic").textContent = q.topic;
  $("question-text").textContent = q.question;

  selected = saved ? saved.choice : null;

  resetFeedback();
  $("review-btn").textContent = marked.has(q.id) ? "★ Marked for Review" : "Mark for Review";
  $("review-btn").classList.toggle("marked", marked.has(q.id));
  $("previous-btn").disabled = index === 0;
  $("previous-btn").style.opacity = index === 0 ? ".55" : "1";
  $("save-next-btn").innerHTML = index === questions.length - 1
    ? 'Submit Test <span aria-hidden="true">✓</span>'
    : 'Save &amp; Next <span aria-hidden="true">→</span>';

  const box = $("options");
  box.innerHTML = "";

  q.options.forEach((option, i) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "option";

    const marker = document.createElement("span");
    marker.className = "option-radio";
    marker.setAttribute("aria-hidden", "true");

    const text = document.createElement("span");
    text.className = "option-text";
    text.textContent = \`${String.fromCharCode(65 + i)}. ${option}\`;

    button.append(marker, text);
    button.setAttribute("aria-pressed", selected === i ? "true" : "false");
    button.addEventListener("click", () => selectOption(i));
    box.appendChild(button);
  });

  if (saved) {
    applyValidationVisuals(q, saved.choice);
    showValidation(q, saved.choice, saved.correct, false);
  } else {
    $("explanation-btn").disabled = true;
  }

  renderPalette();
}

function renderPalette() {
  const box = $("question-palette");
  box.innerHTML = "";

  questions.forEach((q, i) => {
    const button = document.createElement("button");
    const answered = answers.some(a => a.id === q.id);

    button.type = "button";
    button.className = "palette-btn";

    if (answered) button.classList.add("answered");
    if (marked.has(q.id)) button.classList.add("review");
    if (i === index) button.classList.add("current");

    button.textContent = i + 1;
    button.title = answered ? "Answered" : "Unvisited";
    button.addEventListener("click", () => goToQuestion(i));
    box.appendChild(button);
  });
}

function selectOption(choice) {
  const q = questions[index];
  const saved = answers.find(a => a.id === q.id);

  if (saved) return;

  selected = choice;
  const correct = choice === q.answer;

  answers.push({id: q.id, choice, correct});
  if (correct) score++;

  applyValidationVisuals(q, choice);
  showValidation(q, choice, correct, true);
  renderPalette();
  $("score-live").textContent = \`Score ${score}/${questions.length}\`;

  $("options").classList.add("validation-pop");
  setTimeout(() => $("options").classList.remove("validation-pop"), 220);
}

function applyValidationVisuals(q, choice) {
  [...$("options").children].forEach((el, i) => {
    const isCorrect = i === q.answer;
    const isWrongChoice = i === choice && choice !== q.answer;
    const isChosen = i === choice;

    el.classList.toggle("selected", false);
    el.classList.toggle("correct", isCorrect);
    el.classList.toggle("wrong", isWrongChoice);
    el.setAttribute("aria-pressed", isChosen ? "true" : "false");
    el.disabled = true;
  });
}

function clearSelection() {
  const q = questions[index];
  const savedIndex = answers.findIndex(a => a.id === q.id);

  if (savedIndex < 0) return;

  if (answers[savedIndex].correct) score--;
  answers.splice(savedIndex, 1);

  selected = null;
  resetFeedback();

  [...$("options").children].forEach(el => {
    el.classList.remove("selected", "correct", "wrong");
    el.disabled = false;
    el.setAttribute("aria-pressed", "false");
  });

  $("score-live").textContent = \`Score ${score}/${questions.length}\`;
  renderPalette();
}

function toggleReview() {
  const id = questions[index].id;

  if (marked.has(id)) marked.delete(id);
  else marked.add(id);

  $("review-btn").textContent = marked.has(id) ? "★ Marked for Review" : "Mark for Review";
  $("review-btn").classList.toggle("marked", marked.has(id));
  renderPalette();
}

function saveAndNext() {
  if (index < questions.length - 1) {
    index++;
    window.scrollTo({top: 0, behavior: "smooth"});
    render();
    return;
  }

  submitAssessment();
}

function previousQuestion() {
  if (index === 0) return;
  index--;
  window.scrollTo({top: 0, behavior: "smooth"});
  render();
}

function goToQuestion(target) {
  index = target;
  window.scrollTo({top: 0, behavior: "smooth"});
  render();
}

function submitAssessment() {
  const unanswered = questions.length - answers.length;

  if (unanswered > 0) {
    const ok = window.confirm(
      \`${unanswered} question(s) are unanswered. Submit assessment anyway?\`
    );
    if (!ok) return;
  }

  showResult();
}

function toggleExplanation() {
  const saved = answers.find(a => a.id === questions[index].id);
  if (!saved) return;

  const details = $("feedback-details");
  const isHidden = details.classList.contains("hidden");

  details.classList.toggle("hidden", !isHidden);
  $("explanation-btn").textContent = isHidden
    ? "Hide Detailed Explanation"
    : "◉ View Detailed Explanation";
}

function showValidation(q, choice, correct, recordHistory) {
  const feedback = $("feedback");

  feedback.classList.remove("hidden", "is-correct", "is-wrong");
  feedback.classList.add(correct ? "is-correct" : "is-wrong");

  $("feedback-status").textContent = correct
    ? "✓ Correct answer"
    : "✕ Incorrect answer";

  $("feedback-answer").textContent = correct
    ? \`${String.fromCharCode(65 + q.answer)}. ${q.options[q.answer]}\`
    : \`Correct: ${String.fromCharCode(65 + q.answer)}. ${q.options[q.answer]} • Your answer: ${String.fromCharCode(65 + choice)}. ${q.options[choice]}\`;

  $("feedback-explanation").textContent =
    q.explanation || "Review the concept and related topics.";

  if (q.trick) {
    $("feedback-trick").textContent = q.trick;
    $("feedback-trick-wrap").classList.remove("hidden");
  } else {
    $("feedback-trick-wrap").classList.add("hidden");
  }

  const topics = q.relatedTopics || [q.topic];
  const topicBox = $("related-topics");
  topicBox.innerHTML = "";

  topics.forEach(topic => {
    const chip = document.createElement("button");
    chip.className = "topic-chip";
    chip.type = "button";
    chip.textContent = topic;
    chip.addEventListener("click", () => showRelatedContent(topic));
    topicBox.appendChild(chip);
  });

  if (recordHistory) updateTopicHistory(q.topic, correct);
  $("topic-status").textContent = getTopicStatus(q.topic);
  showRelatedContent(topics[0] || q.topic);

  $("feedback-details").classList.add("hidden");
  $("explanation-btn").disabled = false;
  $("explanation-btn").textContent = "◉ View Detailed Explanation";
}

function resetFeedback() {
  $("feedback").classList.add("hidden");
  $("feedback").classList.remove("is-correct", "is-wrong");
  $("feedback-status").textContent = "";
  $("feedback-answer").textContent = "";
  $("feedback-details").classList.add("hidden");
  $("feedback-explanation").textContent = "";
  $("feedback-trick").textContent = "";
  $("feedback-trick-wrap").classList.add("hidden");
  $("related-topics").innerHTML = "";
  $("related-content").innerHTML = "";
  $("related-content").classList.add("hidden");
  $("topic-status").textContent = "";
  $("explanation-btn").disabled = true;
  $("explanation-btn").textContent = "◉ View Detailed Explanation";
}

function updateTopicHistory(topic, currentCorrect) {
  const history = JSON.parse(localStorage.getItem("rrbTopicHistory") || "{}");
  if (!history[topic]) history[topic] = {correct: 0, wrong: 0};

  history[topic][currentCorrect ? "correct" : "wrong"]++;
  localStorage.setItem("rrbTopicHistory", JSON.stringify(history));
}

function getTopicStatus(topic) {
  const history = JSON.parse(localStorage.getItem("rrbTopicHistory") || "{}");
  const h = history[topic] || {correct: 0, wrong: 0};

  if (h.wrong >= 2 && h.wrong >= h.correct) {
    return \`Needs focused revision • ${h.wrong} mistake(s) recorded in ${topic}\`;
  }

  if (h.correct >= 3 && h.correct > h.wrong) {
    return \`Strong topic • ${h.correct} correct answer(s) recorded in ${topic}\`;
  }

  return \`Keep practicing • ${topic}\`;
}

function showRelatedContent(topic) {
  const box = $("related-content");
  const matches = activeTestBank.filter(q =>
    q.topic === topic || (q.relatedTopics || []).includes(topic)
  );

  box.innerHTML = "";

  if (!matches.length) {
    box.classList.add("hidden");
    return;
  }

  const title = document.createElement("div");
  title.className = "related-content-title";
  title.textContent = `Related content • ${topic}`;
  box.appendChild(title);

  matches.slice(0, 4).forEach(q => {
    const item = document.createElement("article");
    item.className = "related-item";

    const top = document.createElement("div");
    top.className = "related-item-top";

    const tag = document.createElement("span");
    tag.className = "related-item-topic";
    tag.textContent = q.topic;

    const answer = document.createElement("span");
    answer.className = "related-item-answer";
    answer.textContent = `✓ ${String.fromCharCode(65 + q.answer)}. ${q.options[q.answer]}`;

    top.append(tag, answer);

    const question = document.createElement("div");
    question.className = "related-item-question";
    question.textContent = q.question;

    const note = document.createElement("div");
    note.className = "related-item-note";
    note.textContent = q.explanation || q.trick || "Review this question again.";

    item.append(top, question, note);
    box.appendChild(item);
  });

  const actions = document.createElement("div");
  actions.className = "related-content-actions";

  const practice = document.createElement("button");
  practice.type = "button";
  practice.className = "related-practice-btn";
  practice.textContent = `Practice ${topic}`;
  practice.addEventListener("click", () => startTopicPractice(topic));

  actions.appendChild(practice);
  box.appendChild(actions);

  box.classList.remove("hidden");
}

function startTopicPractice(topic) {
  const related = activeTestBank.filter(
    q => q.topic === topic || (q.relatedTopics || []).includes(topic)
  );

  if (related.length) startTest(related, \`TOPIC • ${topic}\`);
}

function showHome() {
  if (!quiz.classList.contains("hidden") && answers.length > 0) {
    const leave = window.confirm("Leave this test? Your current answers will be cleared.");
    if (!leave) return;
  }
  quiz.classList.add("hidden");
  result.classList.add("hidden");
  home.classList.remove("hidden");
  window.scrollTo({top: 0, behavior: "smooth"});
}

function showResult() {
  quiz.classList.add("hidden");
  result.classList.remove("hidden");

  const attempted = answers.length;
  const correctCount = answers.filter((a) => a.correct).length;
  const wrongCount = attempted - correctCount;
  const unanswered = questions.length - attempted;
  const accuracy = attempted ? Math.round((correctCount / attempted) * 100) : 0;
  const angle = Math.round((correctCount / Math.max(questions.length, 1)) * 360);

  $("result-test-name").textContent = activeTestLabel + " • CURRENT AFFAIRS";
  $("result-score").textContent = correctCount + "/" + questions.length;
  $("result-summary").textContent = attempted + " attempted • " + correctCount + " correct • " + accuracy + "% accuracy";
  $("stat-correct").textContent = correctCount;
  $("stat-wrong").textContent = wrongCount;
  $("stat-unanswered").textContent = unanswered;
  $("stat-accuracy").textContent = accuracy + "%";
  $("score-ring").style.setProperty("--score-angle", angle + "deg");

  renderTopicAnalysis();
  renderRevisionFocus();
  renderReviewList("all");
}

function renderTopicAnalysis() {
  const stats = {};
  questions.forEach((q) => {
    const topic = q.topic || "General";
    if (!stats[topic]) stats[topic] = {total:0, correct:0, wrong:0, unanswered:0};
    stats[topic].total++;
    const answer = answers.find((a) => a.id === q.id);
    if (!answer) stats[topic].unanswered++;
    else if (answer.correct) stats[topic].correct++;
    else stats[topic].wrong++;
  });
  const box = $("topic-analysis");
  box.innerHTML = "";
  Object.entries(stats).forEach(([topic, s]) => {
    const accuracy = s.total ? Math.round((s.correct / s.total) * 100) : 0;
    let status = "Revisit"; let cls = "revisit";
    if (s.correct === s.total) { status = "Strong"; cls = "strong"; }
    else if (accuracy >= 60) { status = "Improve"; cls = "improve"; }
    const row = document.createElement("div");
    row.className = "topic-row";
    row.innerHTML = "<div class=\"topic-name\">" + topic + "</div>"
      + "<div class=\"topic-cell\"><strong>" + s.correct + "</strong>Correct</div>"
      + "<div class=\"topic-cell\"><strong>" + s.total + "</strong>Total</div>"
      + "<div class=\"mini-progress\" title=\"" + accuracy + "% accuracy\"><span style=\"width:" + accuracy + "%\"></span></div>"
      + "<div class=\"topic-status " + cls + "\">" + status + "</div>";
    box.appendChild(row);
  });
}

function renderRevisionFocus() {
  const box = $("revision-focus");
  box.innerHTML = "";
  const stats = {};
  questions.forEach((q) => {
    const answer = answers.find((a) => a.id === q.id);
    if (!answer || answer.correct) return;
    const topic = q.topic || "General";
    if (!stats[topic]) stats[topic] = {wrong:0, questions:[]};
    stats[topic].wrong++;
    stats[topic].questions.push(q.question);
  });
  const entries = Object.entries(stats);
  if (!entries.length) {
    box.innerHTML = "<div class=\"revision-empty\">No incorrect topics in this attempt. Review the answer key once before the next test.</div>";
    return;
  }
  entries.forEach(([topic, s]) => {
    const item = document.createElement("div");
    item.className = "revision-item";
    const examples = s.questions.slice(0,2).join(" ");
    item.innerHTML = "<strong>" + topic + "</strong><span>" + examples + "</span><div class=\"revision-metric\">" + s.wrong + " question(s) to review</div>";
    box.appendChild(item);
  });
}

function renderReviewList(filter = "all") {
  const list = $("review-list");
  list.innerHTML = "";
  const rows = questions.map((q, i) => {
    const answer = answers.find((a) => a.id === q.id);
    const status = !answer ? "unanswered" : answer.correct ? "correct" : "wrong";
    return {q, i, answer, status};
  }).filter((row) => filter === "all" || row.status === filter);
  if (!rows.length) {
    list.innerHTML = "<div class=\"review-empty\">No questions match this filter.</div>";
    return;
  }
  rows.forEach(({q, i, answer, status}) => {
    const item = document.createElement("article");
    item.className = "review-item";
    const head = document.createElement("div");
    head.className = "review-item-head";
    head.innerHTML = "<span class=\"review-qno\">Question " + (i + 1) + " • " + q.topic + "</span><span class=\"review-badge " + status + "\">" + status + "</span>";
    const question = document.createElement("div");
    question.className = "review-question";
    question.textContent = q.question;
    const grid = document.createElement("div");
    grid.className = "review-answer-grid";
    const userBox = document.createElement("div");
    userBox.className = "answer-box user" + (status === "wrong" ? " wrong" : "");
    const userValue = answer ? String.fromCharCode(65 + answer.choice) + ". " + q.options[answer.choice] : "Not attempted";
    userBox.innerHTML = "<span>Your answer</span>" + userValue;
    const correctBox = document.createElement("div");
    correctBox.className = "answer-box correct";
    correctBox.innerHTML = "<span>Correct answer</span>" + String.fromCharCode(65 + q.answer) + ". " + q.options[q.answer];
    grid.append(userBox, correctBox);
    const explanation = document.createElement("div");
    explanation.className = "review-explanation";
    explanation.textContent = q.explanation || "Review the concept from the detailed explanation.";
    item.append(head, question, grid, explanation);
    item.addEventListener("click", () => {
      result.classList.add("hidden"); quiz.classList.remove("hidden"); index = i; render(); window.scrollTo({top:0, behavior:"smooth"});
    });
    list.appendChild(item);
  });
}