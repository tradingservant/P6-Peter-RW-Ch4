const fs = require("fs");
const vm = require("vm");
const path = require("path");

const code = fs.readFileSync(path.join(__dirname, "../js/content.js"), "utf8");
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(code, sandbox);
const content = sandbox.P6_CONTENT;

const failures = [];
function assert(cond, message) {
  if (!cond) failures.push(message);
}

const ids = content.modules.map((mod) => mod.id);
assert(ids.join() === "vocab,grammar,play,book,letter", "module order");

const never = [
  "Volunteering is about the difference you make, the thing you make and the volunteer you make.",
  "tidy",
  "visited",
  "charity",
  "grass",
  "Shaking Horror",
  "Yours sincerely,",
  "Dear principal,",
  "sell raffle tickets",
  "take part in a charity concert",
  "Neither Kelly nor I has free time in the morning.",
  "Since the people there are weak, there is not enough food.",
  "Since there is not enough food, the people there are week.",
  "The camps are to crowded for people too live comfortably.",
  "week",
  "to show she agrees with him about Max",
  "thinks that there is a bad smell",
  "He learnt that everyone can help and needs help sometimes.",
  "Charity Week at Kind Heart School",
  "Max's accident",
];

function walk(step, visit) {
  if (step.kind === "mcq") visit(step.answer, step.options, step.q);
  if (step.items && step.kind !== "teach" && step.kind !== "order") {
    step.items.forEach((item) => {
      if (item.answer) visit(item.answer, item.options || step.bank || null, item.q || item.before || item.say || item.sentence || item.id);
    });
  }
  if (step.kind === "builder") {
    step.items.forEach((item) => visit(item.full, null, item.id));
  }
  if (step.kind === "order") {
    visit(step.items.join(" → "), null, step.title);
  }
}

const answers = [];
content.modules.forEach((mod) => {
  assert(/[\u4e00-\u9fff]/.test(mod.help), `${mod.id} help is Chinese`);
  assert(/[\u4e00-\u9fff]/.test(mod.blurb), `${mod.id} blurb is Chinese`);
  mod.steps.forEach((step) => {
    walk(step, (answer, options, label) => {
      answers.push(answer);
      if (options) assert(options.includes(answer), `${mod.id} missing option for ${label}: ${answer}`);
      never.forEach((bad) => {
        if (bad === "KEEP") return;
        assert(answer !== bad, `${mod.id} marked a wrong answer correct: ${bad}`);
      });
    });
  });
});

const vocab = content.modules.find((mod) => mod.id === "vocab");
const iconHunt = vocab.steps.find((step) => step.kind === "iconHunt");
iconHunt.items.forEach((item) => {
  assert(item.say === content.gloss[item.answer], `Chinese prompt for ${item.answer}`);
  assert(/[\u4e00-\u9fff]/.test(item.say), `prompt Chinese ${item.answer}`);
  assert(!/[\u4e00-\u9fff]/.test(item.answer), `English answer ${item.answer}`);
});

const match = vocab.steps.find((step) => step.kind === "pictureMatch");
const matchMap = Object.fromEntries(match.items.map((item, index) => [index + 1, item.answer]));
assert(matchMap[1] === "F" && matchMap[2] === "B" && matchMap[3] === "G", "match 1-3");
assert(matchMap[4] === "H" && matchMap[5] === "D" && matchMap[6] === "I", "match 4-6");
assert(matchMap[7] === "E" && matchMap[8] === "A" && matchMap[9] === "C", "match 7-9");
assert(new Set(match.items.map((item) => item.answer)).size === 9, "letters once");
match.items.forEach((item) => {
  assert(!/[\u4e00-\u9fff]/.test(item.sentence), "match sentence stays English");
  assert(/[\u4e00-\u9fff]/.test(item.why), "match why Chinese");
});

