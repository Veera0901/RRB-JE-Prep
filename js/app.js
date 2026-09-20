let questions = [...questionBank];
let index = 0;
let score = 0;
let selected = null;
let answers = [];

const $ = (id) => document.getElementById(id);
const home = $("home-screen"), quiz = $("quiz-screen"), result = $("result-screen");

$("test-1-btn").addEventListener("click", () => startTest(questionBank));
$("home-btn").addEventListener("click", showHome);
$("result-home-btn").addEventListener("click", showHome);
$("next-btn").addEventListener("click", nextQuestion);
$("retry-btn").addEventListener("click", () => {
  const retry = answers.filter(a => !a.correct).map(a => questionBank.find(q => q.id === a.id));
  startTest(retry.length ? retry : questionBank);
});
$("new-btn").addEventListener("click", () => startTest(questionBank));

function startTest(bank) {
  questions = [...bank];
  index = 0; score = 0; selected = null; answers = [];
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
  $("next-btn").disabled = true;
  selected = null;
  $("feedback").classList.add("hidden");
  $("feedback-status").textContent = "";
  $("feedback-trick-wrap").classList.add("hidden");
  $("related-topics").innerHTML = "";
  $("topic-status").textContent = "";

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

function selectOption(choice, button) {
  if (selected !== null) return;
  selected = choice;
  const q = questions[index];
  const correct = choice === q.answer;
  if (correct) score++;
  answers.push({id:q.id, choice, correct});

  [...$("options").children].forEach((el, i) => {
    el.disabled = true;
    if (i === q.answer) el.classList.add("correct");
    if (i === choice && !correct) el.classList.add("wrong");
  });

  $("score-live").textContent = `${score} correct`;
  showFeedback(q, correct);
  $("next-btn").disabled = false;
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
  topics.forEach(topic => {
    const chip = document.createElement("button");
    chip.className = "topic-chip";
    chip.type = "button";
    chip.textContent = topic;
    chip.title = "Topic filter will be connected to the topic practice bank.";
    chip.addEventListener("click", () => startTopicPractice(topic));
    topicBox.appendChild(chip);
  });

  $("topic-status").textContent = getTopicStatus(q.topic, correct);
  feedback.classList.remove("hidden");
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
  const related = questionBank.filter(q =>
    q.topic === topic || (q.relatedTopics || []).includes(topic)
  );
  if (related.length) startTest(related);
}

function showHome() {
  quiz.classList.add("hidden");
  result.classList.add("hidden");
  home.classList.remove("hidden");
  window.scrollTo({top:0, behavior:"smooth"});
}

function nextQuestion() {
  index++;
  if (index < questions.length) render();
  else showResult();
}

function showResult() {
  quiz.classList.add("hidden");
  result.classList.remove("hidden");
  $("result-title").textContent = `${score}/${questions.length}`;
  $("result-summary").textContent = `${score === questions.length ? "Perfect score." : "Review the missed questions and retry them."}`;

  const list = $("review-list");
  list.innerHTML = "";
  answers.forEach(a => {
    const q = questionBank.find(x => x.id === a.id);
    const div = document.createElement("div");
    div.className = "review";
    div.innerHTML = `<strong>${a.correct ? "✓" : "✗"} ${q.question}</strong>
      <small>Correct answer: ${String.fromCharCode(65+q.answer)}. ${q.options[q.answer]}<br>${q.explanation}</small>`;
    list.appendChild(div);
  });
}