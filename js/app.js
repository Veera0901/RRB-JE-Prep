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
$("save-next-btn").addEventListener("click", saveAndNext);
$("clear-btn").addEventListener("click", clearSelection);
$("review-btn").addEventListener("click", toggleReview);
$("explanation-btn").addEventListener("click", toggleExplanation);
$("retry-btn").addEventListener("click", () => {
  const retry = answers.filter(a => !a.correct).map(a => activeTestBank.find(q => q.id === a.id)).filter(Boolean);
  startTest(retry.length ? retry : activeTestBank);
});
$("new-btn").addEventListener("click", () => startTest(activeTestBank));

function startTest(bank) {
  activeTestBank = bank;
  questions = [...bank];
  index = 0; score = 0; selected = null; answers = []; marked = new Set();
  home.classList.add("hidden"); result.classList.add("hidden"); quiz.classList.remove("hidden");
  render();
}

function render() {
  const q = questions[index];
  $("question-count").textContent = `Question ${index + 1} of ${questions.length}`;
  $("score-live").textContent = `${score} correct`;
  $("progress-bar").style.width = `${((index) / questions.length) * 100}%`;
  $("question-topic").textContent = q.topic;
  $("question-text").textContent = q.question;
  selected = null;
  $("feedback").classList.add("hidden");
  $("feedback-status").textContent = "";
  $("feedback-trick-wrap").classList.add("hidden");
  $("related-topics").innerHTML = "";
  $("topic-status").textContent = "";
  $("explanation-btn").textContent = "View Explanation";
  $("review-btn").textContent = marked.has(q.id) ? "★ Marked for Review" : "☆ Mark for Review";
  $("review-btn").classList.toggle("marked", marked.has(q.id));

  const box = $("options");
  box.innerHTML = "";
  q.options.forEach((option, i) => {
    const button = document.createElement("button");
    button.className = "option";
    button.textContent = `${String.fromCharCode(65+i)}. ${option}`;
    button.addEventListener("click", () => selectOption(i, button));
    box.appendChild(button);
  });
}

function selectOption(choice) {
  if (selected !== null) return;
  selected = choice;
  $("save-next-btn").disabled = false;
  [...$("options").children].forEach((el, i) => el.classList.toggle("selected", i === choice));
}

function clearSelection() {
  if (selected === null) return;
  selected = null;
  $("save-next-btn").disabled = false;
  [...$("options").children].forEach(el => el.classList.remove("selected", "correct", "wrong"));
}

function toggleReview() {
  const id = questions[index].id;
  if (marked.has(id)) {
    marked.delete(id);
    $("review-btn").textContent = "☆ Mark for Review";
    $("review-btn").classList.remove("marked");
  } else {
    marked.add(id);
    $("review-btn").textContent = "★ Marked for Review";
    $("review-btn").classList.add("marked");
  }
}

function saveAndNext() {
  const q = questions[index];
  if (selected === null) {
    index++;
    if (index < questions.length) render();
    else showResult();
    return;
  }
  const correct = selected === q.answer;
  const existing = answers.findIndex(a => a.id === q.id);
  if (existing >= 0) {
    if (answers[existing].correct !== correct) score += correct ? 1 : -1;
    answers[existing] = {id:q.id, choice:selected, correct};
  } else {
    answers.push({id:q.id, choice:selected, correct});
    if (correct) score++;
  }

  [...$("options").children].forEach((el, i) => {
    el.disabled = true;
    if (i === q.answer) el.classList.add("correct");
    if (i === selected && !correct) el.classList.add("wrong");
  });
  $("score-live").textContent = `${score} correct`;
  showFeedback(q, correct);

  setTimeout(() => {
    index++;
    if (index < questions.length) render();
    else showResult();
  }, 180);
}

function toggleExplanation() {
  const feedback = $("feedback");
  if (feedback.classList.contains("hidden")) {
    if (selected === null) {
      $("feedback-status").textContent = "Explanation";
      $("feedback-answer").textContent = `Correct answer: ${String.fromCharCode(65 + questions[index].answer)}. ${questions[index].options[questions[index].answer]}`;
      $("feedback-explanation").textContent = questions[index].explanation || "Review the concept and related topics.";
      feedback.classList.remove("hidden");
    } else {
      showFeedback(questions[index], selected === questions[index].answer);
    }
    $("explanation-btn").textContent = "Hide Explanation";
  } else {
    feedback.classList.add("hidden");
    $("explanation-btn").textContent = "View Explanation";
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
  $("explanation-btn").textContent = "Hide Explanation";
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
  quiz.classList.add("hidden"); result.classList.add("hidden"); home.classList.remove("hidden");
  window.scrollTo({top:0, behavior:"smooth"});
}

function showResult() {
  quiz.classList.add("hidden"); result.classList.remove("hidden");
  $("result-title").textContent = `${score}/${questions.length}`;
  $("result-summary").textContent = `${score === questions.length ? "Perfect score." : "Review the missed questions and retry them."}`;
  const list = $("review-list");
  list.innerHTML = "";
  answers.forEach(a => {
    const q = activeTestBank.find(x => x.id === a.id);
    const div = document.createElement("div");
    div.className = "review";
    div.innerHTML = `<strong>${a.correct ? "✓" : "✗"} ${q.question}</strong><small>Correct answer: ${String.fromCharCode(65+q.answer)}. ${q.options[q.answer]}<br>${q.explanation}</small>`;
    list.appendChild(div);
  });
}