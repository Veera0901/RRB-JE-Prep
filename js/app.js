let questions = [...questionBank];
let index = 0;
let score = 0;
let selected = null;
let answers = [];
let marked = new Set();
let activeTestBank = questionBank;

const $ = (id) => document.getElementById(id);
const home = $("home-screen"), quiz = $("quiz-screen"), result = $("result-screen");

$("test-1-btn").addEventListener("click", () => startTest(questionBank));
$("test-2-btn").addEventListener("click", () => startTest(test2Questions));
$("test-3-btn").addEventListener("click", () => startTest(test3Questions));
$("home-btn").addEventListener("click", showHome);
$("result-home-btn").addEventListener("click", showHome);
$("previous-btn").addEventListener("click", previousQuestion);
$("save-next-btn").addEventListener("click", saveAndNext);
$("clear-btn").addEventListener("click", clearSelection);
$("review-btn").addEventListener("click", toggleReview);
$("explanation-btn").addEventListener("click", toggleExplanation);
$("submit-btn").addEventListener("click", submitAssessment);
$("retry-btn").addEventListener("click", () => {
  const retry = answers.filter(a => !a.correct).map(a => activeTestBank.find(q => q.id === a.id)).filter(Boolean);
  startTest(retry.length ? retry : activeTestBank);
});
$("new-btn").addEventListener("click", () => startTest(activeTestBank));

function startTest(bank) {
  activeTestBank = bank;
  questions = [...bank];
  index = 0;
  score = 0;
  selected = null;
  answers = [];
  marked = new Set();
  home.classList.add("hidden");
  result.classList.add("hidden");
  quiz.classList.remove("hidden");
  window.scrollTo({top:0, behavior:"smooth"});
  render();
}

function render() {
  const q = questions[index];
  const saved = answers.find(a => a.id === q.id);

  $("question-count").textContent = `Question ${index + 1} of ${questions.length}`;
  $("question-number-label").textContent = `Question ${index + 1} of ${questions.length}`;
  $("score-live").textContent = `${score} correct`;
  $("progress-bar").style.width = `${((index + 1) / questions.length) * 100}%`;
  $("question-topic").textContent = q.topic;
  $("question-text").textContent = q.question;

  selected = saved ? saved.choice : null;
  $("feedback").classList.add("hidden");
  $("feedback-status").textContent = "";
  $("feedback-trick-wrap").classList.add("hidden");
  $("related-topics").innerHTML = "";
  $("topic-status").textContent = "";
  $("explanation-btn").textContent = "◉ View Detailed Explanation";
  $("review-btn").textContent = marked.has(q.id) ? "★ Marked for Review" : "Mark for Review";
  $("review-btn").classList.toggle("marked", marked.has(q.id));
  $("previous-btn").disabled = index === 0;
  $("previous-btn").style.opacity = index === 0 ? ".55" : "1";

  const box = $("options");
  box.innerHTML = "";
  q.options.forEach((option, i) => {
    const button = document.createElement("button");
    button.className = "option";
    if (selected === i) button.classList.add("selected");
    button.textContent = `${String.fromCharCode(65+i)}. ${option}`;
    button.addEventListener("click", () => selectOption(i));
    box.appendChild(button);
  });

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
  selected = choice;
  [...$("options").children].forEach((el, i) => el.classList.toggle("selected", i === choice));
}

function clearSelection() {
  if (selected === null) return;
  const q = questions[index];
  const saved = answers.findIndex(a => a.id === q.id);
  if (saved >= 0) {
    if (answers[saved].correct) score--;
    answers.splice(saved, 1);
  }
  selected = null;
  [...$("options").children].forEach(el => el.classList.remove("selected", "correct", "wrong"));
  $("score-live").textContent = `${score} correct`;
  renderPalette();
}

function toggleReview() {
  const id = questions[index].id;
  if (marked.has(id)) {
    marked.delete(id);
  } else {
    marked.add(id);
  }
  $("review-btn").textContent = marked.has(id) ? "★ Marked for Review" : "Mark for Review";
  $("review-btn").classList.toggle("marked", marked.has(id));
  renderPalette();
}

function saveAndNext() {
  const q = questions[index];

  if (selected !== null) {
    const correct = selected === q.answer;
    const existing = answers.findIndex(a => a.id === q.id);

    if (existing >= 0) {
      if (answers[existing].correct !== correct) score += correct ? 1 : -1;
      answers[existing] = {id:q.id, choice:selected, correct};
    } else {
      answers.push({id:q.id, choice:selected, correct});
      if (correct) score++;
    }

    showFeedback(q, correct);
    renderPalette();
  }

  if (index < questions.length - 1) {
    setTimeout(() => {
      index++;
      render();
    }, selected !== null ? 160 : 0);
  } else {
    setTimeout(showResult, selected !== null ? 160 : 0);
  }
}

