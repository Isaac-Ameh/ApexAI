import { r as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
import { i as toMessageCitations } from "./cite-match-JorDBpLw.mjs";
import { r as getSql } from "./db-CNQiNIe4.mjs";
import { t as authMiddleware } from "./middleware-BKMfHfWy.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/actions-B-2XAn9q.js
var STALE_MS = 10368e5;
function flatten(chapters) {
	return chapters.flatMap((ch) => ch.topics);
}
function avg(nums) {
	if (!nums.length) return null;
	return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}
/** Real study evidence — navigation / last-viewed is not progress. */
function topicHasProgress(attempts, mastery) {
	return attempts > 0 || mastery != null;
}
function computeReadiness(chapters) {
	const topics = flatten(chapters);
	const assessed = topics.filter((t) => t.mastery !== null);
	const overall = avg(assessed.map((t) => t.mastery)) ?? 0;
	const explored = topics.filter((t) => topicHasProgress(t.attempts, t.mastery));
	const strong = assessed.filter((t) => (t.mastery ?? 0) >= 75).map((t) => ({
		id: t.id,
		title: t.title,
		mastery: t.mastery
	})).sort((a, b) => b.mastery - a.mastery);
	const needsAttention = topics.filter((t) => t.mastery === null || (t.mastery ?? 0) < 60).map((t) => ({
		id: t.id,
		title: t.title,
		mastery: t.mastery
	})).sort((a, b) => (a.mastery ?? -1) - (b.mastery ?? -1));
	const weakest = needsAttention[0] ?? null;
	let label = "Not started";
	if (assessed.length === 0) label = "Not started";
	else if (overall >= 80 && needsAttention.length === 0) label = "Exam ready";
	else if (overall >= 65 && assessed.length >= Math.ceil(topics.length * .6)) label = "Almost ready";
	else label = "Developing";
	return {
		label,
		overall,
		exploredPct: topics.length ? Math.round(explored.length / topics.length * 100) : 0,
		assessedPct: topics.length ? Math.round(assessed.length / topics.length * 100) : 0,
		strong: strong.slice(0, 6),
		needsAttention: needsAttention.slice(0, 8),
		weakest
	};
}
function recommend(input) {
	const topics = flatten(input.chapters);
	if (!topics.length) return {
		kind: "study",
		title: "Add your course",
		body: "Upload material and I will map the course before we study.",
		cta: "Add course"
	};
	const first = topics[0];
	const last = topics.find((t) => t.id === input.lastTopicId) ?? null;
	const unassessed = topics.find((t) => t.mastery === null);
	const weakest = topics.filter((t) => t.mastery !== null).sort((a, b) => (a.mastery ?? 0) - (b.mastery ?? 0))[0];
	const stale = input.lastStudiedAt && Date.now() - Date.parse(input.lastStudiedAt) > STALE_MS;
	if (!last && !input.lastTopicId) return {
		kind: "study",
		title: "Start with the first topic",
		body: `Let's begin with ${first.title}. I'll walk you through the ideas, then we'll check whether they stuck.`,
		cta: "Begin study",
		topicId: first.id,
		topicTitle: first.title
	};
	if (last && last.attempts === 0) return {
		kind: "check",
		title: "A short check before we continue",
		body: `You just studied ${last.title}. A 5-question check will show what landed and what still needs work.`,
		cta: "Start check",
		topicId: last.id,
		topicTitle: last.title,
		count: 5
	};
	if (last && last.mastery !== null && last.mastery < 50) return {
		kind: "review",
		title: "Let's approach this differently",
		body: `You've struggled with ${last.title}. We'll re-explain the core ideas from the source, then try a smaller set of questions.`,
		cta: "Review topic",
		topicId: last.id,
		topicTitle: last.title
	};
	if (last && last.mastery !== null && last.mastery < 75) return {
		kind: "practice",
		title: "Targeted practice",
		body: `You performed well on the basics of ${last.title}, but the application questions still need work. I recommend a short practice set before moving on.`,
		cta: "Practice this topic",
		topicId: last.id,
		topicTitle: last.title,
		count: 6
	};
	if (stale && last) return {
		kind: "review",
		title: "A quick retrieval check",
		body: `You haven't reviewed ${last.title} in a while. A short retrieval check would be useful before new material.`,
		cta: "Review now",
		topicId: last.id,
		topicTitle: last.title,
		count: 5
	};
	if (weakest && (weakest.mastery ?? 0) < 55) return {
		kind: "practice",
		title: "Your most important weakness",
		body: `${weakest.title} is the topic pulling exam readiness down. Targeted practice here will move the needle fastest.`,
		cta: "Practice weak topic",
		topicId: weakest.id,
		topicTitle: weakest.title,
		count: 8
	};
	if (last && last.mastery !== null && last.mastery >= 75) {
		const next = topics[topics.findIndex((t) => t.id === last.id) + 1];
		if (next) return {
			kind: "advance",
			title: "Ready for the next topic",
			body: `You are solid on ${last.title}. Next up is ${next.title}.`,
			cta: "Continue",
			topicId: next.id,
			topicTitle: next.title
		};
	}
	if (unassessed) return {
		kind: "study",
		title: "Still unassessed",
		body: `${unassessed.title} has not been checked yet. Study it, then take a short check so I can update your learner model.`,
		cta: "Study this topic",
		topicId: unassessed.id,
		topicTitle: unassessed.title
	};
	if (computeReadiness(input.chapters).label !== "Exam ready") return {
		kind: "exam",
		title: "Diagnostic exam",
		body: "Most topics have evidence. A practice exam will show whether you are actually exam-ready.",
		cta: "Start practice exam",
		count: 12
	};
	return {
		kind: "exam",
		title: "Keep the edge",
		body: "You look exam-ready. A mixed practice exam will keep retrieval strong.",
		cta: "Sit a practice exam",
		count: 12
	};
}
function detectIntent$1(message) {
	const text = message.trim().toLowerCase();
	const n = text.match(/(\d+)\s*(questions?|mcqs?|items?)/);
	const count = n ? Math.max(3, Math.min(20, Number(n[1]))) : void 0;
	if (/exam ready|am i ready|readiness|practice exam/.test(text)) return {
		kind: "exam",
		count: count ?? 12
	};
	if (/quiz|practice|questions?|test me|mcq/.test(text)) return {
		kind: "practice",
		count: count ?? 8
	};
	if (/review|don't understand|dont understand|still don't|confused/.test(text)) return { kind: "review" };
	return { kind: "chat" };
}
function updateMastery(prev, correct) {
	const incoming = correct ? 100 : 25;
	if (prev === null) return incoming;
	return Math.round(prev * .65 + incoming * .35);
}
function windows(text, size = 1800, overlap = 0) {
	const clean = text.replace(/\s+/g, " ").trim();
	if (!clean) return [];
	if (clean.length <= size) return [clean];
	const out = [];
	let i = 0;
	while (i < clean.length) {
		out.push(clean.slice(i, i + size));
		i += size - overlap;
	}
	return out;
}
var HEADING = /^(?:chapter\s+\d+\b|[0-9]{1,2}(?:\.[0-9]{1,2}){0,2}\s+\S.{2,80}|[A-Z][A-Z0-9 ,/\-]{8,72})$/;
function fallbackStructure(raw, hint) {
	const heads = raw.split(/\n+/).map((l) => l.trim()).filter(Boolean).filter((l) => HEADING.test(l)).slice(0, 20);
	const title = hint?.title || heads[0] || "Untitled course";
	const code = hint?.code || (title.match(/\b[A-Z]{2,4}\s?\d{2,3}\b/)?.[0] ?? "COURSE");
	if (heads.length >= 3) {
		const chapters = [];
		let current = {
			title: "Introduction",
			topics: []
		};
		for (const h of heads) if (/^chapter\s+\d+/i.test(h) || /^[0-9]+\s/.test(h)) {
			if (current.topics.length) chapters.push(current);
			current = {
				title: h,
				topics: []
			};
		} else current.topics.push({
			title: h,
			summary: `Material covering ${h}, taken from the uploaded source.`,
			keyIdeas: [h]
		});
		if (current.topics.length) chapters.push(current);
		if (!chapters.length) chapters.push({
			title: "Course material",
			topics: heads.map((h) => ({
				title: h,
				summary: `Material covering ${h}.`,
				keyIdeas: [h]
			}))
		});
		return {
			code,
			title,
			chapters: chapters.slice(0, 12)
		};
	}
	return {
		code,
		title,
		chapters: [{
			title: "Course material",
			topics: windows(raw.replace(/\s+/g, " "), 1800, 0).slice(0, 8).map((s, i) => ({
				title: `Section ${i + 1}`,
				summary: s.slice(0, 240),
				keyIdeas: []
			}))
		}]
	};
}
var SAMPLE_CIT102 = {
	code: "CIT 102",
	title: "Computer Fundamentals",
	sourceName: "CIT 102 — Computer Fundamentals (sample course pack)",
	chapters: [
		{
			title: "Chapter 1 — Introduction to Computing",
			topics: [
				{
					title: "What is a Computer",
					summary: "A computer is an electronic device that accepts data, processes it according to instructions, stores results, and produces output. The stored-program idea is what makes a general-purpose machine possible.",
					keyIdeas: [
						"Input–process–output–storage cycle",
						"Hardware vs software",
						"Stored-program concept",
						"Data vs information"
					],
					chunks: [{
						page: 2,
						content: "A computer is an electronic device that automatically accepts data as input, processes that data according to a set of instructions called a program, stores intermediate and final results, and produces output that humans or other machines can use. The classic model is often written as IPO: Input, Process, Output, with storage sitting beside the processor so that both data and programs can be kept for later use. Data are raw, unorganised facts — numbers, characters, sensor readings. Information is data that has been processed into a form that is meaningful for a decision. A student registration number is data; a class list sorted by department is information."
					}, {
						page: 3,
						content: "Two ingredients make a computer useful: hardware and software. Hardware is the physical machinery — the processor, memory, disk, keyboard, screen. Software is the set of instructions that tell the hardware what to do. Without software, hardware is inert. Without hardware, software has nothing to run on. Modern machines follow the stored-program concept introduced by the von Neumann model: both the program and the data it operates on live in the same memory. That is why one physical computer can be a word processor in the morning and a statistical package in the afternoon — you change the program, not the machine."
					}],
					questions: [{
						stem: "In the IPO model of a computer, what is the role of storage?",
						choices: [
							"It replaces the processor when the machine is idle",
							"It holds data and programs so they can be reused later",
							"It is only used to send results to a printer",
							"It converts information back into data"
						],
						correctIndex: 1,
						explanation: "Storage sits beside the processor so both data and programs can be kept. Output devices deliver results; they are not storage.",
						difficulty: "recall"
					}, {
						stem: "Which statement best captures the stored-program concept?",
						choices: [
							"Programs are wired permanently into the processor",
							"Only data, never programs, may be kept in memory",
							"Programs and data both reside in memory, so the same machine can run different tasks",
							"Software can run without any hardware"
						],
						correctIndex: 2,
						explanation: "The von Neumann stored-program idea is that instructions and data share memory, which is why a general-purpose computer can change jobs by loading a different program.",
						difficulty: "application"
					}]
				},
				{
					title: "Generations of Computers",
					summary: "Computer generations are marked by a change in the electronic technology of the processor: vacuum tubes, transistors, integrated circuits, microprocessors, and then pervasive connectivity and AI-era machines.",
					keyIdeas: [
						"Vacuum tubes",
						"Transistors",
						"Integrated circuits",
						"Microprocessors",
						"Size, speed, and reliability trends"
					],
					chunks: [{
						page: 5,
						content: "First-generation computers (roughly 1940s–1950s) used vacuum tubes. They were large, generated a great deal of heat, failed often, and were programmed in machine language. ENIAC is the usual classroom example. Second-generation machines replaced tubes with transistors. Transistors were smaller, cooler, more reliable, and cheaper, and this generation saw the rise of assembly language and early high-level languages such as FORTRAN and COBOL. Magnetic tape and early disks became practical storage."
					}, {
						page: 6,
						content: "Third-generation computers used integrated circuits — many transistors fabricated on a single chip. This cut size and cost again and made operating systems with multiprogramming realistic. Fourth-generation computers are built around the microprocessor, a complete CPU on one chip, which made the personal computer possible. Fifth-generation language in many syllabi points to machines that emphasise networking, very large scale integration, and increasingly, artificial intelligence and natural-language interfaces. Across generations the trend is consistent: smaller, faster, cheaper, more reliable, and easier for non-specialists to use."
					}],
					questions: [{
						stem: "Which technology distinguishes second-generation computers from the first generation?",
						choices: [
							"Vacuum tubes",
							"Microprocessors",
							"Transistors",
							"Quantum circuits"
						],
						correctIndex: 2,
						explanation: "The second generation replaced vacuum tubes with transistors. Microprocessors define the fourth generation.",
						difficulty: "recall"
					}]
				},
				{
					title: "Classification of Computers",
					summary: "Computers are classified by size and power (supercomputer, mainframe, mini, micro) and by purpose (general-purpose vs special-purpose).",
					keyIdeas: [
						"Supercomputer and mainframe",
						"Minicomputer and microcomputer",
						"General-purpose vs special-purpose",
						"Workstations and servers"
					],
					chunks: [{
						page: 8,
						content: "By size and computational power, a common classroom ranking is: supercomputers, mainframes, minicomputers, and microcomputers. Supercomputers are built for enormous numbers of floating-point calculations — weather modelling, nuclear simulation, large-scale research. Mainframes emphasise high-volume transaction processing and many simultaneous users; banks and university registries still rely on them. Minicomputers historically sat between mainframes and desktops for departmental work. Microcomputers are the machines students actually own: desktops, laptops, tablets, and the computers hiding inside phones. A server is a microcomputer (or a rack of them) whose job is to provide services to other computers on a network."
					}, {
						page: 9,
						content: "By purpose, a general-purpose computer can be programmed for many different tasks. A special-purpose (dedicated) computer is built or programmed for one job: the controller in an ATM, the processor in a microwave, an ABS unit in a car. Embedded systems are special-purpose computers placed inside a larger device. Most CIT 102 exam questions that mention 'embedded' expect you to connect that word to special-purpose, hidden computers."
					}],
					questions: [{
						stem: "A bank that processes millions of customer transactions a day is most likely using a",
						choices: [
							"Supercomputer for weather modelling",
							"Mainframe for high-volume transaction processing",
							"Single microcomputer with no network",
							"Special-purpose microwave controller"
						],
						correctIndex: 1,
						explanation: "Mainframes are the classic machines for high-volume, many-user transaction processing. Supercomputers are for heavy scientific calculation.",
						difficulty: "application"
					}]
				},
				{
					title: "Applications of Computers",
					summary: "Computers are used in education, business, science, government, health, and the home. The same stored-program machine is specialised by software and by the data it is given.",
					keyIdeas: [
						"Education and CBT",
						"Business information systems",
						"Scientific and engineering use",
						"Health and government systems"
					],
					chunks: [{
						page: 11,
						content: "In education, computers support computer-based testing (CBT), learning management systems, simulation, and now adaptive study tools. A 100-level student in a Nigerian university typically meets computers both as a subject (CIT 102) and as a medium (CBT exams, course registration portals). In business they run payroll, inventory, accounting, and customer records. Science and engineering use them for modelling, data capture, and control of instruments. Hospitals keep electronic records and imaging. Government uses computers for identity systems, tax, and statistics. None of these applications requires a different kind of CPU — they require different programs, different data, and appropriate security."
					}],
					questions: [{
						stem: "Why can the same personal computer be used for CBT practice and for writing a lab report?",
						choices: [
							"Because hardware is rewritten for each task",
							"Because the stored-program machine changes behaviour when a different program is loaded",
							"Because CBT is a special-purpose embedded system",
							"Because output devices decide the application"
						],
						correctIndex: 1,
						explanation: "A general-purpose stored-program computer changes job by loading different software. The hardware stays the same.",
						difficulty: "analysis"
					}]
				}
			]
		},
		{
			title: "Chapter 2 — Computer Systems",
			topics: [
				{
					title: "Hardware Components",
					summary: "The main hardware subsystems are the CPU, main memory, secondary storage, and input/output devices, joined by buses.",
					keyIdeas: [
						"CPU, memory, storage, I/O",
						"System bus",
						"Peripheral devices",
						"Motherboard"
					],
					chunks: [{
						page: 14,
						content: "A computer system is a collection of hardware components that work together. The central processing unit (CPU) executes instructions. Main memory (RAM) holds the program currently running and the data it needs. Secondary storage (SSD, hard disk, flash) keeps programs and files when the power is off. Input devices (keyboard, mouse, scanner, microphone) bring data in. Output devices (screen, printer, speakers) send results out. Some devices, such as a touch screen or a network interface, are both input and output. These parts are physically mounted on or connected to the motherboard and they communicate over buses — electrical pathways for data, addresses, and control signals."
					}, {
						page: 15,
						content: "It is easy to confuse memory with storage in an exam. Memory (RAM) is fast, volatile, and relatively small; its contents disappear when power is removed. Storage is slower, non-volatile, and large. When a lecturer says 'save your work', they mean copy it from memory onto storage. Cache memory, which sits between the CPU and RAM, is even faster and smaller than RAM and is used to keep recently used instructions and data close to the processor."
					}],
					questions: [{
						stem: "Which statement about RAM is correct?",
						choices: [
							"RAM is non-volatile and keeps files when the computer is off",
							"RAM is volatile main memory that holds the running program",
							"RAM is a type of output device",
							"RAM replaces the system bus"
						],
						correctIndex: 1,
						explanation: "RAM is volatile main memory. Secondary storage is what keeps files after shutdown.",
						difficulty: "recall"
					}]
				},
				{
					title: "The CPU and Memory Hierarchy",
					summary: "The CPU contains a control unit, an ALU, and registers. It runs a fetch–decode–execute cycle. The memory hierarchy trades speed against size and cost.",
					keyIdeas: [
						"Control unit, ALU, registers",
						"Fetch–decode–execute",
						"Cache, RAM, secondary storage",
						"Clock speed and cores"
					],
					chunks: [{
						page: 17,
						content: "The CPU has three essential parts. The control unit (CU) fetches instructions from memory, decodes them, and coordinates the rest of the machine. The arithmetic logic unit (ALU) performs arithmetic (add, subtract, multiply, divide) and logic (AND, OR, NOT, compare). Registers are tiny, extremely fast storage locations inside the CPU used for the instruction currently in flight, the program counter, and intermediate results. The CPU repeats the fetch–decode–execute cycle for as long as it is running. Clock speed (GHz) is how many of these cycles can be started per second; extra cores let more than one sequence of instructions run at once."
					}, {
						page: 18,
						content: "The memory hierarchy is a pyramid. At the top: registers, then cache, then RAM, then SSD/disk, then optical or cloud storage. Each step down is larger, cheaper per bit, and slower. A well-designed system keeps the data the CPU is about to need as high in that pyramid as possible. Virtual memory lets a program pretend it has more RAM than is physically installed by paging blocks out to disk; if the machine pages too much, it thrashes and feels frozen. CIT 102 questions often ask you to order these levels from fastest to slowest: registers → cache → RAM → disk."
					}],
					questions: [{
						stem: "During the fetch–decode–execute cycle, which component decodes the instruction?",
						choices: [
							"The ALU",
							"The control unit",
							"The hard disk",
							"The printer"
						],
						correctIndex: 1,
						explanation: "The control unit fetches and decodes instructions. The ALU executes arithmetic and logic operations.",
						difficulty: "recall"
					}, {
						stem: "From fastest to slowest, which order of the memory hierarchy is correct?",
						choices: [
							"Disk → RAM → cache → registers",
							"RAM → registers → cache → disk",
							"Registers → cache → RAM → disk",
							"Cache → disk → registers → RAM"
						],
						correctIndex: 2,
						explanation: "Registers are fastest, then cache, then RAM, then secondary storage.",
						difficulty: "application"
					}]
				},
				{
					title: "Software: System and Application",
					summary: "Software splits into system software (operating system, utilities, language translators) and application software (the programs users actually open to do work).",
					keyIdeas: [
						"Operating system roles",
						"Utilities and translators",
						"Application software",
						"Firmware"
					],
					chunks: [{
						page: 20,
						content: "System software operates and controls the computer. The operating system (Windows, macOS, Linux, Android) is the most important piece: it manages processes, memory, files, and devices, and it provides the interface the user sees. Utility programs handle housekeeping — backup, antivirus, disk cleanup. Language translators turn human-readable source code into machine instructions: compilers translate a whole program before it runs; interpreters translate line by line; assemblers translate assembly language. Firmware is software stored in a non-volatile chip (BIOS/UEFI) that starts the machine before the operating system loads."
					}, {
						page: 21,
						content: "Application software is written for the end user's task: word processors, spreadsheets, browsers, accounting packages, learning apps. A common exam trap is to call Microsoft Word an operating system. It is not — it is an application that depends on an operating system. Another trap is to treat a programming language as application software; the language is a tool, and the translator is system software. Proprietary software is owned and licensed; open-source software publishes its source and is often free to modify under a licence such as GPL."
					}],
					questions: [{
						stem: "Microsoft Word is best classified as",
						choices: [
							"An operating system",
							"Firmware",
							"Application software",
							"A language translator"
						],
						correctIndex: 2,
						explanation: "Word is an application. Windows or macOS would be the operating system it runs on.",
						difficulty: "recall"
					}]
				},
				{
					title: "Input, Output, and Storage",
					summary: "Input converts the outside world into binary; output converts binary back. Storage keeps bits persistently. Capacity units and device types are standard exam material.",
					keyIdeas: [
						"Input vs output devices",
						"Primary vs secondary storage",
						"Bit, byte, KB, MB, GB, TB",
						"Magnetic, optical, solid-state"
					],
					chunks: [{
						page: 23,
						content: "Input devices digitise human or environmental signals: keyboards encode keystrokes, mice encode movement, scanners encode images, microphones encode sound. Output devices do the reverse: a monitor paints pixels, a printer deposits ink or toner, speakers vibrate air. Secondary storage comes in three physical families. Magnetic (hard disks, tape) stores bits as magnetised regions. Optical (CD, DVD, Blu-ray) stores bits as pits read by a laser. Solid-state (SSD, USB flash, memory cards) stores bits in flash cells with no moving parts, so they are faster and more shock-resistant than spinning disks."
					}, {
						page: 24,
						content: "Capacity units: a bit is 0 or 1. A byte is 8 bits and typically stores one character in ASCII. 1 kilobyte (KB) is 1024 bytes in the binary convention used in most CIT courses (sometimes 1000 in disk marketing). Then 1024 KB = 1 MB, 1024 MB = 1 GB, 1024 GB = 1 TB. A two-hour compressed video might be 1–2 GB; a typical CIT course PDF is a few megabytes; a single ASCII page is a few kilobytes. Exam questions like to ask how many bits are in 2 bytes (16) or which medium is volatile (RAM, not the disk)."
					}],
					questions: [{
						stem: "How many bits are there in 2 bytes?",
						choices: [
							"2",
							"8",
							"16",
							"32"
						],
						correctIndex: 2,
						explanation: "One byte is 8 bits, so two bytes are 16 bits.",
						difficulty: "recall"
					}]
				}
			]
		},
		{
			title: "Chapter 3 — Data Representation",
			topics: [
				{
					title: "Number Systems",
					summary: "Computers represent values in binary. Humans also use decimal, and computing uses octal and hexadecimal as compact views of binary.",
					keyIdeas: [
						"Base / radix",
						"Decimal, binary, octal, hexadecimal",
						"Place value",
						"Why machines use binary"
					],
					chunks: [{
						page: 27,
						content: "A number system is defined by its base (radix) — the number of different digits it uses — and by place value. Decimal (base 10) uses digits 0–9. Binary (base 2) uses 0 and 1. Octal (base 8) uses 0–7. Hexadecimal (base 16) uses 0–9 and A–F, where A=10, B=11, C=12, D=13, E=14, F=15. In any base, the rightmost digit is the units place (base^0), the next is base^1, then base^2, and so on. So the binary number 1011 means 1×8 + 0×4 + 1×2 + 1×1 = 11 in decimal. The hexadecimal number 2F means 2×16 + 15 = 47 in decimal."
					}, {
						page: 28,
						content: "Computers use binary because digital electronics are most reliable when they distinguish two voltages: high and low, on and off. Those two states map cleanly onto 1 and 0. Hexadecimal is not a competing machine code; it is a human shorthand. One hex digit represents exactly four bits (a nibble), so the byte 1111 0000 can be written as F0. Octal digits represent three bits. CIT 102 exam questions almost always include at least one conversion among these four bases. Students who only memorise a conversion trick without understanding place value tend to fail the application items."
					}],
					questions: [{
						stem: "The binary number 1011 is equal to which decimal value?",
						choices: [
							"8",
							"10",
							"11",
							"13"
						],
						correctIndex: 2,
						explanation: "1011₂ = 8 + 0 + 2 + 1 = 11₁₀.",
						difficulty: "application"
					}, {
						stem: "Why is hexadecimal commonly used in computing textbooks?",
						choices: [
							"Processors execute hexadecimal digits directly, never binary",
							"One hex digit represents four bits, so bytes are easier to read",
							"Hexadecimal is the only base that can represent negative numbers",
							"Octal cannot represent even numbers"
						],
						correctIndex: 1,
						explanation: "Hex is a compact notation for binary: one hex digit = four bits. The machine still operates in binary.",
						difficulty: "analysis"
					}]
				},
				{
					title: "Number Conversions",
					summary: "Convert to decimal by expanding place values. Convert from decimal to another base by repeated division and reading remainders upwards. Binary–hex grouping is the fast path.",
					keyIdeas: [
						"Place-value expansion",
						"Repeated division",
						"Binary to hex by nibbles",
						"Binary to octal by groups of three"
					],
					chunks: [
						{
							page: 30,
							content: "To convert any base into decimal, multiply each digit by its place value and add. Example: 345₈ = 3×64 + 4×8 + 5×1 = 192 + 32 + 5 = 229₁₀. To convert decimal into another base, divide repeatedly by that base and collect remainders. The last remainder is the most significant digit. Example: 13 to binary. 13÷2 = 6 remainder 1; 6÷2 = 3 remainder 0; 3÷2 = 1 remainder 1; 1÷2 = 0 remainder 1. Reading remainders from the bottom gives 1101₂. Check: 8+4+0+1 = 13."
						},
						{
							page: 31,
							content: "Binary to hexadecimal: starting from the right, group bits into fours and replace each group with a hex digit. 1101 1110 0101 → D E 5, so DE5₁₆. Pad the leftmost group with zeros if needed. Binary to octal uses groups of three: 1 101 111 001 → 1 5 7 1 octal. Hex to binary is the reverse: replace each hex digit with its four-bit pattern. A common exam trap is grouping from the left instead of the right, which shifts every place and produces a wrong answer. Another trap is treating A as 10 in binary grouping rather than as 1010."
						},
						{
							page: 32,
							content: "Worked conversion set. 2F₁₆ to decimal: 2×16 + 15 = 47. 47 to binary by division: 47÷2=23 r1; 23÷2=11 r1; 11÷2=5 r1; 5÷2=2 r1; 2÷2=1 r0; 1÷2=0 r1 → 101111₂. Check by grouping: 10 1111 = 2F₁₆. 100101₂ to octal: 100 101 = 45₈. Students who can do these three directions — any base to decimal, decimal to any base, and binary grouping — can handle essentially every CIT 102 number-system conversion item."
						}
					],
					questions: [
						{
							stem: "Convert 13₁₀ to binary.",
							choices: [
								"1101",
								"1110",
								"1011",
								"1001"
							],
							correctIndex: 0,
							explanation: "Repeated division by 2 yields remainders 1,0,1,1 reading upwards as 1101. 8+4+1=13.",
							difficulty: "application"
						},
						{
							stem: "Grouped from the right, 11011110₂ in hexadecimal is",
							choices: [
								"DE",
								"D6",
								"EE",
								"1E"
							],
							correctIndex: 0,
							explanation: "1101 1110 = D E, so DE₁₆.",
							difficulty: "application"
						},
						{
							stem: "A student grouped 101101₂ into 10 1101 from the left and wrote 2D₁₆. What went wrong?",
							choices: [
								"Hexadecimal cannot represent this number",
								"Groups of four bits must be formed from the right, padding the left",
								"The binary number is already hexadecimal",
								"They should have used groups of three for hexadecimal"
							],
							correctIndex: 1,
							explanation: "Nibbles are counted from the right. 101101 → 0010 1101 = 2D, which happens to match, but 11011110 grouped from the left would fail. The rule is: pad on the left, group from the right. For 101101₂: 10 1101 is incorrect grouping; 0010 1101 is correct (=2D₁₆).",
							difficulty: "analysis"
						}
					]
				},
				{
					title: "Binary Arithmetic",
					summary: "Binary addition uses 0+0=0, 0+1=1, 1+1=10. Overflow happens when the result does not fit the bit width. Complements are used for subtraction and signed numbers.",
					keyIdeas: [
						"Binary addition table",
						"Carry",
						"Overflow",
						"One's and two's complement"
					],
					chunks: [{
						page: 34,
						content: "Binary addition is the same algorithm as decimal addition with a smaller table: 0+0=0, 0+1=1, 1+0=1, 1+1=10 (write 0, carry 1), 1+1+1=11 (write 1, carry 1). Example: 1011 + 0110. Units: 1+0=1. Twos: 1+1=0 carry 1. Fours: 0+1+carry1=0 carry 1. Eights: 1+0+carry1=0 carry 1. So the five-bit sum is 10001, which is 17, and 11+6=17. If the machine only has four bits of storage for the result, that leading 1 is lost — that is overflow. Overflow is not a mysterious error; it is a result that does not fit the allocated width."
					}, {
						page: 35,
						content: "Subtraction can be done by borrowing, or by adding a complement. One's complement of a binary number flips every bit. Two's complement is one's complement plus one. Two's complement is the dominant representation for signed integers: the high bit is the sign (0 positive, 1 negative), and subtraction becomes addition of the two's complement. Example: 5 is 0101 in four bits. −5 is the two's complement: flip 1010, add 1 → 1011. 0101 + 1011 = 1 0000, and the carried-out 1 leaves 0000, so 5+(−5)=0 as required. CIT 102 typically asks you to form a two's complement and to add two short binary numbers."
					}],
					questions: [{
						stem: "What is 1011₂ + 0110₂?",
						choices: [
							"10001₂",
							"1111₂",
							"1000₂",
							"11001₂"
						],
						correctIndex: 0,
						explanation: "11 + 6 = 17 = 10001₂. A 4-bit register would overflow.",
						difficulty: "application"
					}, {
						stem: "The two's complement of 0101₂ (four bits) is",
						choices: [
							"1010",
							"1011",
							"1101",
							"0101"
						],
						correctIndex: 1,
						explanation: "Flip bits to 1010, add 1 → 1011, which represents −5.",
						difficulty: "application"
					}]
				},
				{
					title: "Character Encoding and Data Types",
					summary: "Text is stored as numbers via encodings such as ASCII and Unicode. Other data types — integers, reals, booleans, images — are also bit patterns with an agreed interpretation.",
					keyIdeas: [
						"ASCII",
						"Unicode / UTF-8",
						"Integers vs floating point",
						"Bits have meaning only with a type"
					],
					chunks: [{
						page: 37,
						content: "A computer does not store the letter A. It stores a bit pattern that we agree means A. ASCII assigns 65 (binary 1000001) to uppercase A, 66 to B, 97 to lowercase a. ASCII is a 7-bit code (often stored in 8 bits) and covers English letters, digits, and punctuation — 128 symbols. It cannot represent Ọ, é, or Chinese characters. Unicode is the larger mapping; UTF-8 is the common encoding that represents ASCII bytes unchanged and uses extra bytes for other characters. That is why a file written as 'plain ASCII' is also valid UTF-8."
					}, {
						page: 38,
						content: "The same bit pattern can mean different things depending on type. 01000001 is ASCII 'A', the integer 65, or a tiny piece of an image or a sound sample. Types we care about in CIT 102: integers (whole numbers, often two's complement), floating-point (scientific notation for reals), characters, strings (sequences of characters), booleans (true/false, often 1 and 0), and collections of bits for graphics (pixels) and audio (samples). The important sentence to remember: bits are meaningless until the program decides how to interpret them."
					}],
					questions: [{
						stem: "ASCII 'A' is stored as decimal 65. What is a correct implication?",
						choices: [
							"The computer stores the glyph shape of A in RAM as a picture",
							"The integer 65 and the character A can share the same bit pattern",
							"Unicode cannot represent A",
							"65 in binary cannot fit in one byte"
						],
						correctIndex: 1,
						explanation: "Encodings map characters to numbers. 65 is both the integer sixty-five and the ASCII code for A; meaning depends on type.",
						difficulty: "analysis"
					}]
				}
			]
		},
		{
			title: "Chapter 4 — Problem Solving",
			topics: [{
				title: "Algorithms and Flowcharts",
				summary: "An algorithm is a finite, unambiguous sequence of steps that solves a problem. Flowcharts and pseudocode are the usual ways to express algorithms before coding.",
				keyIdeas: [
					"Properties of algorithms",
					"Pseudocode",
					"Flowchart symbols",
					"Sequence, selection, iteration"
				],
				chunks: [{
					page: 41,
					content: "An algorithm must be finite (it stops), definite (each step is unambiguous), effective (each step is doable), and it must have inputs and at least one output. 'Cook a tasty soup' is not an algorithm; 'add 4 grams of salt, simmer 12 minutes' is closer. Pseudocode writes those steps in structured English: INPUT, IF…THEN…ELSE, WHILE, FOR, OUTPUT. A flowchart draws them: oval for start/end, parallelogram for input/output, rectangle for a process, diamond for a decision, arrows for flow. Every useful algorithm is assembled from three control structures: sequence (do this, then that), selection (choose a path), and iteration (repeat until a condition fails)."
				}, {
					page: 42,
					content: "Example: convert a decimal integer n to binary. Algorithm: if n is 0, output 0 and stop. Otherwise, while n > 0, divide n by 2, record the remainder, replace n with the quotient. When n becomes 0, write the remainders in reverse order. That is exactly the conversion method in Chapter 3, stated as an algorithm. Drawing it as a flowchart would put a diamond on 'n > 0?' and a loop arrow back from 'record remainder'. CIT 102 often asks you to pick the correct flowchart symbol or to identify which control structure a fragment uses."
				}],
				questions: [{
					stem: "Which flowchart symbol is used for a decision?",
					choices: [
						"Oval",
						"Rectangle",
						"Diamond",
						"Parallelogram"
					],
					correctIndex: 2,
					explanation: "Diamonds are decisions. Ovals start/stop, rectangles process, parallelograms input/output.",
					difficulty: "recall"
				}]
			}, {
				title: "Programming Fundamentals",
				summary: "A program is an algorithm written in a programming language. Variables, data types, control structures, and debugging are the first practical skills.",
				keyIdeas: [
					"Variable and assignment",
					"Syntax vs semantics",
					"Compilation vs interpretation",
					"Debugging"
				],
				chunks: [{
					page: 44,
					content: "A program implements an algorithm in a language the translator can accept. A variable is a named location in memory whose value can change. Assignment copies a value into that location. Languages have rules of form (syntax) and meaning (semantics). 'x = = 3' may be a syntax error; 'divide total by count' when count is 0 is a semantic/runtime error. Compilers translate the whole source into machine code before execution. Interpreters execute source more directly, line by line. Many modern languages mix the two. Debugging is the systematic search for the difference between what you meant and what the machine did, using the error message, the current values of variables, and tests on small inputs."
				}, {
					page: 45,
					content: "Good 100-level practice: write the algorithm first, then the code. Trace a small example by hand (for number conversion, trace n=13). Keep variable names meaningful. Do not confuse the language's operator for equality with assignment. When an exam asks for the output of a short fragment, execute it on paper exactly as the machine would, not as you wish it would. These habits transfer to every later programming course."
				}],
				questions: [{
					stem: "The difference between syntax and semantics is that",
					choices: [
						"Syntax is meaning; semantics is spelling",
						"Syntax is the form of the language; semantics is what a construct means",
						"They are two names for compilation",
						"Semantics only applies to flowcharts"
					],
					correctIndex: 1,
					explanation: "Syntax = form. Semantics = meaning. A program can be syntactically valid and still do the wrong thing.",
					difficulty: "recall"
				}]
			}]
		}
	]
};
/** Chunk packing targets. Semantic boundaries take priority over these. */
var CHUNKING = {
	targetChars: 850,
	minChars: 240,
	maxChars: 1400,
	overlapSentences: 1,
	maxChunksPerDocument: 280
};
/** Default hybrid weights. Semantic similarity is the primary signal. */
var DEFAULT_SCORE_WEIGHTS = {
	semantic: .62,
	lexical: .18,
	hierarchy: .14,
	citation: .06
};
/** When the embedding provider is down we drop semantic to 0 and renormalize. */
var LEXICAL_FALLBACK_WEIGHTS = {
	semantic: 0,
	lexical: .72,
	hierarchy: .22,
	citation: .06
};
var RETRIEVAL_DEFAULTS = {
	limit: 6,
	candidateLimit: 24,
	tokenBudget: 1800
};
var EMBEDDING_CONFIG = {
	/** Real xAI embedding model. Swap via XAI_EMBEDDING_MODEL without code changes. */
	defaultProvider: "xai",
	defaultModel: "grok-embedding-small",
	endpoint: "https://api.x.ai/v1/embeddings",
	batchSize: 64,
	timeoutMs: 2e4,
	/** After a billing/quota failure, skip embedding calls for this long. */
	cooldownMs: 6e4
};
var HIERARCHY = {
	currentTopicBoost: .85,
	sameChapterBoost: .4,
	relatedTopicBoost: .12,
	otherCoursePenalty: 1
};
var STOP = /* @__PURE__ */ new Set([
	"the",
	"and",
	"for",
	"that",
	"with",
	"this",
	"from",
	"are",
	"was",
	"were",
	"have",
	"has",
	"had",
	"not",
	"but",
	"you",
	"your",
	"our",
	"its",
	"into",
	"about",
	"what",
	"when",
	"which",
	"their",
	"them",
	"then",
	"than",
	"also",
	"can",
	"how",
	"why",
	"does",
	"did",
	"will",
	"would",
	"could",
	"should",
	"a",
	"an",
	"of",
	"to",
	"in",
	"on",
	"or",
	"is",
	"be",
	"as",
	"at",
	"by",
	"it",
	"we",
	"if",
	"so",
	"do"
]);
function tokenize(text) {
	return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));
}
function estimateTokens(text) {
	return Math.max(1, Math.round(text.trim().length / 4));
}
function cosineSimilarity(a, b) {
	if (!a.length || a.length !== b.length) return 0;
	let dot = 0;
	let na = 0;
	let nb = 0;
	for (let i = 0; i < a.length; i += 1) {
		const x = a[i];
		const y = b[i];
		dot += x * y;
		na += x * x;
		nb += y * y;
	}
	if (na === 0 || nb === 0) return 0;
	return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
function clamp01(n) {
	if (n < 0) return 0;
	if (n > 1) return 1;
	return n;
}
function normalizeWeights(weights) {
	const sum = Object.values(weights).reduce((a, b) => a + b, 0);
	if (sum <= 0) return weights;
	const out = { ...weights };
	Object.keys(out).forEach((k) => {
		out[k] = out[k] / sum;
	});
	return out;
}
var PAGE_RE = /\[\[page\s+(\d+)\]\]/i;
var HEADING_LINE = /^(?:#{1,6}\s+\S.{1,80}|chapter\s+\d+\b.{0,80}|[0-9]{1,2}(?:\.[0-9]{1,2}){0,3}\s+\S.{2,80}|[A-Z][A-Z0-9 ,/()\-]{8,72})$/;
function splitPages(raw) {
	if (!PAGE_RE.test(raw)) return [{
		page: null,
		text: raw
	}];
	const parts = raw.split(/\[\[page\s+(\d+)\]\]/i);
	const out = [];
	if (parts[0]?.trim()) out.push({
		page: null,
		text: parts[0]
	});
	for (let i = 1; i < parts.length; i += 2) {
		const page = Number(parts[i]);
		const text = parts[i + 1] ?? "";
		if (text.trim()) out.push({
			page: Number.isFinite(page) ? page : null,
			text
		});
	}
	return out;
}
function isHeading(line) {
	const t = line.trim();
	if (t.length < 4 || t.length > 90) return false;
	if (/[.?!]$/.test(t) && t.length > 40) return false;
	return HEADING_LINE.test(t);
}
function stripHeadingMarks(line) {
	return line.replace(/^#{1,6}\s+/, "").trim();
}
function splitSentences(text) {
	const clean = text.replace(/\s+/g, " ").trim();
	if (!clean) return [];
	return clean.split(/(?<=[.!?])\s+(?=[A-Z("])|\n+/).map((s) => s.trim()).filter(Boolean);
}
function splitParagraphs(text) {
	return text.split(/\n{2,}/).map((p) => p.replace(/[ \t]+\n/g, "\n").trim()).filter(Boolean);
}
function sectionsFromPage(text) {
	const lines = text.split(/\n/);
	const sections = [];
	let heading = null;
	let buf = [];
	function flush() {
		const body = buf.join("\n").trim();
		if (!body && !heading) return;
		sections.push({
			heading,
			paragraphs: body ? splitParagraphs(body) : []
		});
		buf = [];
	}
	for (const line of lines) {
		if (isHeading(line)) {
			flush();
			heading = stripHeadingMarks(line);
			continue;
		}
		buf.push(line);
	}
	flush();
	return sections.length ? sections : [{
		heading: null,
		paragraphs: splitParagraphs(text)
	}];
}
function packSentences(sentences, heading, page, startIndex) {
	const { targetChars, minChars, maxChars, overlapSentences } = CHUNKING;
	const chunks = [];
	let current = [];
	let index = startIndex;
	const flush = (force = false) => {
		const content = current.join(" ").replace(/\s+/g, " ").trim();
		if (!content) {
			current = [];
			return;
		}
		if (!force && content.length < minChars && chunks.length === 0) return;
		chunks.push({
			content,
			page,
			heading,
			chunkIndex: index,
			tokenEstimate: estimateTokens(content)
		});
		index += 1;
		if (overlapSentences > 0 && current.length > overlapSentences) current = current.slice(-overlapSentences);
		else current = [];
	};
	for (const sentence of sentences) {
		const next = [...current, sentence].join(" ");
		if (next.length > maxChars && current.length) {
			flush(true);
			current = [sentence];
			if (sentence.length > maxChars) {
				for (let i = 0; i < sentence.length; i += targetChars) {
					current = [sentence.slice(i, i + targetChars)];
					flush(true);
				}
				current = [];
			}
			continue;
		}
		current.push(sentence);
		if (next.length >= targetChars) flush(true);
	}
	if (current.length) flush(true);
	return chunks;
}
/**
* Chunk source text along semantic boundaries: pages → headings/sections →
* paragraphs → sentences. Character windows are a last resort for oversized
* sentences, not the primary strategy.
*/
function chunkSourceText(raw) {
	const pages = splitPages(raw);
	const out = [];
	for (const page of pages) for (const section of sectionsFromPage(page.text)) {
		const sentences = [];
		if (section.heading) {}
		for (const para of section.paragraphs) {
			const bits = splitSentences(para);
			if (bits.length) sentences.push(...bits);
			else if (para.trim()) sentences.push(para.trim());
		}
		if (!sentences.length && section.heading) sentences.push(section.heading);
		const packed = packSentences(sentences, section.heading, page.page, out.length);
		for (const chunk of packed) {
			const headed = chunk.heading && !chunk.content.toLowerCase().startsWith(chunk.heading.toLowerCase()) ? `${chunk.heading}. ${chunk.content}` : chunk.content;
			out.push({
				...chunk,
				content: headed,
				chunkIndex: out.length,
				tokenEstimate: estimateTokens(headed)
			});
			if (out.length >= CHUNKING.maxChunksPerDocument) return out;
		}
	}
	return out;
}
function scoreAgainst(topic, text, heading) {
	const hay = `${heading ?? ""} ${text}`.toLowerCase();
	let score = 0;
	const title = topic.title.toLowerCase();
	if (title && hay.includes(title)) score += 14;
	if (heading && heading.toLowerCase().includes(title)) score += 10;
	for (const word of title.split(/\s+/).filter((w) => w.length > 3)) if (hay.includes(word)) score += 2;
	for (const idea of topic.keyIdeas) {
		const bit = idea.toLowerCase().slice(0, 48);
		if (bit.length > 5 && hay.includes(bit)) score += 5;
	}
	return score;
}
function assignChunksToTopics(course, raw) {
	const topics = course.chapters.flatMap((ch) => ch.topics);
	return chunkSourceText(raw).map((draft, i) => {
		let best = 0;
		let bestScore = -1;
		topics.forEach((topic, idx) => {
			const s = scoreAgainst(topic, draft.content, draft.heading);
			if (s > bestScore) {
				bestScore = s;
				best = idx;
			}
		});
		return {
			topicIndex: topics.length ? best : 0,
			page: draft.page,
			heading: draft.heading,
			content: draft.content,
			chunkIndex: i,
			tokenEstimate: draft.tokenEstimate
		};
	});
}
var REGISTERED_PROVIDERS = ["groq"];
function read(key) {
	return process.env[key]?.trim() || void 0;
}
function intEnv(key, fallback, min, max) {
	const raw = read(key);
	if (!raw) return fallback;
	const n = Number(raw);
	if (!Number.isFinite(n)) return fallback;
	return Math.min(max, Math.max(min, Math.round(n)));
}
/**
* Central LLM configuration. Model IDs live here (and env), not in feature code.
* Client requests must never supply these values.
*/
function loadAiConfig() {
	return {
		provider: (read("AI_PROVIDER") ?? "groq").toLowerCase(),
		fallbackProvider: read("AI_FALLBACK_PROVIDER")?.toLowerCase() ?? null,
		freeModel: read("AI_FREE_MODEL") ?? "openai/gpt-oss-20b",
		paidModel: read("AI_PAID_MODEL") ?? read("AI_FREE_MODEL") ?? "openai/gpt-oss-120b",
		timeoutMs: intEnv("AI_TIMEOUT_MS", 25e3, 3e3, 12e4),
		retryBaseMs: intEnv("AI_RETRY_BASE_MS", 400, 0, 1e4),
		maxRetries: intEnv("AI_MAX_RETRIES", 2, 0, 4)
	};
}
function isRegisteredProvider(id) {
	return REGISTERED_PROVIDERS.includes(id);
}
function modelForPlan(plan = "free") {
	const cfg = loadAiConfig();
	return plan === "paid" ? cfg.paidModel : cfg.freeModel;
}
function groqApiKey() {
	return read("GROQ_API_KEY");
}
var PUBLIC_MESSAGE = {
	missing_key: "AI is not available in this environment",
	auth: "AI is temporarily unavailable",
	rate_limited: "The tutor is busy right now. Please try again in a moment.",
	rate_limited_local: "Too many study requests. Please wait a moment and try again.",
	timeout: "The tutor took too long to respond. Please try again.",
	provider_error: "The tutor is temporarily unavailable. Please try again.",
	malformed: "The tutor returned an unreadable response. Please try again.",
	model_error: "The tutor could not complete that request. Please try again.",
	unsupported_provider: "AI is not available in this environment"
};
var LlmError = class extends Error {
	category;
	retryable;
	retryAfterMs;
	status;
	constructor(category, message, opts) {
		super(message);
		this.name = "LlmError";
		this.category = category;
		this.retryable = opts?.retryable ?? retryableDefault(category);
		this.retryAfterMs = opts?.retryAfterMs;
		this.status = opts?.status;
	}
};
function retryableDefault(category) {
	return category === "rate_limited" || category === "timeout" || category === "provider_error";
}
function publicLlmMessage(err) {
	if (err instanceof LlmError) return PUBLIC_MESSAGE[err.category];
	return PUBLIC_MESSAGE.provider_error;
}
function errorCategory(err) {
	if (err instanceof LlmError) return err.category;
	return "provider_error";
}
/**
* Models do not always return valid JSON. Callers must treat output as untrusted.
* This helper never throws an uncaught parse at the application boundary —
* `extractJsonObject` throws; `tryExtractJsonObject` returns null.
*/
function tryExtractJsonObject(text) {
	if (!text || typeof text !== "string") return null;
	const raw = text.match(/```json\s*([\s\S]*?)```/i)?.[1] ?? text;
	const start = raw.indexOf("{");
	const end = raw.lastIndexOf("}");
	if (start < 0 || end < start) return null;
	try {
		return JSON.parse(raw.slice(start, end + 1));
	} catch {
		return null;
	}
}
function extractJsonObject(text) {
	const parsed = tryExtractJsonObject(text);
	if (parsed == null || typeof parsed !== "object") throw new Error("No JSON object in model output");
	return parsed;
}
var GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";
/**
* Official Groq Chat Completions API (OpenAI-compatible).
* The rest of ApexStudy must not import this module — only the AI factory.
*/
var GroqProvider = class {
	id = "groq";
	apiKey;
	defaultModel;
	fetchImpl;
	timeoutMs;
	maxRetries;
	retryBaseMs;
	constructor(options) {
		this.apiKey = options.apiKey;
		this.defaultModel = options.defaultModel;
		this.fetchImpl = options.fetchImpl ?? fetch;
		this.timeoutMs = options.timeoutMs ?? 25e3;
		this.maxRetries = options.maxRetries ?? 2;
		this.retryBaseMs = options.retryBaseMs ?? 400;
	}
	async generateText(request) {
		if (!this.apiKey) throw new LlmError("missing_key", "missing Groq API key");
		const model = request.model ?? this.defaultModel;
		const requestId = request.requestId ?? newRequestId();
		const started = Date.now();
		const attempts = this.maxRetries + 1;
		let lastError;
		for (let attempt = 1; attempt <= attempts; attempt++) try {
			return {
				...await this.once(request, model, requestId),
				latencyMs: Date.now() - started,
				requestId
			};
		} catch (err) {
			lastError = err;
			if (!(err instanceof LlmError && err.retryable && attempt < attempts)) break;
			await sleep(backoffMs(this.retryBaseMs, attempt, err.retryAfterMs));
		}
		throw lastError instanceof LlmError ? lastError : new LlmError("provider_error", "Groq request failed");
	}
	async once(request, model, requestId) {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), this.timeoutMs);
		let res;
		try {
			res = await this.fetchImpl(GROQ_CHAT_URL, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${this.apiKey}`,
					"X-Request-Id": requestId
				},
				body: JSON.stringify(groqBody(request, model)),
				signal: controller.signal
			});
		} catch (err) {
			const aborted = err instanceof Error && err.name === "AbortError";
			throw new LlmError(aborted ? "timeout" : "provider_error", aborted ? "Groq timeout" : "Groq network error", { retryable: true });
		} finally {
			clearTimeout(timer);
		}
		if (!res.ok) throw await groqHttpError(res);
		let body;
		try {
			body = await res.json();
		} catch {
			throw new LlmError("malformed", "Groq returned a non-JSON body");
		}
		const text = messageText(body.choices?.[0]?.message?.content);
		if (!text) throw new LlmError("malformed", "Groq returned an empty completion");
		return {
			text,
			model: body.model ?? model,
			provider: this.id,
			usage: usageFrom(body.usage),
			requestId
		};
	}
};
function groqBody(request, model) {
	const messages = request.messages.map((m) => ({
		role: m.role,
		content: m.content
	}));
	const body = {
		model,
		temperature: request.temperature ?? (request.json ? .2 : .4),
		max_completion_tokens: request.maxTokens ?? (request.json ? 1800 : 900),
		messages
	};
	if (request.json) body.response_format = { type: "json_object" };
	return body;
}
function messageText(content) {
	if (typeof content === "string") return content;
	if (Array.isArray(content)) return content.map((part) => {
		if (typeof part === "string") return part;
		if (part && typeof part === "object" && "text" in part) return String(part.text ?? "");
		return "";
	}).join("");
	return "";
}
function usageFrom(usage) {
	if (!usage) return void 0;
	return {
		promptTokens: usage.prompt_tokens,
		completionTokens: usage.completion_tokens,
		totalTokens: usage.total_tokens
	};
}
async function groqHttpError(res) {
	const retryAfterMs = parseRetryAfter(res.headers.get("retry-after"));
	if (res.status === 401 || res.status === 403) return new LlmError("auth", `Groq auth ${res.status}`, { status: res.status });
	if (res.status === 429) return new LlmError("rate_limited", "Groq rate limited", {
		status: 429,
		retryable: true,
		retryAfterMs
	});
	if (res.status === 408) return new LlmError("timeout", "Groq request timed out", {
		status: 408,
		retryable: true
	});
	if (res.status >= 500) return new LlmError("provider_error", `Groq HTTP ${res.status}`, {
		status: res.status,
		retryable: true
	});
	if (res.status === 400) return new LlmError("model_error", "Groq rejected the request", { status: 400 });
	return new LlmError("provider_error", `Groq HTTP ${res.status}`, { status: res.status });
}
function parseRetryAfter(header) {
	if (!header) return void 0;
	const seconds = Number(header);
	if (Number.isFinite(seconds) && seconds >= 0) return Math.min(3e4, seconds * 1e3);
}
function backoffMs(base, attempt, retryAfterMs) {
	if (retryAfterMs && retryAfterMs > 0) return Math.min(retryAfterMs, 3e4);
	if (base <= 0) return 0;
	return Math.min(8e3, base * 2 ** (attempt - 1)) + Math.floor(Math.random() * Math.max(1, base));
}
function sleep(ms) {
	if (ms <= 0) return Promise.resolve();
	return new Promise((resolve) => setTimeout(resolve, ms));
}
function newRequestId() {
	return crypto.randomUUID();
}
/**
* Provider registry. Add Gemini/OpenAI here later — feature code stays unchanged.
*
*   groq: implemented
*   gemini: not registered
*   openai: not registered
*/
function createProvider(id, model) {
	if (id === "groq") {
		const apiKey = groqApiKey();
		if (!apiKey) throw new LlmError("missing_key", "GROQ_API_KEY is not set");
		const cfg = loadAiConfig();
		return new GroqProvider({
			apiKey,
			defaultModel: model,
			timeoutMs: cfg.timeoutMs,
			maxRetries: cfg.maxRetries,
			retryBaseMs: cfg.retryBaseMs
		});
	}
	throw new LlmError("unsupported_provider", `No implementation for provider '${id}'`);
}
/**
* Resolve the generation provider for a plan/tier.
* `plan` is a server-side value (future: user.plan). It is never read from the client.
*/
function getLlmProvider(opts) {
	const id = loadAiConfig().provider;
	if (!isRegisteredProvider(id)) throw new LlmError("unsupported_provider", `Unknown AI_PROVIDER '${id}'`);
	return createProvider(id, modelForPlan(opts?.plan ?? "free"));
}
/** Only used when AI_FALLBACK_PROVIDER names a *registered* second provider. */
function getFallbackLlmProvider(opts) {
	const cfg = loadAiConfig();
	const id = cfg.fallbackProvider;
	if (!id || id === cfg.provider) return null;
	if (!isRegisteredProvider(id)) return null;
	try {
		return createProvider(id, modelForPlan(opts?.plan ?? "free"));
	} catch {
		return null;
	}
}
var MAX_CONTENT_CHARS = 24e3;
var MAX_TOKENS = 4096;
var MIN_TOKENS = 16;
/**
* App-facing generation API. Tutor / quiz / course-map call this — never Groq.
* `plan` is reserved for a future server-side subscription check; do not take it from the client.
*/
async function chatText(opts) {
	return generate({
		messages: [{
			role: "system",
			content: clip(opts.system, MAX_CONTENT_CHARS)
		}, ...sanitizeHistory(opts.messages)],
		maxTokens: opts.maxTokens ?? 900,
		json: false,
		temperature: .4,
		feature: opts.feature ?? "tutor",
		plan: opts.plan,
		userId: opts.userId
	});
}
async function chatJson(opts) {
	const system = clip(opts.system, MAX_CONTENT_CHARS);
	const user = clip(opts.user, MAX_CONTENT_CHARS);
	const result = await generate({
		messages: [{
			role: "system",
			content: system
		}, {
			role: "user",
			content: user
		}],
		maxTokens: opts.maxTokens ?? 1800,
		json: true,
		temperature: .2,
		feature: opts.feature ?? "json",
		plan: opts.plan,
		userId: opts.userId
	});
	if (!result.ok) return result;
	if (tryExtractJsonObject(result.text) == null) {
		logAi({
			feature: opts.feature ?? "json",
			ok: false,
			errorCategory: "malformed",
			latencyMs: 0
		});
		return {
			ok: false,
			error: publicLlmMessage(new LlmError("malformed", "invalid json"))
		};
	}
	return result;
}
async function generate(opts) {
	const requestId = crypto.randomUUID();
	const started = Date.now();
	try {
		assertRateLimit(opts.userId);
		const request = {
			messages: opts.messages,
			maxTokens: clampTokens(opts.maxTokens),
			json: opts.json,
			temperature: opts.temperature,
			feature: opts.feature,
			requestId
		};
		const provider = getLlmProvider({ plan: opts.plan });
		let response;
		try {
			response = await provider.generateText(request);
		} catch (err) {
			const fallback = shouldFallback(err) ? getFallbackLlmProvider({ plan: opts.plan }) : null;
			if (!fallback) throw err;
			logAi({
				provider: provider.id,
				feature: opts.feature,
				requestId,
				ok: false,
				errorCategory: errorCategory(err),
				latencyMs: Date.now() - started,
				fallback: true
			});
			response = await fallback.generateText(request);
		}
		logAi({
			provider: response.provider,
			model: response.model,
			feature: opts.feature,
			requestId: response.requestId,
			ok: true,
			latencyMs: response.latencyMs,
			promptTokens: response.usage?.promptTokens,
			completionTokens: response.usage?.completionTokens
		});
		return {
			ok: true,
			text: response.text
		};
	} catch (err) {
		logAi({
			provider: loadAiConfig().provider,
			feature: opts.feature,
			requestId,
			ok: false,
			errorCategory: errorCategory(err),
			latencyMs: Date.now() - started
		});
		return {
			ok: false,
			error: publicLlmMessage(err)
		};
	}
}
function shouldFallback(err) {
	if (!(err instanceof LlmError)) return false;
	return err.retryable || err.category === "missing_key" || err.category === "auth";
}
function sanitizeHistory(messages) {
	const allowed = [
		"user",
		"assistant",
		"system"
	];
	return messages.filter((m) => allowed.includes(m.role) && typeof m.content === "string").slice(-16).map((m) => ({
		role: m.role,
		content: clip(m.content, MAX_CONTENT_CHARS)
	}));
}
function clip(value, max) {
	return (value ?? "").slice(0, max);
}
function clampTokens(n) {
	if (n == null || !Number.isFinite(n)) return 900;
	return Math.min(MAX_TOKENS, Math.max(MIN_TOKENS, Math.round(n)));
}
var RATE_WINDOW_MS = 3e5;
var RATE_MAX = 40;
var hits = /* @__PURE__ */ new Map();
function assertRateLimit(userId) {
	if (!userId) return;
	const now = Date.now();
	const recent = (hits.get(userId) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
	if (recent.length >= RATE_MAX) throw new LlmError("rate_limited_local", "local rate limit");
	recent.push(now);
	hits.set(userId, recent);
}
function logAi(fields) {
	console.info("[apex-ai]", JSON.stringify({
		provider: fields.provider,
		model: fields.model,
		feature: fields.feature,
		requestId: fields.requestId,
		ok: fields.ok,
		latencyMs: fields.latencyMs,
		errorCategory: fields.errorCategory,
		promptTokens: fields.promptTokens,
		completionTokens: fields.completionTokens,
		fallback: fields.fallback
	}));
}
function asString(v, fallback = "") {
	return typeof v === "string" && v.trim() ? v.trim() : fallback;
}
function sampleAsDraft() {
	return {
		code: SAMPLE_CIT102.code,
		title: SAMPLE_CIT102.title,
		chapters: SAMPLE_CIT102.chapters.map((ch) => ({
			title: ch.title,
			topics: ch.topics.map((t) => ({
				title: t.title,
				summary: t.summary,
				keyIdeas: t.keyIdeas
			}))
		}))
	};
}
async function structureFromText(input) {
	const clipped = input.text.slice(0, 24e3);
	const ai = await chatJson({
		maxTokens: 2200,
		feature: "course-map",
		system: `You extract a course map from a student's uploaded material.
Do not invent chapters or topics that are not evidenced in the text.
Prefer the document's own headings. If headings are weak, group by coherent subjects that actually appear.
Return JSON only with shape:
{"code":"string","title":"string","chapters":[{"title":"string","topics":[{"title":"string","summary":"string","keyIdeas":["string"]}]}]}
Rules: at most 10 chapters, at most 6 topics each. Summaries are 2-3 grounded sentences. keyIdeas are short.`,
		user: `Hint code: ${input.hintCode || "(none)"}
Hint title: ${input.hintTitle || "(none)"}

SOURCE:
${clipped}`
	});
	if (ai.ok) try {
		const parsed = extractJsonObject(ai.text);
		const chapters = (parsed.chapters ?? []).map((ch) => ({
			title: asString(ch.title, "Chapter"),
			topics: (ch.topics ?? []).map((t) => ({
				title: asString(t.title),
				summary: asString(t.summary),
				keyIdeas: Array.isArray(t.keyIdeas) ? t.keyIdeas.filter((x) => typeof x === "string").slice(0, 8) : []
			})).filter((t) => t.title).slice(0, 6)
		})).filter((ch) => ch.topics.length).slice(0, 10);
		if (chapters.length) return {
			code: asString(parsed.code, input.hintCode || "COURSE"),
			title: asString(parsed.title, input.hintTitle || "Untitled course"),
			chapters
		};
	} catch {}
	return fallbackStructure(input.text, {
		code: input.hintCode,
		title: input.hintTitle
	});
}
function citationLabel(chunk) {
	const source = chunk.sourceName?.replace(/\.[a-z0-9]+$/i, "") || "Source";
	if (chunk.page != null) return `[${source} — p. ${chunk.page}]`;
	if (chunk.heading) return `[${source} — ${chunk.heading}]`;
	return `[${source}]`;
}
function toCitation(chunk) {
	const locator = chunk.page != null ? `p. ${chunk.page}` : chunk.heading || "source";
	return {
		chunkId: chunk.id,
		documentId: chunk.documentId,
		sourceName: chunk.sourceName || "Source",
		page: chunk.page,
		heading: chunk.heading,
		topicTitle: chunk.topicTitle,
		chapterTitle: chunk.chapterTitle,
		locator,
		label: citationLabel(chunk),
		excerpt: chunk.content.trim().slice(0, 420)
	};
}
function formatContext(selected) {
	if (!selected.length) return "(No source excerpts retrieved.)";
	return selected.map((c, i) => {
		const loc = c.chunk.page != null ? `p. ${c.chunk.page}` : c.chunk.heading || "source";
		const topic = c.chunk.topicTitle ? ` · ${c.chunk.topicTitle}` : "";
		return `[${i + 1} ${c.chunk.sourceName || "Source"} — ${loc}${topic}]\n${c.chunk.content.trim()}`;
	}).join("\n\n");
}
function formatCitationLine(citations) {
	if (!citations.length) return "";
	const seen = /* @__PURE__ */ new Set();
	const labels = [];
	for (const c of citations) {
		if (seen.has(c.label)) continue;
		seen.add(c.label);
		labels.push(c.label);
	}
	return labels.join(" ");
}
/**
* Context selection: take reranked candidates until the token budget fills,
* keeping at least one current-topic chunk when present.
*/
function selectContext(ranked, opts) {
	const limit = opts?.limit ?? RETRIEVAL_DEFAULTS.limit;
	const budget = opts?.tokenBudget ?? RETRIEVAL_DEFAULTS.tokenBudget;
	const selected = [];
	let tokens = 0;
	for (const cand of ranked) {
		if (selected.length >= limit) break;
		const cost = cand.chunk.tokenEstimate;
		if (selected.length > 0 && tokens + cost > budget) continue;
		selected.push(cand);
		tokens += cost;
	}
	if (!selected.length && ranked[0]) selected.push(ranked[0]);
	return selected;
}
var EmbeddingProviderError = class extends Error {
	code;
	retryable;
	constructor(message, code = "provider_error", retryable = false) {
		super(message);
		this.name = "EmbeddingProviderError";
		this.code = code;
		this.retryable = retryable;
	}
};
/**
* Explicit stand-in used when no embedding credentials exist.
* It never returns vectors. The pipeline must take the lexical fallback path.
*/
var UnavailableEmbeddingProvider = class {
	id = "unavailable";
	model = "none";
	async available() {
		return false;
	}
	async embed(_request) {
		throw new EmbeddingProviderError("No embedding provider is configured", "unavailable", false);
	}
};
var cooldown = null;
function modelName() {
	return process.env.XAI_EMBEDDING_MODEL?.trim() || EMBEDDING_CONFIG.defaultModel;
}
function inCooldown() {
	if (!cooldown) return null;
	if (Date.now() >= cooldown.until) {
		cooldown = null;
		return null;
	}
	return cooldown.reason;
}
function startCooldown(reason) {
	cooldown = {
		until: Date.now() + EMBEDDING_CONFIG.cooldownMs,
		reason
	};
}
/**
* Real xAI embeddings via POST /v1/embeddings.
* If the key is missing or the provider rejects the call, this class does not
* invent vectors — it reports unavailable / throws EmbeddingProviderError.
*/
var XaiEmbeddingProvider = class {
	id = "xai";
	get model() {
		return modelName();
	}
	async available() {
		if (!process.env.XAI_API_KEY) return false;
		return inCooldown() == null;
	}
	async embed(request) {
		const apiKey = process.env.XAI_API_KEY;
		if (!apiKey) throw new EmbeddingProviderError("No XAI_API_KEY — cannot create embeddings", "missing_key", false);
		const cooled = inCooldown();
		if (cooled) throw new EmbeddingProviderError(`Embedding provider cooling down: ${cooled}`, "cooldown", true);
		const texts = request.texts.map((t) => t.slice(0, 8e3)).filter((t) => t.trim());
		if (!texts.length) return {
			provider: this.id,
			model: this.model,
			dimensions: 0,
			vectors: []
		};
		const batches = [];
		let dimensions = 0;
		let usedModel = this.model;
		for (let i = 0; i < texts.length; i += EMBEDDING_CONFIG.batchSize) {
			const slice = texts.slice(i, i + EMBEDDING_CONFIG.batchSize);
			const part = await embedOnce(apiKey, usedModel, slice);
			usedModel = part.model;
			dimensions = part.dimensions;
			batches.push(...part.vectors);
		}
		return {
			provider: this.id,
			model: usedModel,
			dimensions,
			vectors: batches
		};
	}
};
async function embedOnce(apiKey, model, input) {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), EMBEDDING_CONFIG.timeoutMs);
	let res;
	try {
		res = await fetch(EMBEDDING_CONFIG.endpoint, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${apiKey}`
			},
			body: JSON.stringify({
				model,
				input
			}),
			signal: controller.signal
		});
	} catch (err) {
		const aborted = err instanceof Error && err.name === "AbortError";
		throw new EmbeddingProviderError(aborted ? "Embedding request timed out" : "Embedding request failed to send", aborted ? "timeout" : "network", true);
	} finally {
		clearTimeout(timer);
	}
	if (res.status === 402 || res.status === 429) {
		const body = await res.text().catch(() => "");
		startCooldown(`http_${res.status}`);
		throw new EmbeddingProviderError(`Embedding provider unavailable (${res.status}): ${body.slice(0, 180)}`, res.status === 402 ? "quota" : "rate_limited", true);
	}
	if (!res.ok) {
		const body = await res.text().catch(() => "");
		throw new EmbeddingProviderError(`xAI embeddings error ${res.status}: ${body.slice(0, 180)}`, `http_${res.status}`, res.status >= 500);
	}
	const json = await res.json();
	const vectors = [...json.data ?? []].sort((a, b) => (a.index ?? 0) - (b.index ?? 0)).map((row) => row.embedding ?? []);
	if (vectors.some((v) => !v.length) || vectors.length !== input.length) throw new EmbeddingProviderError("Embedding provider returned an incomplete vector set", "malformed", true);
	return {
		provider: "xai",
		model: json.model ?? model,
		dimensions: vectors[0]?.length ?? 0,
		vectors
	};
}
var cached = null;
/**
* Resolve the active embedding provider. Swap implementations here (or via
* env) without rewriting retrieval. Never returns a fake/hash embedder.
*/
function resolveEmbeddingProvider() {
	if (cached) return cached;
	if (process.env.XAI_API_KEY) cached = new XaiEmbeddingProvider();
	else cached = new UnavailableEmbeddingProvider();
	return cached;
}
/**
* Course → chapter → topic awareness.
* Boosts the student's current place in the hierarchy without dropping
* related material from neighbouring topics.
*/
function hierarchyScore(chunk, query, strictTopic) {
	const topicId = query.focus.topicId;
	const chapterId = query.focus.chapterId;
	if (strictTopic && topicId != null && chunk.topicId !== topicId) return {
		score: 0,
		reason: "outside-strict-topic"
	};
	if (topicId != null && chunk.topicId === topicId) return {
		score: HIERARCHY.currentTopicBoost,
		reason: "current-topic"
	};
	if (chapterId != null && chunk.chapterId === chapterId) return {
		score: HIERARCHY.sameChapterBoost,
		reason: "same-chapter"
	};
	if (topicId != null && chunk.topicId != null && chunk.topicId !== topicId) return {
		score: query.expandToRelated ? HIERARCHY.relatedTopicBoost : 0,
		reason: query.expandToRelated ? "related-topic" : null
	};
	return {
		score: 0,
		reason: null
	};
}
function passesMetadataFilter(chunk, query, strictTopic) {
	if (chunk.courseId !== query.focus.courseId) return false;
	if (strictTopic && query.focus.topicId != null) return chunk.topicId === query.focus.topicId;
	return true;
}
function weightsFor(mode) {
	if (mode === "lexical-fallback") return normalizeWeights(LEXICAL_FALLBACK_WEIGHTS);
	if (mode === "semantic") return normalizeWeights({
		semantic: .86,
		lexical: .04,
		hierarchy: .08,
		citation: .02
	});
	return normalizeWeights(DEFAULT_SCORE_WEIGHTS);
}
function combineScores(input) {
	const weights = input.semantic == null ? normalizeWeights({
		...input.weights,
		semantic: 0
	}) : input.weights;
	const semantic = input.semantic;
	const combined = clamp01((semantic ?? 0) * weights.semantic + input.lexical * weights.lexical + input.hierarchy * weights.hierarchy + input.citation * weights.citation);
	return {
		semantic,
		lexical: clamp01(input.lexical),
		hierarchy: clamp01(input.hierarchy),
		citation: clamp01(input.citation),
		combined,
		rerank: combined
	};
}
function citationSignal(page, heading) {
	let n = 0;
	if (page != null) n += .7;
	if (heading) n += .3;
	return n;
}
function parseVector(raw) {
	try {
		const v = JSON.parse(raw);
		return Array.isArray(v) ? v.map(Number).filter((n) => Number.isFinite(n)) : [];
	} catch {
		return [];
	}
}
/**
* Database-backed vector store. Vectors live in `chunk_embeddings.vector_json`
* so we don't depend on pgvector (unavailable in the PGLite preview).
* Course-scale brute-force cosine is the intended first search; replace this
* class when a managed ANN index is ready.
*/
var PostgresVectorStore = class {
	sql;
	id = "postgres-json";
	constructor(sql) {
		this.sql = sql;
	}
	async upsert(scope, records) {
		for (const rec of records) {
			if (!rec.embedding.values.length) continue;
			await this.sql`
        insert into chunk_embeddings (
          chunk_id, user_id, course_id, provider, model, dimensions, vector_json
        ) values (
          ${rec.chunkId}, ${scope.userId}, ${scope.courseId},
          ${rec.embedding.provider}, ${rec.embedding.model},
          ${rec.embedding.dimensions}, ${JSON.stringify(rec.embedding.values)}
        )
        on conflict (chunk_id, provider, model)
        do update set
          dimensions = excluded.dimensions,
          vector_json = excluded.vector_json,
          created_at = now()
      `;
		}
	}
	async loadEmbeddings(scope) {
		const rows = await this.sql`
      select chunk_id, provider, model, dimensions, vector_json
      from chunk_embeddings
      where user_id = ${scope.userId} and course_id = ${scope.courseId}
    `;
		const map = /* @__PURE__ */ new Map();
		for (const row of rows) {
			const values = parseVector(row.vector_json);
			if (!values.length) continue;
			map.set(row.chunk_id, {
				provider: row.provider,
				model: row.model,
				dimensions: values.length,
				values
			});
		}
		return map;
	}
	async search(scope, query, limit) {
		const embeddings = await this.loadEmbeddings(scope);
		const hits = [];
		for (const [chunkId, embedding] of embeddings) {
			if (embedding.model !== query.model || embedding.dimensions !== query.dimensions) continue;
			const score = cosineSimilarity(query.values, embedding.values);
			if (score > 0) hits.push({
				chunkId,
				score
			});
		}
		hits.sort((a, b) => b.score - a.score);
		return hits.slice(0, limit);
	}
	async embeddedCount(scope) {
		return (await this.sql`
      select count(*)::int as n from chunk_embeddings
      where user_id = ${scope.userId} and course_id = ${scope.courseId}
    `)[0]?.n ?? 0;
	}
};
async function insertChunk(sql, opts) {
	const uid = `${opts.courseId}:${opts.documentId}:${opts.chunkIndex}`;
	return (await sql`
    insert into source_chunks (
      user_id, course_id, document_id, chapter_id, topic_id,
      page, heading, chunk_index, chunk_uid, content, token_estimate
    ) values (
      ${opts.userId}, ${opts.courseId}, ${opts.documentId},
      ${opts.topic?.chapterId ?? null}, ${opts.topic?.id ?? null},
      ${opts.page}, ${opts.heading}, ${opts.chunkIndex}, ${uid},
      ${opts.content}, ${estimateTokens(opts.content)}
    )
    returning id
  `)[0].id;
}
async function embedInserted(sql, userId, courseId, records) {
	const provider = resolveEmbeddingProvider();
	if (!await provider.available() || !records.length) return {
		embeddedCount: 0,
		status: "unavailable",
		reason: records.length ? "embedding_provider_unavailable" : "no_chunks"
	};
	try {
		const result = await provider.embed({
			texts: records.map((r) => r.content.slice(0, 8e3)),
			purpose: "document"
		});
		const store = new PostgresVectorStore(sql);
		const embeddings = records.map((r, i) => ({
			chunkId: r.id,
			embedding: {
				provider: result.provider,
				model: result.model,
				dimensions: result.dimensions,
				values: result.vectors[i] ?? []
			}
		}));
		await store.upsert({
			userId,
			courseId
		}, embeddings.filter((e) => e.embedding.values.length));
		return {
			embeddedCount: embeddings.filter((e) => e.embedding.values.length).length,
			status: "indexed"
		};
	} catch (err) {
		return {
			embeddedCount: 0,
			status: "unavailable",
			reason: err instanceof EmbeddingProviderError ? err.code : "embed_failed"
		};
	}
}
async function indexCourseMaterial(opts) {
	const pageCount = opts.raw ? (opts.raw.match(/\[\[page\s+\d+\]\]/gi) ?? []).length || null : null;
	const documentId = (await opts.sql`
    insert into source_documents (user_id, course_id, kind, name, page_count)
    values (${opts.userId}, ${opts.courseId}, ${opts.kind}, ${opts.sourceName}, ${pageCount})
    returning id
  `)[0].id;
	const inserted = [];
	if (opts.sampleChunks?.length) {
		const byTitle = new Map(opts.topics.map((t) => [t.title, t]));
		let i = 0;
		for (const chunk of opts.sampleChunks) {
			const topic = byTitle.get(chunk.topicTitle) ?? opts.topics[0] ?? null;
			const id = await insertChunk(opts.sql, {
				userId: opts.userId,
				courseId: opts.courseId,
				documentId,
				topic,
				page: chunk.page,
				heading: chunk.heading ?? chunk.topicTitle,
				content: chunk.content,
				chunkIndex: i
			});
			inserted.push({
				id,
				content: chunk.content
			});
			i += 1;
			if (i >= CHUNKING.maxChunksPerDocument) break;
		}
	} else if (opts.raw) {
		const assigned = assignChunksToTopics(opts.draft ?? {
			code: "",
			title: "",
			chapters: [{
				title: "",
				topics: opts.topics.map((t) => ({
					title: t.title,
					summary: "",
					keyIdeas: []
				}))
			}]
		}, opts.raw);
		for (const chunk of assigned) {
			const topic = opts.topics[chunk.topicIndex] ?? opts.topics[0] ?? null;
			const id = await insertChunk(opts.sql, {
				userId: opts.userId,
				courseId: opts.courseId,
				documentId,
				topic,
				page: chunk.page,
				heading: chunk.heading,
				content: chunk.content,
				chunkIndex: chunk.chunkIndex
			});
			inserted.push({
				id,
				content: chunk.content
			});
		}
	}
	const embed = await embedInserted(opts.sql, opts.userId, opts.courseId, inserted);
	return {
		documentId,
		chunkCount: inserted.length,
		embeddedCount: embed.embeddedCount,
		embeddingStatus: embed.status,
		fallbackReason: embed.reason
	};
}
async function ensureCourseEmbeddings(opts) {
	const missing = await opts.sql`
    select c.id, c.content
    from source_chunks c
    left join chunk_embeddings e on e.chunk_id = c.id
    where c.user_id = ${opts.userId} and c.course_id = ${opts.courseId}
      and e.chunk_id is null
    order by c.id
    limit 128
  `;
	if (!missing.length) {
		const n = (await opts.sql`
      select count(*)::int as n from chunk_embeddings
      where user_id = ${opts.userId} and course_id = ${opts.courseId}
    `)[0]?.n ?? 0;
		return {
			embeddedCount: n,
			status: n ? "indexed" : "unavailable"
		};
	}
	return embedInserted(opts.sql, opts.userId, opts.courseId, missing);
}
/**
* Lexical retriever — keyword overlap, substring, and density.
* This is the FALLBACK path (and a secondary hybrid signal), never the
* primary semantic system.
*/
function lexicalRetrieve(chunks, query, limit) {
	const qTokens = tokenize(query);
	const qSet = new Set(qTokens);
	const qLower = query.toLowerCase();
	if (!qSet.size) return chunks.slice(0, limit).map((c, i) => ({
		chunkId: c.id,
		score: Math.max(.05, 1 - i * .02),
		overlap: 0
	}));
	const hits = [];
	for (const chunk of chunks) {
		const tokens = tokenize(chunk.content);
		let overlap = 0;
		for (const t of tokens) if (qSet.has(t)) overlap += 1;
		const uniqueHits = tokens.filter((t) => qSet.has(t)).length ? new Set(tokens.filter((t) => qSet.has(t))).size : 0;
		const density = tokens.length ? overlap / Math.sqrt(tokens.length) : 0;
		const phrase = qLower.length > 8 && chunk.content.toLowerCase().includes(qLower.slice(0, 80)) ? .35 : 0;
		const headingHit = chunk.heading && qTokens.some((t) => chunk.heading.toLowerCase().includes(t)) ? .2 : 0;
		const raw = density * .55 + uniqueHits * .12 + phrase + headingHit;
		if (raw <= 0) continue;
		hits.push({
			chunkId: chunk.id,
			score: Math.min(1, raw / 6),
			overlap
		});
	}
	hits.sort((a, b) => b.score - a.score);
	return hits.slice(0, limit);
}
function detectIntent(text) {
	const q = text.toLowerCase();
	if (/\b(vs|versus|differ|compare|comparison|contrast)\b/.test(q)) return "compare";
	if (/\b(example|for instance|illustrat)/.test(q)) return "example";
	if (/\b(why|reason|because|cause)\b/.test(q)) return "why";
	if (/\b(how (do|does|can|to)|steps?|process|procedure)\b/.test(q)) return "how";
	if (/\b(what is|define|definition|meaning of)\b/.test(q)) return "define";
	if (/\b(review|recap|remind|summar)/.test(q)) return "review";
	if (/\b(explain|describe|tell me about|walk me)\b/.test(q)) return "explain";
	return "other";
}
function wantsRelated(text, options) {
	const q = text.toLowerCase();
	if (options.strictTopic) return false;
	if (/\b(only this topic|just this topic|stay on this|don't go beyond)\b/.test(q)) return false;
	if (/\b(whole course|other (topics|chapters)|related|elsewhere)\b/.test(q)) return true;
	return options.preferCurrentTopic !== false;
}
/**
* Query understanding stage.
* Rewrites the student question with course/topic context so both the
* embedding model and the lexical fallback see the same focused query.
* A later LLM rewriter can replace `rewritten` without changing callers.
*/
function understandQuery(query, options = {}) {
	const original = query.text.trim();
	const intent = detectIntent(original);
	const expandToRelated = wantsRelated(original, options);
	const parts = [original];
	if (options.topicTitle) parts.push(`Topic: ${options.topicTitle}`);
	if (options.chapterTitle) parts.push(`Chapter: ${options.chapterTitle}`);
	if (options.keyIdeas?.length) parts.push(`Key ideas: ${options.keyIdeas.slice(0, 6).join("; ")}`);
	if (intent === "define") parts.push("Provide the definition as stated in the source.");
	if (intent === "compare") parts.push("Contrast the concepts using the source.");
	if (intent === "example") parts.push("Prefer worked examples and concrete cases from the source.");
	const rewritten = parts.join("\n");
	const keywords = tokenize([
		original,
		options.topicTitle ?? "",
		...options.keyIdeas ?? []
	].join(" "));
	return {
		original,
		rewritten,
		intent,
		keywords: [...new Set(keywords)].slice(0, 24),
		expandToRelated,
		focus: {
			courseId: query.courseId,
			chapterId: options.chapterId ?? query.chapterId ?? null,
			topicId: options.topicId ?? query.topicId ?? null
		}
	};
}
function overlapRatio(a, b) {
	const sa = new Set(tokenize(a));
	const sb = new Set(tokenize(b));
	if (!sa.size || !sb.size) return 0;
	let inter = 0;
	for (const t of sa) if (sb.has(t)) inter += 1;
	return inter / Math.min(sa.size, sb.size);
}
/**
* Separate reranking stage. Today this is a lightweight diversity + coverage
* reranker so we don't send five near-duplicate paragraphs to the tutor.
* Swap in a cross-encoder later by implementing `Reranker`.
*/
var DiversityReranker = class {
	id = "diversity-coverage";
	rerank(candidates, query) {
		const remaining = [...candidates].sort((a, b) => b.scores.combined - a.scores.combined);
		const picked = [];
		const covered = /* @__PURE__ */ new Set();
		const needed = new Set(query.keywords);
		while (remaining.length) {
			let bestIdx = 0;
			let bestScore = -Infinity;
			for (let i = 0; i < remaining.length; i += 1) {
				const cand = remaining[i];
				let bonus = 0;
				const tokens = tokenize(cand.chunk.content);
				let newTerms = 0;
				for (const t of tokens) if (needed.has(t) && !covered.has(t)) newTerms += 1;
				bonus += Math.min(.12, newTerms * .03);
				const dup = picked.reduce((m, p) => Math.max(m, overlapRatio(p.chunk.content, cand.chunk.content)), 0);
				if (dup > .72) bonus -= .25;
				else if (dup > .5) bonus -= .1;
				if (cand.chunk.page != null) bonus += .03;
				if (cand.scores.semantic != null) bonus += cand.scores.semantic * .08;
				const score = cand.scores.combined + bonus;
				if (score > bestScore) {
					bestScore = score;
					bestIdx = i;
				}
			}
			const [chosen] = remaining.splice(bestIdx, 1);
			const next = {
				...chosen,
				scores: {
					...chosen.scores,
					rerank: Math.max(0, Math.min(1, bestScore))
				},
				reasons: [...chosen.reasons, `rerank:${this.id}`]
			};
			picked.push(next);
			for (const t of tokenize(next.chunk.content)) if (needed.has(t)) covered.add(t);
		}
		return picked;
	}
};
function toChunk(row) {
	return {
		id: row.id,
		uid: row.chunk_uid || `chunk:${row.course_id}:${row.id}`,
		courseId: row.course_id,
		documentId: row.document_id,
		chapterId: row.chapter_id,
		topicId: row.topic_id,
		page: row.page,
		heading: row.heading,
		chunkIndex: row.chunk_index ?? 0,
		content: row.content,
		tokenEstimate: row.token_estimate ?? estimateTokens(row.content),
		topicTitle: row.topic_title,
		chapterTitle: row.chapter_title,
		sourceName: row.source_name
	};
}
async function loadCourseChunks(sql, userId, courseId) {
	return (await sql`
    select
      c.id,
      c.course_id,
      c.document_id,
      coalesce(c.chapter_id, t.chapter_id) as chapter_id,
      c.topic_id,
      c.page,
      c.heading,
      c.chunk_index,
      c.chunk_uid,
      c.content,
      c.token_estimate,
      t.title as topic_title,
      ch.title as chapter_title,
      coalesce(d.name, cr.source_name) as source_name
    from source_chunks c
    left join topics t on t.id = c.topic_id
    left join chapters ch on ch.id = coalesce(c.chapter_id, t.chapter_id)
    left join source_documents d on d.id = c.document_id
    left join courses cr on cr.id = c.course_id
    where c.user_id = ${userId} and c.course_id = ${courseId}
    order by c.id
  `).map(toChunk);
}
/**
* Semantic / vector retrieval. Requires a real embedding of the query and
* stored chunk vectors. Callers must not substitute lexical scores here.
*/
async function semanticRetrieve(opts) {
	if (!await opts.provider.available()) throw new EmbeddingProviderError("Embedding provider is not available", "unavailable", true);
	const embedded = await opts.provider.embed({
		texts: [opts.queryText],
		purpose: "query"
	});
	const values = embedded.vectors[0];
	if (!values?.length) throw new EmbeddingProviderError("Query embedding was empty", "malformed", true);
	const queryEmbedding = {
		provider: embedded.provider,
		model: embedded.model,
		dimensions: embedded.dimensions,
		values
	};
	return {
		hits: await opts.store.search({
			userId: opts.userId,
			courseId: opts.courseId
		}, queryEmbedding, opts.limit),
		queryEmbedding
	};
}
/**
* Full retrieval pipeline:
*   Query → understand → candidate pool → semantic (primary)
*         → lexical (secondary / fallback) → hierarchy filter
*         → hybrid score → rerank → context select → citations
*
* Semantic retrieval is used only when real embeddings exist. Otherwise the
* pipeline records `lexical-fallback` and uses the lexical retriever explicitly.
*/
async function retrieveForCourse(query, options = {}, deps) {
	const understood = understandQuery(query, options);
	const chunks = await loadCourseChunks(deps.sql, query.userId, query.courseId);
	const strictTopic = Boolean(options.strictTopic);
	const pool = chunks.filter((c) => passesMetadataFilter(c, understood, strictTopic));
	const byId = new Map(pool.map((c) => [c.id, c]));
	const candidateLimit = options.candidateLimit ?? RETRIEVAL_DEFAULTS.candidateLimit;
	const limit = options.limit ?? RETRIEVAL_DEFAULTS.limit;
	const forceLexical = options.mode === "lexical";
	const provider = deps.provider ?? resolveEmbeddingProvider();
	const store = deps.store ?? new PostgresVectorStore(deps.sql);
	const reranker = deps.reranker ?? new DiversityReranker();
	let mode = "lexical-fallback";
	let fallbackReason = forceLexical ? "mode_lexical" : "embeddings_not_ready";
	const semanticScores = /* @__PURE__ */ new Map();
	let embeddedChunkCount = 0;
	let providerId = provider.id === "unavailable" ? null : provider.id;
	let modelId = provider.id === "unavailable" ? null : provider.model;
	if (!forceLexical) {
		const ensured = await ensureCourseEmbeddings({
			sql: deps.sql,
			userId: query.userId,
			courseId: query.courseId
		});
		embeddedChunkCount = ensured.embeddedCount;
		if (ensured.status === "indexed" && embeddedChunkCount > 0) try {
			const semantic = await semanticRetrieve({
				provider,
				store,
				userId: query.userId,
				courseId: query.courseId,
				queryText: understood.rewritten,
				limit: candidateLimit
			});
			for (const hit of semantic.hits) semanticScores.set(hit.chunkId, hit.score);
			mode = options.mode === "semantic" ? "semantic" : "hybrid";
			fallbackReason = void 0;
			modelId = semantic.queryEmbedding.model;
			providerId = semantic.queryEmbedding.provider;
		} catch (err) {
			fallbackReason = err instanceof EmbeddingProviderError ? `embedding_${err.code}` : "semantic_retrieve_failed";
			mode = "lexical-fallback";
		}
		else {
			fallbackReason = ensured.reason ?? "no_stored_embeddings";
			mode = "lexical-fallback";
		}
	}
	const lexicalHits = lexicalRetrieve(pool, understood.rewritten, candidateLimit);
	const lexicalScores = new Map(lexicalHits.map((h) => [h.chunkId, h.score]));
	const ids = /* @__PURE__ */ new Set([...semanticScores.keys(), ...lexicalScores.keys()]);
	if (!ids.size) for (const chunk of pool.slice(0, candidateLimit)) ids.add(chunk.id);
	const weights = weightsFor(mode);
	const candidates = [];
	for (const id of ids) {
		const chunk = byId.get(id);
		if (!chunk) continue;
		const hier = hierarchyScore(chunk, understood, strictTopic);
		if (strictTopic && hier.reason === "outside-strict-topic") continue;
		const semantic = semanticScores.has(id) ? semanticScores.get(id) : mode === "lexical-fallback" ? null : 0;
		const scores = combineScores({
			semantic,
			lexical: lexicalScores.get(id) ?? 0,
			hierarchy: hier.score,
			citation: citationSignal(chunk.page, chunk.heading),
			weights
		});
		const reasons = [];
		if (semantic != null && semantic > 0) reasons.push("semantic");
		if ((lexicalScores.get(id) ?? 0) > 0) reasons.push("lexical");
		if (hier.reason) reasons.push(hier.reason);
		candidates.push({
			chunk,
			scores,
			reasons
		});
	}
	candidates.sort((a, b) => b.scores.combined - a.scores.combined);
	const reranked = reranker.rerank(candidates, understood);
	const selected = selectContext(reranked, {
		limit,
		tokenBudget: options.tokenBudget ?? RETRIEVAL_DEFAULTS.tokenBudget
	});
	return {
		mode,
		query: understood,
		candidates: reranked,
		selected,
		citations: selected.map((c) => toCitation(c.chunk)),
		context: formatContext(selected),
		diagnostics: {
			embeddingProvider: providerId,
			embeddingModel: modelId,
			vectorStore: store.id,
			totalChunkCount: chunks.length,
			embeddedChunkCount,
			candidateCount: candidates.length,
			fallbackReason
		}
	};
}
async function speak(text) {
	const apiKey = process.env.XAI_API_KEY;
	if (!apiKey) return {
		ok: false,
		error: "Voice playback is unavailable right now."
	};
	const clipped = text.slice(0, 900);
	const res = await fetch("https://api.x.ai/v1/tts", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`
		},
		body: JSON.stringify({
			text: clipped,
			voice_id: "eve"
		})
	});
	if (!res.ok) return {
		ok: false,
		error: "Voice playback is unavailable right now."
	};
	return {
		ok: true,
		audioBase64: Buffer.from(await res.arrayBuffer()).toString("base64"),
		mime: res.headers.get("content-type") || "audio/mpeg"
	};
}
function iso(v) {
	if (v == null || v === "") return null;
	if (v instanceof Date) return v.toISOString();
	const d = new Date(String(v));
	return Number.isNaN(d.getTime()) ? String(v) : d.toISOString();
}
function asInt(v, fallback = 0) {
	const n = typeof v === "number" ? v : Number(v);
	return Number.isFinite(n) ? n : fallback;
}
function parseIdeas(raw) {
	if (Array.isArray(raw)) return raw.filter((x) => typeof x === "string");
	if (typeof raw !== "string" || !raw) return [];
	try {
		const v = JSON.parse(raw);
		return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
	} catch {
		return [];
	}
}
function sampleQuestionsByTitle(title) {
	for (const ch of SAMPLE_CIT102.chapters) for (const t of ch.topics) if (t.title === title) return t.questions;
	return [];
}
async function loadChapters(sql, userId, courseId) {
	const chapterRows = await sql`
    select id, position, title from chapters
    where user_id = ${userId} and course_id = ${courseId}
    order by position
  `;
	const topicRows = await sql`
    select t.id, t.chapter_id, t.position, t.title, t.summary, t.key_ideas_json,
           m.mastery, m.attempts, m.correct, m.last_assessed_at
    from topics t
    left join topic_mastery m on m.topic_id = t.id and m.user_id = t.user_id
    where t.user_id = ${userId} and t.course_id = ${courseId}
    order by t.position
  `;
	const byChapter = /* @__PURE__ */ new Map();
	for (const t of topicRows) {
		const row = {
			id: t.id,
			chapterId: t.chapter_id,
			position: t.position,
			title: t.title,
			summary: t.summary,
			keyIdeas: parseIdeas(t.key_ideas_json),
			mastery: t.mastery === null || t.mastery === void 0 ? null : asInt(t.mastery),
			attempts: asInt(t.attempts),
			correct: asInt(t.correct),
			lastAssessedAt: iso(t.last_assessed_at)
		};
		const list = byChapter.get(t.chapter_id) ?? [];
		list.push(row);
		byChapter.set(t.chapter_id, list);
	}
	return chapterRows.map((ch) => ({
		id: ch.id,
		position: ch.position,
		title: ch.title,
		topics: byChapter.get(ch.id) ?? []
	}));
}
async function buildWorkspace(sql, userId, courseId) {
	const course = (await sql`
    select id, code, title, source_kind, source_name, last_topic_id, last_studied_at, created_at
    from courses where id = ${courseId} and user_id = ${userId}
  `)[0];
	if (!course) return null;
	const chapters = await loadChapters(sql, userId, courseId);
	const messages = await sql`
    select id, role, content, topic_id, created_at, citations_json
    from messages
    where user_id = ${userId} and course_id = ${courseId}
    order by id desc
    limit 40
  `;
	return {
		course: {
			id: course.id,
			code: course.code,
			title: course.title,
			sourceKind: course.source_kind,
			sourceName: course.source_name,
			lastTopicId: course.last_topic_id,
			lastStudiedAt: iso(course.last_studied_at),
			createdAt: iso(course.created_at) ?? (/* @__PURE__ */ new Date()).toISOString()
		},
		chapters,
		recommendation: recommend({
			chapters,
			lastTopicId: course.last_topic_id,
			lastStudiedAt: iso(course.last_studied_at)
		}),
		messages: messages.map((m) => ({
			id: m.id,
			role: m.role === "user" ? "user" : "assistant",
			content: m.content,
			topicId: m.topic_id,
			createdAt: iso(m.created_at) ?? (/* @__PURE__ */ new Date()).toISOString(),
			citations: toMessageCitations(m.citations_json)
		})).reverse(),
		readiness: computeReadiness(chapters)
	};
}
function chapterTitleFor(chapters, topic) {
	if (!topic) return null;
	return chapters.find((ch) => ch.id === topic.chapterId)?.title ?? null;
}
async function retrieveStudyContext(opts) {
	return retrieveForCourse({
		text: opts.query,
		courseId: opts.courseId,
		userId: opts.userId,
		topicId: opts.topic?.id ?? null,
		chapterId: opts.topic?.chapterId ?? null
	}, {
		topicId: opts.topic?.id ?? null,
		chapterId: opts.topic?.chapterId ?? null,
		topicTitle: opts.topic?.title ?? null,
		chapterTitle: chapterTitleFor(opts.chapters, opts.topic),
		keyIdeas: opts.topic?.keyIdeas ?? [],
		courseTitle: opts.courseTitle,
		sourceName: opts.sourceName,
		preferCurrentTopic: true,
		limit: 6
	}, { sql: opts.sql });
}
async function insertDraft(sql, userId, draft, meta) {
	const courseId = (await sql`
    insert into courses (user_id, code, title, status, source_kind, source_name)
    values (${userId}, ${draft.code}, ${draft.title}, 'ready', ${meta.kind}, ${meta.sourceName})
    returning id
  `)[0].id;
	let chapterPos = 0;
	for (const chapter of draft.chapters) {
		chapterPos += 1;
		const ch = await sql`
      insert into chapters (user_id, course_id, position, title)
      values (${userId}, ${courseId}, ${chapterPos}, ${chapter.title})
      returning id
    `;
		let topicPos = 0;
		for (const topic of chapter.topics) {
			topicPos += 1;
			await sql`
        insert into topics (user_id, course_id, chapter_id, position, title, summary, key_ideas_json)
        values (
          ${userId}, ${courseId}, ${ch[0].id}, ${topicPos}, ${topic.title}, ${topic.summary},
          ${JSON.stringify(topic.keyIdeas)}
        )
      `;
		}
	}
	const topicIds = await sql`
    select id, title, chapter_id from topics
    where user_id = ${userId} and course_id = ${courseId}
    order by position
  `;
	const topics = topicIds.map((t) => ({
		id: t.id,
		title: t.title,
		chapterId: t.chapter_id
	}));
	if (meta.kind === "sample") {
		const sampleChunks = SAMPLE_CIT102.chapters.flatMap((chapter) => chapter.topics.flatMap((topic) => topic.chunks.map((chunk) => ({
			topicTitle: topic.title,
			page: chunk.page,
			content: chunk.content,
			heading: topic.title
		}))));
		await indexCourseMaterial({
			sql,
			userId,
			courseId,
			kind: meta.kind,
			sourceName: meta.sourceName,
			topics,
			draft,
			sampleChunks
		});
	} else if (meta.raw) await indexCourseMaterial({
		sql,
		userId,
		courseId,
		kind: meta.kind,
		sourceName: meta.sourceName,
		topics,
		draft,
		raw: meta.raw
	});
	const first = topicIds[0];
	const topicCount = topicIds.length;
	const chapterCount = draft.chapters.length;
	const welcome = `I mapped ${draft.code} into ${chapterCount} chapter${chapterCount === 1 ? "" : "s"} and ${topicCount} topic${topicCount === 1 ? "" : "s"}. ` + (first ? `This is how I understood your course. I recommend starting with **${first.title}**.` : "This is how I understood your course.");
	await sql`
    insert into messages (user_id, course_id, topic_id, role, content)
    values (${userId}, ${courseId}, ${first?.id ?? null}, 'assistant', ${welcome})
  `;
	return courseId;
}
var listCourses_createServerFn_handler = createServerRpc({
	id: "07ae34491a878c761a8b3ed377497cc24299b8148102be8dc365b0d7a7b8cc23",
	name: "listCourses",
	filename: "src/lib/apex/actions.ts"
}, (opts) => listCourses.__executeServer(opts));
var listCourses = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listCourses_createServerFn_handler, async ({ context }) => {
	const rows = await (await getSql())`
      select c.id, c.code, c.title, c.source_kind, c.source_name, c.last_topic_id, c.last_studied_at,
             t.id as topic_id, t.title as topic_title, m.mastery, m.attempts
      from courses c
      left join topics t on t.course_id = c.id
      left join topic_mastery m on m.topic_id = t.id and m.user_id = c.user_id
      where c.user_id = ${context.userId}
      order by c.created_at desc, t.position
    `;
	const map = /* @__PURE__ */ new Map();
	for (const r of rows) {
		let card = map.get(r.id);
		if (!card) {
			card = {
				id: r.id,
				code: r.code,
				title: r.title,
				sourceKind: r.source_kind,
				sourceName: r.source_name,
				lastTopicTitle: null,
				lastStudiedAt: iso(r.last_studied_at),
				topicCount: 0,
				exploredCount: 0,
				openedCount: 0,
				assessedCount: 0,
				avgMastery: null,
				masteries: []
			};
			map.set(r.id, card);
		}
		if (r.topic_id) {
			card.topicCount += 1;
			if (topicHasProgress(asInt(r.attempts), r.mastery == null ? null : asInt(r.mastery))) card.exploredCount += 1;
			if (r.mastery != null) {
				card.assessedCount += 1;
				card.masteries.push(asInt(r.mastery));
			}
			if (r.last_topic_id === r.topic_id) {
				card.openedCount += 1;
				card.lastTopicTitle = r.topic_title;
			}
		}
	}
	return [...map.values()].map(({ masteries, ...card }) => ({
		...card,
		avgMastery: masteries.length ? Math.round(masteries.reduce((a, b) => a + b, 0) / masteries.length) : null
	}));
});
var getWorkspace_createServerFn_handler = createServerRpc({
	id: "77af0e17b75b4b92616e5479ad855af61f4eb10305e186fc606141912c993a60",
	name: "getWorkspace",
	filename: "src/lib/apex/actions.ts"
}, (opts) => getWorkspace.__executeServer(opts));
var getWorkspace = createServerFn({ method: "GET" }).validator((input) => input).middleware([authMiddleware]).handler(getWorkspace_createServerFn_handler, async ({ context, data }) => {
	return buildWorkspace(await getSql(), context.userId, data.courseId);
});
var createSampleCourse_createServerFn_handler = createServerRpc({
	id: "0e89508b86671217ae9a1f1ca8de669f8e7d3f7b149952ac342324563bf4cf98",
	name: "createSampleCourse",
	filename: "src/lib/apex/actions.ts"
}, (opts) => createSampleCourse.__executeServer(opts));
var createSampleCourse = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(createSampleCourse_createServerFn_handler, async ({ context }) => {
	const sql = await getSql();
	const existing = await sql`
      select id from courses
      where user_id = ${context.userId} and source_kind = 'sample' and code = 'CIT 102'
      order by id desc limit 1
    `;
	if (existing[0]) return { courseId: existing[0].id };
	return { courseId: await insertDraft(sql, context.userId, sampleAsDraft(), {
		kind: "sample",
		sourceName: SAMPLE_CIT102.sourceName
	}) };
});
var createCourseFromText_createServerFn_handler = createServerRpc({
	id: "1b3dd904199232fb402b3d24fbaae51a4905fca041db051c2b7937018a584fa9",
	name: "createCourseFromText",
	filename: "src/lib/apex/actions.ts"
}, (opts) => createCourseFromText.__executeServer(opts));
var createCourseFromText = createServerFn({ method: "POST" }).validator((input) => {
	const text = input.text.trim().slice(0, 1e5);
	if (text.length < 80) throw new Error("That document is too short to map into a course.");
	return {
		text,
		sourceName: input.sourceName.slice(0, 180) || "Uploaded material",
		kind: input.kind,
		code: input.code?.trim().slice(0, 32),
		title: input.title?.trim().slice(0, 120)
	};
}).middleware([authMiddleware]).handler(createCourseFromText_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	const draft = await structureFromText({
		text: data.text,
		hintCode: data.code,
		hintTitle: data.title
	});
	const courseId = await insertDraft(sql, context.userId, draft, {
		kind: data.kind,
		sourceName: data.sourceName,
		raw: data.text
	});
	return {
		courseId,
		workspace: await buildWorkspace(sql, context.userId, courseId)
	};
});
var renameCourse_createServerFn_handler = createServerRpc({
	id: "6a77150ca36781b60415e9ce543fcec77213085679c90e2577919397ec619f85",
	name: "renameCourse",
	filename: "src/lib/apex/actions.ts"
}, (opts) => renameCourse.__executeServer(opts));
var renameCourse = createServerFn({ method: "POST" }).validator((input) => ({
	courseId: input.courseId,
	code: input.code.trim().slice(0, 32) || "COURSE",
	title: input.title.trim().slice(0, 120) || "Untitled course"
})).middleware([authMiddleware]).handler(renameCourse_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	await sql`
      update courses set code = ${data.code}, title = ${data.title}
      where id = ${data.courseId} and user_id = ${context.userId}
    `;
	return buildWorkspace(sql, context.userId, data.courseId);
});
var deleteCourse_createServerFn_handler = createServerRpc({
	id: "58a5cb5d7668aa16117058e10c948d93959fd38dfe74e5fd57b1fae145b5cc40",
	name: "deleteCourse",
	filename: "src/lib/apex/actions.ts"
}, (opts) => deleteCourse.__executeServer(opts));
var deleteCourse = createServerFn({ method: "POST" }).validator((input) => input).middleware([authMiddleware]).handler(deleteCourse_createServerFn_handler, async ({ context, data }) => {
	await (await getSql())`delete from courses where id = ${data.courseId} and user_id = ${context.userId}`;
	return { ok: true };
});
var selectTopic_createServerFn_handler = createServerRpc({
	id: "25244fe34f70adf84a0492918447940b0b2d40a7efd930b293bf5a29db5cec78",
	name: "selectTopic",
	filename: "src/lib/apex/actions.ts"
}, (opts) => selectTopic.__executeServer(opts));
var selectTopic = createServerFn({ method: "POST" }).validator((input) => input).middleware([authMiddleware]).handler(selectTopic_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	await sql`
      update courses
      set last_topic_id = ${data.topicId}, last_studied_at = now()
      where id = ${data.courseId} and user_id = ${context.userId}
    `;
	return buildWorkspace(sql, context.userId, data.courseId);
});
var tutorChat_createServerFn_handler = createServerRpc({
	id: "84d44c7e25625845eb6d8aa067241ebf70a5412ffff73c6d2a38627ad5904916",
	name: "tutorChat",
	filename: "src/lib/apex/actions.ts"
}, (opts) => tutorChat.__executeServer(opts));
var tutorChat = createServerFn({ method: "POST" }).validator((input) => {
	const message = input.message.trim().slice(0, 4e3);
	if (!message) throw new Error("Type a question first.");
	return {
		courseId: input.courseId,
		topicId: input.topicId ?? null,
		message
	};
}).middleware([authMiddleware]).handler(tutorChat_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	const workspace = await buildWorkspace(sql, context.userId, data.courseId);
	if (!workspace) throw new Error("Course not found");
	const topicId = data.topicId ?? workspace.course.lastTopicId;
	const topics = workspace.chapters.flatMap((ch) => ch.topics);
	const topic = topics.find((t) => t.id === topicId) ?? topics[0];
	await sql`
      insert into messages (user_id, course_id, topic_id, role, content)
      values (${context.userId}, ${data.courseId}, ${topic?.id ?? null}, 'user', ${data.message})
    `;
	await sql`
      update courses
      set last_topic_id = ${topic?.id ?? null}, last_studied_at = now()
      where id = ${data.courseId} and user_id = ${context.userId}
    `;
	const intent = detectIntent$1(data.message);
	if (intent.kind === "practice" || intent.kind === "exam" || intent.kind === "check") {
		const count = intent.count ?? (intent.kind === "exam" ? 12 : 5);
		const reply = intent.kind === "exam" ? `I'll run a ${count}-question diagnostic across the course rather than dumping questions into chat. Open Exam Readiness when you're ready.` : `I won't dump ${count} questions into chat. I'll start a grounded ${count}-question set on ${topic?.title ?? "this topic"} from the source material.`;
		await sql`
        insert into messages (user_id, course_id, topic_id, role, content)
        values (${context.userId}, ${data.courseId}, ${topic?.id ?? null}, 'assistant', ${reply})
      `;
		return {
			workspace: await buildWorkspace(sql, context.userId, data.courseId),
			action: {
				kind: intent.kind === "exam" ? "exam" : "practice",
				count,
				topicId: intent.kind === "exam" ? void 0 : topic?.id
			}
		};
	}
	const retrieved = await retrieveStudyContext({
		sql,
		userId: context.userId,
		courseId: data.courseId,
		query: data.message,
		topic,
		chapters: workspace.chapters,
		sourceName: workspace.course.sourceName,
		courseTitle: workspace.course.title
	});
	const map = workspace.chapters.map((ch) => {
		const lines = ch.topics.map((t) => `  - ${t.title}${t.mastery == null ? "" : ` (${t.mastery}% mastery)`}`).join("\n");
		return `${ch.title}\n${lines}`;
	}).join("\n");
	const history = workspace.messages.slice(-8).map((m) => ({
		role: m.role,
		content: m.content
	}));
	const ai = await chatText({
		system: `You are ApexStudy, an adaptive tutor inside a study system — not a generic chatbot.
Teach ONLY from the retrieved source excerpts. If the source does not cover something, say so.
When you use a fact, cite it with the provided labels such as [Source — p. 17]. Prefer 2–4 short paragraphs, then one check question.
Do not invent a curriculum. Do not dump long quizzes; the app has a Practice action for that.
Only state that the student has mastered a topic if the COURSE MAP above shows that topic's mastery percentage at 75 or above. Never claim mastery from conversation context, navigation, or assumption.
Current course: ${workspace.course.code} — ${workspace.course.title}
Current topic: ${topic?.title ?? "unspecified"}
Learner note: ${workspace.recommendation.body}

COURSE MAP:
${map}

RETRIEVED SOURCE (${retrieved.mode}):
${retrieved.context}`,
		maxTokens: 700,
		feature: "tutor",
		userId: context.userId,
		messages: [...history, {
			role: "user",
			content: data.message
		}]
	});
	let text = ai.ok ? ai.text : topic ? `${topic.summary}\n\n${topic.keyIdeas.length ? `Hold onto these ideas: ${topic.keyIdeas.join("; ")}.` : ""}\n\nAI tutoring is unavailable right now, so I'm teaching from the indexed source only. Ask me to start a check when you want questions.` : ai.error;
	const cites = formatCitationLine(retrieved.citations);
	if (cites && !text.includes("[Source") && !text.includes("p.")) text = `${text.trim()}\n\n${cites}`;
	const storedCitations = retrieved.citations.map((c) => ({
		chunkId: c.chunkId,
		sourceName: c.sourceName,
		page: c.page,
		heading: c.heading,
		locator: c.locator,
		label: c.label,
		excerpt: c.excerpt
	}));
	const citationsJson = storedCitations.length ? JSON.stringify(storedCitations) : null;
	await sql`
      insert into messages (user_id, course_id, topic_id, role, content, citations_json)
      values (${context.userId}, ${data.courseId}, ${topic?.id ?? null}, 'assistant', ${text}, ${citationsJson})
    `;
	return {
		workspace: await buildWorkspace(sql, context.userId, data.courseId),
		action: null
	};
});
async function generateQuestions(opts) {
	const out = [];
	for (const topic of opts.topics) for (const q of sampleQuestionsByTitle(topic.title)) out.push({
		...q,
		topicId: topic.id,
		topicTitle: topic.title,
		sourcePage: null
	});
	if (out.length >= opts.count) return out.slice(0, opts.count);
	const query = opts.topics.map((t) => `${t.title} ${t.keyIdeas.join(" ")}`).join("\n");
	const retrieved = await retrieveStudyContext({
		sql: opts.sql,
		userId: opts.userId,
		courseId: opts.courseId,
		query,
		topic: opts.topics[0],
		chapters: opts.chapters,
		sourceName: opts.sourceName,
		courseTitle: opts.courseTitle
	});
	const needed = opts.count - out.length;
	const ai = await chatJson({
		maxTokens: 1800,
		feature: "quiz",
		userId: opts.userId,
		system: `Generate multiple-choice questions grounded ONLY in the source excerpts.
JSON: {"questions":[{"topicTitle":"string","difficulty":"recall"|"application"|"analysis","stem":"string","choices":["a","b","c","d"],"correctIndex":0,"explanation":"string","sourcePage":null}]}
Rules: exactly 4 choices, one correct, no "all of the above", plausible distractors from the material, short explanations that cite the idea and page when present. correctIndex is 0-3.`,
		user: `Need ${needed} questions for topics: ${opts.topics.map((t) => t.title).join("; ")}

SOURCE:
${retrieved.context}`
	});
	if (ai.ok) try {
		const parsed = extractJsonObject(ai.text);
		for (const q of parsed.questions ?? []) {
			const choices = Array.isArray(q.choices) ? q.choices.map(String).slice(0, 4) : [];
			if (choices.length !== 4 || typeof q.stem !== "string") continue;
			const correctIndex = asInt(q.correctIndex, 0);
			if (correctIndex < 0 || correctIndex > 3) continue;
			const topic = opts.topics.find((t) => t.title === q.topicTitle) ?? opts.topics.find((t) => typeof q.topicTitle === "string" ? t.title.toLowerCase().includes(String(q.topicTitle).toLowerCase()) : false) ?? opts.topics[0];
			const difficulty = q.difficulty === "application" || q.difficulty === "analysis" || q.difficulty === "recall" ? q.difficulty : "recall";
			out.push({
				stem: q.stem,
				choices: [
					choices[0],
					choices[1],
					choices[2],
					choices[3]
				],
				correctIndex,
				explanation: String(q.explanation ?? "See the source material."),
				difficulty,
				topicId: topic.id,
				topicTitle: topic.title,
				sourcePage: q.sourcePage == null ? null : asInt(q.sourcePage)
			});
		}
	} catch {}
	return out.slice(0, opts.count);
}
function pickTopics(chapters, requested, kind) {
	const all = chapters.flatMap((ch) => ch.topics);
	if (requested?.length) {
		const set = new Set(requested);
		const picked = all.filter((t) => set.has(t.id));
		if (picked.length) return picked;
	}
	if (kind === "exam") {
		const weak = [...all].sort((a, b) => (a.mastery ?? -1) - (b.mastery ?? -1));
		return weak.slice(0, Math.min(8, weak.length));
	}
	const last = all.find((t) => t.attempts === 0) ?? all.find((t) => (t.mastery ?? 0) < 70) ?? all[0];
	return last ? [last] : all.slice(0, 1);
}
var startQuiz_createServerFn_handler = createServerRpc({
	id: "fa6ace08640565c259618d41ec6f1967f3ee3c5a83b15413c38b1e4d765fa026",
	name: "startQuiz",
	filename: "src/lib/apex/actions.ts"
}, (opts) => startQuiz.__executeServer(opts));
var startQuiz = createServerFn({ method: "POST" }).validator((input) => ({
	courseId: input.courseId,
	kind: input.kind,
	topicIds: input.topicIds,
	count: Math.max(3, Math.min(20, input.count ?? (input.kind === "exam" ? 12 : 5)))
})).middleware([authMiddleware]).handler(startQuiz_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	const workspace = await buildWorkspace(sql, context.userId, data.courseId);
	if (!workspace) throw new Error("Course not found");
	const topics = pickTopics(workspace.chapters, data.topicIds, data.kind);
	if (!topics.length) throw new Error("No topics to assess");
	const generated = await generateQuestions({
		sql,
		userId: context.userId,
		courseId: data.courseId,
		topics,
		chapters: workspace.chapters,
		sourceName: workspace.course.sourceName,
		courseTitle: workspace.course.title,
		count: data.count
	});
	if (!generated.length) throw new Error("Could not generate questions from this material.");
	const sessionId = (await sql`
      insert into quiz_sessions (user_id, course_id, kind, topic_ids_json, status)
      values (
        ${context.userId}, ${data.courseId}, ${data.kind},
        ${JSON.stringify(topics.map((t) => t.id))}, 'active'
      )
      returning id
    `)[0].id;
	const questions = [];
	for (const q of generated) {
		const row = await sql`
        insert into questions (
          user_id, course_id, topic_id, session_id, stem, choices_json, correct_index,
          explanation, difficulty, source_page
        ) values (
          ${context.userId}, ${data.courseId}, ${q.topicId}, ${sessionId}, ${q.stem},
          ${JSON.stringify(q.choices)}, ${q.correctIndex}, ${q.explanation}, ${q.difficulty},
          ${q.sourcePage}
        )
        returning id
      `;
		questions.push({
			id: row[0].id,
			topicId: q.topicId,
			topicTitle: q.topicTitle,
			stem: q.stem,
			choices: q.choices,
			difficulty: q.difficulty,
			sourcePage: q.sourcePage,
			selectedIndex: null
		});
	}
	return {
		sessionId,
		kind: data.kind,
		status: "active",
		questions,
		score: null
	};
});
var submitAnswer_createServerFn_handler = createServerRpc({
	id: "df726c9f0388c14f95204512341931905e7a70638d7728f1cefddb8e889cda8b",
	name: "submitAnswer",
	filename: "src/lib/apex/actions.ts"
}, (opts) => submitAnswer.__executeServer(opts));
var submitAnswer = createServerFn({ method: "POST" }).validator((input) => input).middleware([authMiddleware]).handler(submitAnswer_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	const q = (await sql`
      select id, course_id, topic_id, session_id, correct_index, explanation, stem, choices_json, difficulty, source_page
      from questions
      where id = ${data.questionId} and user_id = ${context.userId}
    `)[0];
	if (!q) throw new Error("Question not found");
	const already = await sql`
      select id from answers where question_id = ${q.id} and user_id = ${context.userId} limit 1
    `;
	const isCorrect = data.selectedIndex === q.correct_index;
	if (!already[0]) {
		await sql`
        insert into answers (user_id, question_id, course_id, topic_id, selected_index, is_correct)
        values (${context.userId}, ${q.id}, ${q.course_id}, ${q.topic_id}, ${data.selectedIndex}, ${isCorrect})
      `;
		const prev = (await sql`
        select mastery, attempts, correct from topic_mastery
        where user_id = ${context.userId} and topic_id = ${q.topic_id}
      `)[0];
		const nextMastery = updateMastery(prev?.mastery ?? null, isCorrect);
		const attempts = (prev?.attempts ?? 0) + 1;
		const correct = (prev?.correct ?? 0) + (isCorrect ? 1 : 0);
		if (prev) await sql`
          update topic_mastery
          set mastery = ${nextMastery}, attempts = ${attempts}, correct = ${correct}, last_assessed_at = now()
          where user_id = ${context.userId} and topic_id = ${q.topic_id}
        `;
		else await sql`
          insert into topic_mastery (user_id, course_id, topic_id, mastery, attempts, correct, last_assessed_at)
          values (${context.userId}, ${q.course_id}, ${q.topic_id}, ${nextMastery}, ${attempts}, ${correct}, now())
        `;
	}
	return {
		correctIndex: q.correct_index,
		explanation: q.explanation,
		isCorrect
	};
});
var completeQuiz_createServerFn_handler = createServerRpc({
	id: "a4d56df08974866e3b2a2e21a5a102a2370f8af731d517d0e0c0acc59e638abc",
	name: "completeQuiz",
	filename: "src/lib/apex/actions.ts"
}, (opts) => completeQuiz.__executeServer(opts));
var completeQuiz = createServerFn({ method: "POST" }).validator((input) => input).middleware([authMiddleware]).handler(completeQuiz_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	await sql`
      update quiz_sessions set status = 'complete'
      where id = ${data.sessionId} and user_id = ${context.userId}
    `;
	const s = (await sql`
      select id, course_id, kind, status from quiz_sessions
      where id = ${data.sessionId} and user_id = ${context.userId}
    `)[0];
	if (!s) throw new Error("Session not found");
	const questions = (await sql`
      select q.id, q.topic_id, q.stem, q.choices_json, q.correct_index, q.explanation, q.difficulty, q.source_page,
             a.selected_index, a.is_correct, t.title as topic_title
      from questions q
      join topics t on t.id = q.topic_id
      left join answers a on a.question_id = q.id and a.user_id = q.user_id
      where q.session_id = ${data.sessionId} and q.user_id = ${context.userId}
      order by q.id
    `).map((q) => ({
		id: q.id,
		topicId: q.topic_id,
		topicTitle: q.topic_title,
		stem: q.stem,
		choices: parseIdeas(q.choices_json).length ? parseIdeas(q.choices_json) : JSON.parse(q.choices_json),
		difficulty: q.difficulty,
		sourcePage: q.source_page,
		selectedIndex: q.selected_index,
		correctIndex: q.correct_index,
		explanation: q.explanation,
		isCorrect: q.is_correct ?? void 0
	}));
	const answered = questions.filter((q) => q.selectedIndex != null);
	const right = questions.filter((q) => q.isCorrect).length;
	const score = answered.length ? Math.round(right / questions.length * 100) : 0;
	return {
		sessionId: s.id,
		kind: s.kind,
		status: "complete",
		questions,
		score
	};
});
var listenToTopic_createServerFn_handler = createServerRpc({
	id: "892ed889d4a9df2aea5d286a7657bdee2b25f41db8c810eeaddf2c2c07610c5d",
	name: "listenToTopic",
	filename: "src/lib/apex/actions.ts"
}, (opts) => listenToTopic.__executeServer(opts));
var listenToTopic = createServerFn({ method: "POST" }).validator((input) => input).middleware([authMiddleware]).handler(listenToTopic_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	const workspace = await buildWorkspace(sql, context.userId, data.courseId);
	if (!workspace) throw new Error("Course not found");
	const topic = workspace.chapters.flatMap((ch) => ch.topics).find((t) => t.id === data.topicId);
	if (!topic) throw new Error("Topic not found");
	const retrieved = await retrieveStudyContext({
		sql,
		userId: context.userId,
		courseId: data.courseId,
		query: `${topic.title}. ${topic.summary}`,
		topic,
		chapters: workspace.chapters,
		sourceName: workspace.course.sourceName,
		courseTitle: workspace.course.title
	});
	const ideas = topic.keyIdeas;
	const sourceBit = retrieved.selected[0]?.chunk.content ?? "";
	const script = [
		`${topic.title}.`,
		topic.summary,
		ideas.length ? `The ideas to hold onto are: ${ideas.join("; ")}.` : "",
		sourceBit
	].filter(Boolean).join(" ").replace(/\s+/g, " ").slice(0, 880);
	await sql`
      update courses set last_topic_id = ${topic.id}, last_studied_at = now()
      where id = ${data.courseId} and user_id = ${context.userId}
    `;
	const spoken = await speak(script);
	const storedCitations = retrieved.citations.map((c) => ({
		chunkId: c.chunkId,
		sourceName: c.sourceName,
		page: c.page,
		heading: c.heading,
		locator: c.locator,
		label: c.label,
		excerpt: c.excerpt
	}));
	const citeLine = formatCitationLine(retrieved.citations);
	const transcript = citeLine ? `${script}\n\n${citeLine}` : script;
	if (!spoken.ok) return {
		transcript,
		citations: storedCitations,
		audioBase64: null,
		mime: null,
		error: spoken.error
	};
	return {
		transcript,
		citations: storedCitations,
		audioBase64: spoken.audioBase64,
		mime: spoken.mime,
		error: null
	};
});
//#endregion
export { completeQuiz_createServerFn_handler, createCourseFromText_createServerFn_handler, createSampleCourse_createServerFn_handler, deleteCourse_createServerFn_handler, getWorkspace_createServerFn_handler, listCourses_createServerFn_handler, listenToTopic_createServerFn_handler, renameCourse_createServerFn_handler, selectTopic_createServerFn_handler, startQuiz_createServerFn_handler, submitAnswer_createServerFn_handler, tutorChat_createServerFn_handler };
