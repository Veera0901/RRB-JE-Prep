let questions = [...questionBank];
let index = 0;
let score = 0;
let selected = null;
let answers = [];

const $ = (id) => document.getElementById(id);
const start = $("start-screen"), quiz = $("quiz-screen"), result = $("result-screen");

$("start-btn").addEventListener("click", () => startTest(questions));
$("next-btn").addEventListener("click", nextQuestion);
$("retry-btn").addEventListener("click", () => {
  const retry = answers.filter(a => !a.correct).map(a => questionBank.find(q => q.id === a.id));
  startTest(retry.length ? retry : questionBank);
});
$("new-btn").addEventListener("click", () => startTest(questionBank));

function startTest(bank) {
  questions = [...bank];
  index = 0; score = 0; selected = null; answers = [];
  start.classList.add("hidden"); result.classList.add("hidden"); quiz.classList.remove("hidden");
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
  $("next-btn").disabled = false;
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