function previousQuestion() {
  if (index === 0) return;
  index--;
  render();
}

function goToQuestion(target) {
  index = target;
  render();
  window.scrollTo({top:0, behavior:"smooth"});
}

function submitAssessment() {
  const unanswered = questions.length - answers.length;
  if (unanswered > 0) {
    const ok = window.confirm(`${unanswered} question(s) are unanswered. Submit assessment anyway?`);
    if (!ok) return;
  }
  showResult();
}

function toggleExplanation() {
  const feedback = $("feedback");
  if (feedback.classList.contains("hidden")) {
    const q = questions[index];
    const saved = answers.find(a => a.id === q.id);

    $("feedback-status").textContent = saved ? (saved.correct ? "✓ Correct" : "✗ Incorrect") : "Explanation";
    $("feedback-answer").textContent = `${String.fromCharCode(65 + q.answer)}. ${q.options[q.answer]}`;
    $("feedback-explanation").textContent = q.explanation || "Review the concept and related topics.";
    feedback.classList.remove("hidden");
    $("explanation-btn").textContent = "Hide Detailed Explanation";
  } else {
    feedback.classList.add("hidden");
    $("explanation-btn").textContent = "◉ View Detailed Explanation";
  }
}

function showFeedback(q, correct) {
  const feedback = $("feedback");
  $("feedback-status").textContent = correct ? "✓ Correct" : "✗ Incorrect";
  $("feedback-answer").textContent = `${String.fromCharCode(65 + q.answer)}. ${q.options[q.answer]}`;
  $("feedback-explanation").textContent = q.explanation || "Review the concept and related topics.";

  if (q.trick) {
    $("feedback-trick").textContent = q.trick;
    $("feedback-trick-wrap").classList.remove("hidden");
  }

  const topics = q.relatedTopics || [q.topic];
  const topicBox = $("related-topics");
  topicBox.innerHTML = "";
  topics.forEach(topic => {
    const chip = document.createElement("button");
    chip.className = "topic-chip";
    chip.type = "button";
    chip.textContent = topic;
    chip.addEventListener("click", () => startTopicPractice(topic));
    topicBox.appendChild(chip);
  });

  $("topic-status").textContent = getTopicStatus(q.topic, correct);
  feedback.classList.remove("hidden");
  $("explanation-btn").textContent = "Hide Detailed Explanation";
}

function getTopicStatus(topic, currentCorrect) {
  const history = JSON.parse(localStorage.getItem("rrbTopicHistory") || "{}");
  if (!history[topic]) history[topic] = {correct:0, wrong:0};
  history[topic][currentCorrect ? "correct" : "wrong"]++;
  localStorage.setItem("rrbTopicHistory", JSON.stringify(history));
  const h = history[topic];
  if (h.wrong >= 2 && h.wrong >= h.correct) return `🔴 Needs focused revision — ${h.wrong} mistake(s) recorded in ${topic}.`;
  if (h.correct >= 3 && h.correct > h.wrong) return `🟢 Strong topic — ${h.correct} correct answer(s) recorded in ${topic}.`;
  return `🟡 Needs revision — keep practicing ${topic}.`;
}

function startTopicPractice(topic) {
  const related = activeTestBank.filter(q => q.topic === topic || (q.relatedTopics || []).includes(topic));
  if (related.length) startTest(related);
}

function showHome() {
  quiz.classList.add("hidden");
  result.classList.add("hidden");
  home.classList.remove("hidden");
  window.scrollTo({top:0, behavior:"smooth"});
}

function showResult() {
  quiz.classList.add("hidden");
  result.classList.remove("hidden");
  $("result-title").textContent = `${score}/${questions.length}`;
  $("result-summary").textContent = `${score === questions.length ? "Perfect score." : "Review the missed questions and retry them."}`;

  const list = $("review-list");
  list.innerHTML = "";
  questions.forEach(q => {
    const a = answers.find(x => x.id === q.id);
    if (!a) return;
    const div = document.createElement("div");
    div.className = "review";
    div.innerHTML = `<strong>${a.correct ? "✓" : "✗"} ${q.question}</strong><small>Your answer: ${String.fromCharCode(65+a.choice)}. ${q.options[a.choice]}<br>Correct answer: ${String.fromCharCode(65+q.answer)}. ${q.options[q.answer]}<br>${q.explanation}</small>`;
    list.appendChild(div);
  });
}