const phraseBank = vocab.steps.find((step) => step.kind === "bank");
const phrases = Object.fromEntries(phraseBank.items.map((item) => [item.id, item.answer]));
assert(phrases.visit === "visit the elderly", "visit");
assert(phrases.flags === "sell flags", "flags");
assert(phrases.stall === "run a second-hand stall", "stall");
assert(phrases.homeless === "homeless", "homeless");
assert(phrases.clothes === "collect clothes", "clothes");
assert(phrases.organise === "organise a charity sale", "organise");
assert(phrases.run === "go on a charity run", "run");
assert(phrases.food === "donate canned food", "food");
assert(phrases.show === "take part in a charity show", "show");
assert(phrases.walk === "go on a charity walk", "walk");
assert(phrases.sale === "run a charity sale", "sale");
assert(answers.includes("Volunteering is about the choice you make, the difference you make and the world you make."), "quote");

const grammar = content.modules.find((mod) => mod.id === "grammar");
const connectors = grammar.steps.find((step) => step.kind === "bank" && step.bank.includes("either"));
const link = Object.fromEntries(connectors.items.map((item) => [item.id, item.answer]));
assert(link["either-day1"] === "either" && link["or-day2"] === "or", "either or");
assert(link["neither-day1"] === "Neither" && link["nor-day2"] === "nor", "neither nor");
assert(answers.includes("go on a charity run"), "day 1 activity");
assert(answers.includes("run a second-hand stall"), "day 2 activity");
assert(answers.includes("On Day 2, we can either take part in a charity concert or run a second-hand stall."), "day 2 either");
assert(answers.includes("Neither Kelly nor I have free time in the morning."), "have");
assert(answers.includes("Shall we go on a charity run together this summer?"), "shall we");
assert(answers.includes("The camps are too crowded for people to live comfortably."), "too");
assert(answers.includes("There are not enough doctors to help them all."), "not enough");
assert(answers.includes("Since there is not enough food, the people there are weak."), "since front");
assert(answers.includes("The people there are weak since there is not enough food."), "since builder");
assert(answers.includes("It is important for our community since it can help maintain the independence of old people by offering support for daily living."), "senior since");
assert(answers.includes("It helps old people."), "old people");
assert(answers.includes("It gives support and care services."), "support");
assert(answers.includes("weak"), "spelling weak");

const tommy = grammar.steps.find((step) => step.kind === "bank" && step.bank.includes("tidied"));
const forms = Object.fromEntries(tommy.items.map((item) => [item.id, item.answer]));
assert(forms.polite === "polite", "polite");
assert(forms.get === "gets on with", "gets on with");
assert(forms.agree === "agrees with", "agrees with");
assert(forms.share === "shares", "shares");
assert(forms.honest === "honest", "honest");
assert(forms.told === "told", "told");
assert(forms.lie === "lie to", "lie to");
assert(forms.tidy === "tidied", "tidied");
assert(answers.includes("take care of"), "unused word");
grammar.steps.filter((step) => step.kind === "mcq").forEach((step) => {
  assert(/[\u4e00-\u9fff]/.test(step.q), `grammar question Chinese: ${step.q}`);
  assert(/[\u4e00-\u9fff]/.test(step.why), `grammar why Chinese: ${step.q}`);
});

function passageText(mod) {
  return JSON.stringify(mod.steps.filter((step) => step.kind === "read").map((step) => step.paragraphs));
}

const play = content.modules.find((mod) => mod.id === "play");
const playText = passageText(play);
[
  "with his nose in the air",
  "Everyone needs help from time to time.",
  "Hong Kong Hospital",
  "who is blind",
  "who is in a wheelchair",
  "At the next charity fair",
  "It's Max Hill!",
].forEach((bit) => assert(playText.includes(bit), `play missing ${bit}`));
assert(!/[\u4e00-\u9fff]/.test(playText), "play passage stays English");

const playMcq = play.steps.filter((step) => step.kind === "mcq");
assert(playMcq[0].answer === "to share an important event from her life", "G2 Q1 D");
assert(playMcq[1].answer === "thinks he is better than the others and doesn't want to speak to them", "G2 Q2 D");
assert(playMcq[2].answer === "He learnt that blind people are kind and friendly.", "G2 Q3 D");
assert(playMcq[3].answer === "Max learns an important lesson", "G2 Q4 B");
playMcq.forEach((step) => {
  assert(/[\u4e00-\u9fff]/.test(step.q) && /[\u4e00-\u9fff]/.test(step.why), "play question and why Chinese");
  assert(!/[\u4e00-\u9fff]/.test(step.answer), "play answer English");
});

const summary = play.steps.find((step) => step.kind === "bank");
const words = Object.fromEntries(summary.items.map((item) => [item.id, item.answer]));
assert(words.hall === "hall" && words.bad === "bad" && words.help === "help", "summary start");
assert(words.hospital === "hospital" && words.accident === "accident", "summary middle");
assert(words.visit === "visit" && words.fair === "fair", "summary visit fair");
assert(summary.bank.includes("visited") && summary.bank.includes("charity"), "summary traps");

const book = content.modules.find((mod) => mod.id === "book");
const bookText = passageText(book);
["10 unlucky children", "earthquakes, droughts and typhoons", "colourfully illustrated", "a great choice", "Susanna Wong", "HK$98", "GREENHILL PRESS"].forEach((bit) => {
  assert(bookText.includes(bit), `cover missing ${bit}`);
});
assert(!/[\u4e00-\u9fff]/.test(bookText), "back cover stays English");
const bookMcq = book.steps.filter((step) => step.kind === "mcq");
assert(bookMcq.map((step) => step.answer).slice(0, 5).join("|") === [
  "6-12-year-olds",
  "It has been printed before.",
  "what the book is about",
  "How to Prevent the Flu",
  "the book",
].join("|"), "H1 key");
bookMcq.forEach((step) => assert(/[\u4e00-\u9fff]/.test(step.q) && /[\u4e00-\u9fff]/.test(step.why), "book questions Chinese"));
const blog = book.steps.find((step) => step.kind === "bank");
const blogMap = Object.fromEntries(blog.items.map((item) => [item.id, item.answer]));
assert(blogMap.information === "information" && blogMap.stories === "stories", "blog");
assert(blog.bank.includes("grass"), "grass trap");

const letter = content.modules.find((mod) => mod.id === "letter");
const order = letter.steps.find((step) => step.kind === "order");
assert(order.items[0] === "28th October, 2025", "date first");
assert(order.items[1] === "Dear Principal,", "greeting");
assert(order.items[4] === "Yours faithfully,", "closing");
assert(order.items[5] === "Joey", "name");
const letterBank = letter.steps.find((step) => step.kind === "bank");
const bits = Object.fromEntries(letterBank.items.map((item) => [item.id, item.answer]));
assert(bits.since === "since" && bits.too === "too" && bits.enough === "not enough", "letter grammar");
assert(bits.who === "who", "who");
assert(bits.close === "Yours faithfully," && bits.dear === "Dear Principal,", "format words");
assert(letterBank.bank.includes("Yours sincerely,") && letterBank.bank.includes("to"), "letter traps");
const letterText = passageText(letter);
assert(letterText.includes("Yours faithfully,"), "model closing");
assert(letterText.includes("since") && letterText.includes("not enough") && letterText.includes("who"), "model patterns");
assert(!/[\u4e00-\u9fff]/.test(letterText), "model letter stays English");
assert(!letterText.includes("Doris"), "no student name");

const game = fs.readFileSync(path.join(__dirname, "../js/game.js"), "utf8");
assert(game.includes("p6-peter-rw-ch4-v1"), "stars key");
assert(game.includes("主頁") && game.includes("提示") && game.includes("音效"), "Chinese buttons");
const sw = fs.readFileSync(path.join(__dirname, "../sw.js"), "utf8");
assert(sw.includes("p6-peter-rw-ch4-v1"), "cache name");
const html = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
assert(html.includes("js/content.js") && html.includes("js/game.js") && html.includes("manifest.webmanifest"), "page links");

const simplified = "这们为国学问后发体东车来过还对时样经书长门开关云产广贝页风飞马鱼鸟龙";
const chineseBits = [];
function collectChinese(value) {
  if (typeof value === "string") chineseBits.push(value);
  else if (Array.isArray(value)) value.forEach(collectChinese);
  else if (value && typeof value === "object") Object.values(value).forEach(collectChinese);
}
collectChinese(content);
const joined = chineseBits.join("\n");
[...simplified].forEach((ch) => {
  if (joined.includes(ch)) failures.push(`simplified character ${ch}`);
});

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(`ok ${answers.length} keyed answers`);
