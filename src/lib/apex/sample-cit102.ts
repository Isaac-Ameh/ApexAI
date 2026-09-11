import type { SampleCourse } from "./types";

export const SAMPLE_CIT102: SampleCourse = {
  code: "CIT 102",
  title: "Computer Fundamentals",
  sourceName: "CIT 102 — Computer Fundamentals (sample course pack)",
  chapters: [
    {
      title: "Chapter 1 — Introduction to Computing",
      topics: [
        {
          title: "What is a Computer",
          summary:
            "A computer is an electronic device that accepts data, processes it according to instructions, stores results, and produces output. The stored-program idea is what makes a general-purpose machine possible.",
          keyIdeas: [
            "Input–process–output–storage cycle",
            "Hardware vs software",
            "Stored-program concept",
            "Data vs information",
          ],
          chunks: [
            {
              page: 2,
              content:
                "A computer is an electronic device that automatically accepts data as input, processes that data according to a set of instructions called a program, stores intermediate and final results, and produces output that humans or other machines can use. The classic model is often written as IPO: Input, Process, Output, with storage sitting beside the processor so that both data and programs can be kept for later use. Data are raw, unorganised facts — numbers, characters, sensor readings. Information is data that has been processed into a form that is meaningful for a decision. A student registration number is data; a class list sorted by department is information.",
            },
            {
              page: 3,
              content:
                "Two ingredients make a computer useful: hardware and software. Hardware is the physical machinery — the processor, memory, disk, keyboard, screen. Software is the set of instructions that tell the hardware what to do. Without software, hardware is inert. Without hardware, software has nothing to run on. Modern machines follow the stored-program concept introduced by the von Neumann model: both the program and the data it operates on live in the same memory. That is why one physical computer can be a word processor in the morning and a statistical package in the afternoon — you change the program, not the machine.",
            },
          ],
          questions: [
            {
              stem: "In the IPO model of a computer, what is the role of storage?",
              choices: [
                "It replaces the processor when the machine is idle",
                "It holds data and programs so they can be reused later",
                "It is only used to send results to a printer",
                "It converts information back into data",
              ],
              correctIndex: 1,
              explanation:
                "Storage sits beside the processor so both data and programs can be kept. Output devices deliver results; they are not storage.",
              difficulty: "recall",
            },
            {
              stem: "Which statement best captures the stored-program concept?",
              choices: [
                "Programs are wired permanently into the processor",
                "Only data, never programs, may be kept in memory",
                "Programs and data both reside in memory, so the same machine can run different tasks",
                "Software can run without any hardware",
              ],
              correctIndex: 2,
              explanation:
                "The von Neumann stored-program idea is that instructions and data share memory, which is why a general-purpose computer can change jobs by loading a different program.",
              difficulty: "application",
            },
          ],
        },
        {
          title: "Generations of Computers",
          summary:
            "Computer generations are marked by a change in the electronic technology of the processor: vacuum tubes, transistors, integrated circuits, microprocessors, and then pervasive connectivity and AI-era machines.",
          keyIdeas: [
            "Vacuum tubes",
            "Transistors",
            "Integrated circuits",
            "Microprocessors",
            "Size, speed, and reliability trends",
          ],
          chunks: [
            {
              page: 5,
              content:
                "First-generation computers (roughly 1940s–1950s) used vacuum tubes. They were large, generated a great deal of heat, failed often, and were programmed in machine language. ENIAC is the usual classroom example. Second-generation machines replaced tubes with transistors. Transistors were smaller, cooler, more reliable, and cheaper, and this generation saw the rise of assembly language and early high-level languages such as FORTRAN and COBOL. Magnetic tape and early disks became practical storage.",
            },
            {
              page: 6,
              content:
                "Third-generation computers used integrated circuits — many transistors fabricated on a single chip. This cut size and cost again and made operating systems with multiprogramming realistic. Fourth-generation computers are built around the microprocessor, a complete CPU on one chip, which made the personal computer possible. Fifth-generation language in many syllabi points to machines that emphasise networking, very large scale integration, and increasingly, artificial intelligence and natural-language interfaces. Across generations the trend is consistent: smaller, faster, cheaper, more reliable, and easier for non-specialists to use.",
            },
          ],
          questions: [
            {
              stem: "Which technology distinguishes second-generation computers from the first generation?",
              choices: [
                "Vacuum tubes",
                "Microprocessors",
                "Transistors",
                "Quantum circuits",
              ],
              correctIndex: 2,
              explanation:
                "The second generation replaced vacuum tubes with transistors. Microprocessors define the fourth generation.",
              difficulty: "recall",
            },
          ],
        },
        {
          title: "Classification of Computers",
          summary:
            "Computers are classified by size and power (supercomputer, mainframe, mini, micro) and by purpose (general-purpose vs special-purpose).",
          keyIdeas: [
            "Supercomputer and mainframe",
            "Minicomputer and microcomputer",
            "General-purpose vs special-purpose",
            "Workstations and servers",
          ],
          chunks: [
            {
              page: 8,
              content:
                "By size and computational power, a common classroom ranking is: supercomputers, mainframes, minicomputers, and microcomputers. Supercomputers are built for enormous numbers of floating-point calculations — weather modelling, nuclear simulation, large-scale research. Mainframes emphasise high-volume transaction processing and many simultaneous users; banks and university registries still rely on them. Minicomputers historically sat between mainframes and desktops for departmental work. Microcomputers are the machines students actually own: desktops, laptops, tablets, and the computers hiding inside phones. A server is a microcomputer (or a rack of them) whose job is to provide services to other computers on a network.",
            },
            {
              page: 9,
              content:
                "By purpose, a general-purpose computer can be programmed for many different tasks. A special-purpose (dedicated) computer is built or programmed for one job: the controller in an ATM, the processor in a microwave, an ABS unit in a car. Embedded systems are special-purpose computers placed inside a larger device. Most CIT 102 exam questions that mention 'embedded' expect you to connect that word to special-purpose, hidden computers.",
            },
          ],
          questions: [
            {
              stem: "A bank that processes millions of customer transactions a day is most likely using a",
              choices: [
                "Supercomputer for weather modelling",
                "Mainframe for high-volume transaction processing",
                "Single microcomputer with no network",
                "Special-purpose microwave controller",
              ],
              correctIndex: 1,
              explanation:
                "Mainframes are the classic machines for high-volume, many-user transaction processing. Supercomputers are for heavy scientific calculation.",
              difficulty: "application",
            },
          ],
        },
        {
          title: "Applications of Computers",
          summary:
            "Computers are used in education, business, science, government, health, and the home. The same stored-program machine is specialised by software and by the data it is given.",
          keyIdeas: [
            "Education and CBT",
            "Business information systems",
            "Scientific and engineering use",
            "Health and government systems",
          ],
          chunks: [
            {
              page: 11,
              content:
                "In education, computers support computer-based testing (CBT), learning management systems, simulation, and now adaptive study tools. A 100-level student in a Nigerian university typically meets computers both as a subject (CIT 102) and as a medium (CBT exams, course registration portals). In business they run payroll, inventory, accounting, and customer records. Science and engineering use them for modelling, data capture, and control of instruments. Hospitals keep electronic records and imaging. Government uses computers for identity systems, tax, and statistics. None of these applications requires a different kind of CPU — they require different programs, different data, and appropriate security.",
            },
          ],
          questions: [
            {
              stem: "Why can the same personal computer be used for CBT practice and for writing a lab report?",
              choices: [
                "Because hardware is rewritten for each task",
                "Because the stored-program machine changes behaviour when a different program is loaded",
                "Because CBT is a special-purpose embedded system",
                "Because output devices decide the application",
              ],
              correctIndex: 1,
              explanation:
                "A general-purpose stored-program computer changes job by loading different software. The hardware stays the same.",
              difficulty: "analysis",
            },
          ],
        },
      ],
    },
    {
      title: "Chapter 2 — Computer Systems",
      topics: [
        {
          title: "Hardware Components",
          summary:
            "The main hardware subsystems are the CPU, main memory, secondary storage, and input/output devices, joined by buses.",
          keyIdeas: [
            "CPU, memory, storage, I/O",
            "System bus",
            "Peripheral devices",
            "Motherboard",
          ],
          chunks: [
            {
              page: 14,
              content:
                "A computer system is a collection of hardware components that work together. The central processing unit (CPU) executes instructions. Main memory (RAM) holds the program currently running and the data it needs. Secondary storage (SSD, hard disk, flash) keeps programs and files when the power is off. Input devices (keyboard, mouse, scanner, microphone) bring data in. Output devices (screen, printer, speakers) send results out. Some devices, such as a touch screen or a network interface, are both input and output. These parts are physically mounted on or connected to the motherboard and they communicate over buses — electrical pathways for data, addresses, and control signals.",
            },
            {
              page: 15,
              content:
                "It is easy to confuse memory with storage in an exam. Memory (RAM) is fast, volatile, and relatively small; its contents disappear when power is removed. Storage is slower, non-volatile, and large. When a lecturer says 'save your work', they mean copy it from memory onto storage. Cache memory, which sits between the CPU and RAM, is even faster and smaller than RAM and is used to keep recently used instructions and data close to the processor.",
            },
          ],
          questions: [
            {
              stem: "Which statement about RAM is correct?",
              choices: [
                "RAM is non-volatile and keeps files when the computer is off",
                "RAM is volatile main memory that holds the running program",
                "RAM is a type of output device",
                "RAM replaces the system bus",
              ],
              correctIndex: 1,
              explanation:
                "RAM is volatile main memory. Secondary storage is what keeps files after shutdown.",
              difficulty: "recall",
            },
          ],
        },
        {
          title: "The CPU and Memory Hierarchy",
          summary:
            "The CPU contains a control unit, an ALU, and registers. It runs a fetch–decode–execute cycle. The memory hierarchy trades speed against size and cost.",
          keyIdeas: [
            "Control unit, ALU, registers",
            "Fetch–decode–execute",
            "Cache, RAM, secondary storage",
            "Clock speed and cores",
          ],
          chunks: [
            {
              page: 17,
              content:
                "The CPU has three essential parts. The control unit (CU) fetches instructions from memory, decodes them, and coordinates the rest of the machine. The arithmetic logic unit (ALU) performs arithmetic (add, subtract, multiply, divide) and logic (AND, OR, NOT, compare). Registers are tiny, extremely fast storage locations inside the CPU used for the instruction currently in flight, the program counter, and intermediate results. The CPU repeats the fetch–decode–execute cycle for as long as it is running. Clock speed (GHz) is how many of these cycles can be started per second; extra cores let more than one sequence of instructions run at once.",
            },
              {
              page: 18,
              content:
                "The memory hierarchy is a pyramid. At the top: registers, then cache, then RAM, then SSD/disk, then optical or cloud storage. Each step down is larger, cheaper per bit, and slower. A well-designed system keeps the data the CPU is about to need as high in that pyramid as possible. Virtual memory lets a program pretend it has more RAM than is physically installed by paging blocks out to disk; if the machine pages too much, it thrashes and feels frozen. CIT 102 questions often ask you to order these levels from fastest to slowest: registers → cache → RAM → disk.",
            },
          ],
          questions: [
            {
              stem: "During the fetch–decode–execute cycle, which component decodes the instruction?",
              choices: [
                "The ALU",
                "The control unit",
                "The hard disk",
                "The printer",
              ],
              correctIndex: 1,
              explanation:
                "The control unit fetches and decodes instructions. The ALU executes arithmetic and logic operations.",
              difficulty: "recall",
            },
            {
              stem: "From fastest to slowest, which order of the memory hierarchy is correct?",
              choices: [
                "Disk → RAM → cache → registers",
                "RAM → registers → cache → disk",
                "Registers → cache → RAM → disk",
                "Cache → disk → registers → RAM",
              ],
              correctIndex: 2,
              explanation:
                "Registers are fastest, then cache, then RAM, then secondary storage.",
              difficulty: "application",
            },
          ],
        },
        {
          title: "Software: System and Application",
          summary:
            "Software splits into system software (operating system, utilities, language translators) and application software (the programs users actually open to do work).",
          keyIdeas: [
            "Operating system roles",
            "Utilities and translators",
            "Application software",
            "Firmware",
          ],
          chunks: [
            {
              page: 20,
              content:
                "System software operates and controls the computer. The operating system (Windows, macOS, Linux, Android) is the most important piece: it manages processes, memory, files, and devices, and it provides the interface the user sees. Utility programs handle housekeeping — backup, antivirus, disk cleanup. Language translators turn human-readable source code into machine instructions: compilers translate a whole program before it runs; interpreters translate line by line; assemblers translate assembly language. Firmware is software stored in a non-volatile chip (BIOS/UEFI) that starts the machine before the operating system loads.",
            },
            {
              page: 21,
              content:
                "Application software is written for the end user's task: word processors, spreadsheets, browsers, accounting packages, learning apps. A common exam trap is to call Microsoft Word an operating system. It is not — it is an application that depends on an operating system. Another trap is to treat a programming language as application software; the language is a tool, and the translator is system software. Proprietary software is owned and licensed; open-source software publishes its source and is often free to modify under a licence such as GPL.",
            },
          ],
          questions: [
            {
              stem: "Microsoft Word is best classified as",
              choices: [
                "An operating system",
                "Firmware",
                "Application software",
                "A language translator",
              ],
              correctIndex: 2,
              explanation:
                "Word is an application. Windows or macOS would be the operating system it runs on.",
              difficulty: "recall",
            },
          ],
        },
        {
          title: "Input, Output, and Storage",
          summary:
            "Input converts the outside world into binary; output converts binary back. Storage keeps bits persistently. Capacity units and device types are standard exam material.",
          keyIdeas: [
            "Input vs output devices",
            "Primary vs secondary storage",
            "Bit, byte, KB, MB, GB, TB",
            "Magnetic, optical, solid-state",
          ],
          chunks: [
            {
              page: 23,
              content:
                "Input devices digitise human or environmental signals: keyboards encode keystrokes, mice encode movement, scanners encode images, microphones encode sound. Output devices do the reverse: a monitor paints pixels, a printer deposits ink or toner, speakers vibrate air. Secondary storage comes in three physical families. Magnetic (hard disks, tape) stores bits as magnetised regions. Optical (CD, DVD, Blu-ray) stores bits as pits read by a laser. Solid-state (SSD, USB flash, memory cards) stores bits in flash cells with no moving parts, so they are faster and more shock-resistant than spinning disks.",
            },
            {
              page: 24,
              content:
                "Capacity units: a bit is 0 or 1. A byte is 8 bits and typically stores one character in ASCII. 1 kilobyte (KB) is 1024 bytes in the binary convention used in most CIT courses (sometimes 1000 in disk marketing). Then 1024 KB = 1 MB, 1024 MB = 1 GB, 1024 GB = 1 TB. A two-hour compressed video might be 1–2 GB; a typical CIT course PDF is a few megabytes; a single ASCII page is a few kilobytes. Exam questions like to ask how many bits are in 2 bytes (16) or which medium is volatile (RAM, not the disk).",
            },
          ],
          questions: [
            {
              stem: "How many bits are there in 2 bytes?",
              choices: ["2", "8", "16", "32"],
              correctIndex: 2,
              explanation: "One byte is 8 bits, so two bytes are 16 bits.",
              difficulty: "recall",
            },
          ],
        },
      ],
    },
    {
      title: "Chapter 3 — Data Representation",
      topics: [
        {
          title: "Number Systems",
          summary:
            "Computers represent values in binary. Humans also use decimal, and computing uses octal and hexadecimal as compact views of binary.",
          keyIdeas: [
            "Base / radix",
            "Decimal, binary, octal, hexadecimal",
            "Place value",
            "Why machines use binary",
          ],
          chunks: [
            {
              page: 27,
              content:
                "A number system is defined by its base (radix) — the number of different digits it uses — and by place value. Decimal (base 10) uses digits 0–9. Binary (base 2) uses 0 and 1. Octal (base 8) uses 0–7. Hexadecimal (base 16) uses 0–9 and A–F, where A=10, B=11, C=12, D=13, E=14, F=15. In any base, the rightmost digit is the units place (base^0), the next is base^1, then base^2, and so on. So the binary number 1011 means 1×8 + 0×4 + 1×2 + 1×1 = 11 in decimal. The hexadecimal number 2F means 2×16 + 15 = 47 in decimal.",
            },
            {
              page: 28,
              content:
                "Computers use binary because digital electronics are most reliable when they distinguish two voltages: high and low, on and off. Those two states map cleanly onto 1 and 0. Hexadecimal is not a competing machine code; it is a human shorthand. One hex digit represents exactly four bits (a nibble), so the byte 1111 0000 can be written as F0. Octal digits represent three bits. CIT 102 exam questions almost always include at least one conversion among these four bases. Students who only memorise a conversion trick without understanding place value tend to fail the application items.",
            },
          ],
          questions: [
            {
              stem: "The binary number 1011 is equal to which decimal value?",
              choices: ["8", "10", "11", "13"],
              correctIndex: 2,
              explanation: "1011₂ = 8 + 0 + 2 + 1 = 11₁₀.",
              difficulty: "application",
            },
            {
              stem: "Why is hexadecimal commonly used in computing textbooks?",
              choices: [
                "Processors execute hexadecimal digits directly, never binary",
                "One hex digit represents four bits, so bytes are easier to read",
                "Hexadecimal is the only base that can represent negative numbers",
                "Octal cannot represent even numbers",
              ],
              correctIndex: 1,
              explanation:
                "Hex is a compact notation for binary: one hex digit = four bits. The machine still operates in binary.",
              difficulty: "analysis",
            },
          ],
        },
        {
          title: "Number Conversions",
          summary:
            "Convert to decimal by expanding place values. Convert from decimal to another base by repeated division and reading remainders upwards. Binary–hex grouping is the fast path.",
          keyIdeas: [
            "Place-value expansion",
            "Repeated division",
            "Binary to hex by nibbles",
            "Binary to octal by groups of three",
          ],
          chunks: [
            {
              page: 30,
              content:
                "To convert any base into decimal, multiply each digit by its place value and add. Example: 345₈ = 3×64 + 4×8 + 5×1 = 192 + 32 + 5 = 229₁₀. To convert decimal into another base, divide repeatedly by that base and collect remainders. The last remainder is the most significant digit. Example: 13 to binary. 13÷2 = 6 remainder 1; 6÷2 = 3 remainder 0; 3÷2 = 1 remainder 1; 1÷2 = 0 remainder 1. Reading remainders from the bottom gives 1101₂. Check: 8+4+0+1 = 13.",
            },
            {
              page: 31,
              content:
                "Binary to hexadecimal: starting from the right, group bits into fours and replace each group with a hex digit. 1101 1110 0101 → D E 5, so DE5₁₆. Pad the leftmost group with zeros if needed. Binary to octal uses groups of three: 1 101 111 001 → 1 5 7 1 octal. Hex to binary is the reverse: replace each hex digit with its four-bit pattern. A common exam trap is grouping from the left instead of the right, which shifts every place and produces a wrong answer. Another trap is treating A as 10 in binary grouping rather than as 1010.",
            },
            {
              page: 32,
              content:
                "Worked conversion set. 2F₁₆ to decimal: 2×16 + 15 = 47. 47 to binary by division: 47÷2=23 r1; 23÷2=11 r1; 11÷2=5 r1; 5÷2=2 r1; 2÷2=1 r0; 1÷2=0 r1 → 101111₂. Check by grouping: 10 1111 = 2F₁₆. 100101₂ to octal: 100 101 = 45₈. Students who can do these three directions — any base to decimal, decimal to any base, and binary grouping — can handle essentially every CIT 102 number-system conversion item.",
            },
          ],
          questions: [
            {
              stem: "Convert 13₁₀ to binary.",
              choices: ["1101", "1110", "1011", "1001"],
              correctIndex: 0,
              explanation:
                "Repeated division by 2 yields remainders 1,0,1,1 reading upwards as 1101. 8+4+1=13.",
              difficulty: "application",
            },
            {
              stem: "Grouped from the right, 11011110₂ in hexadecimal is",
              choices: ["DE", "D6", "EE", "1E"],
              correctIndex: 0,
              explanation: "1101 1110 = D E, so DE₁₆.",
              difficulty: "application",
            },
            {
              stem: "A student grouped 101101₂ into 10 1101 from the left and wrote 2D₁₆. What went wrong?",
              choices: [
                "Hexadecimal cannot represent this number",
                "Groups of four bits must be formed from the right, padding the left",
                "The binary number is already hexadecimal",
                "They should have used groups of three for hexadecimal",
              ],
              correctIndex: 1,
              explanation:
                "Nibbles are counted from the right. 101101 → 0010 1101 = 2D, which happens to match, but 11011110 grouped from the left would fail. The rule is: pad on the left, group from the right. For 101101₂: 10 1101 is incorrect grouping; 0010 1101 is correct (=2D₁₆).",
              difficulty: "analysis",
            },
          ],
        },
        {
          title: "Binary Arithmetic",
          summary:
            "Binary addition uses 0+0=0, 0+1=1, 1+1=10. Overflow happens when the result does not fit the bit width. Complements are used for subtraction and signed numbers.",
          keyIdeas: [
            "Binary addition table",
            "Carry",
            "Overflow",
            "One's and two's complement",
          ],
          chunks: [
            {
              page: 34,
              content:
                "Binary addition is the same algorithm as decimal addition with a smaller table: 0+0=0, 0+1=1, 1+0=1, 1+1=10 (write 0, carry 1), 1+1+1=11 (write 1, carry 1). Example: 1011 + 0110. Units: 1+0=1. Twos: 1+1=0 carry 1. Fours: 0+1+carry1=0 carry 1. Eights: 1+0+carry1=0 carry 1. So the five-bit sum is 10001, which is 17, and 11+6=17. If the machine only has four bits of storage for the result, that leading 1 is lost — that is overflow. Overflow is not a mysterious error; it is a result that does not fit the allocated width.",
            },
            {
              page: 35,
              content:
                "Subtraction can be done by borrowing, or by adding a complement. One's complement of a binary number flips every bit. Two's complement is one's complement plus one. Two's complement is the dominant representation for signed integers: the high bit is the sign (0 positive, 1 negative), and subtraction becomes addition of the two's complement. Example: 5 is 0101 in four bits. −5 is the two's complement: flip 1010, add 1 → 1011. 0101 + 1011 = 1 0000, and the carried-out 1 leaves 0000, so 5+(−5)=0 as required. CIT 102 typically asks you to form a two's complement and to add two short binary numbers.",
            },
          ],
          questions: [
            {
              stem: "What is 1011₂ + 0110₂?",
              choices: ["10001₂", "1111₂", "1000₂", "11001₂"],
              correctIndex: 0,
              explanation: "11 + 6 = 17 = 10001₂. A 4-bit register would overflow.",
              difficulty: "application",
            },
            {
              stem: "The two's complement of 0101₂ (four bits) is",
              choices: ["1010", "1011", "1101", "0101"],
              correctIndex: 1,
              explanation: "Flip bits to 1010, add 1 → 1011, which represents −5.",
              difficulty: "application",
            },
          ],
        },
        {
          title: "Character Encoding and Data Types",
          summary:
            "Text is stored as numbers via encodings such as ASCII and Unicode. Other data types — integers, reals, booleans, images — are also bit patterns with an agreed interpretation.",
          keyIdeas: [
            "ASCII",
            "Unicode / UTF-8",
            "Integers vs floating point",
            "Bits have meaning only with a type",
          ],
          chunks: [
            {
              page: 37,
              content:
                "A computer does not store the letter A. It stores a bit pattern that we agree means A. ASCII assigns 65 (binary 1000001) to uppercase A, 66 to B, 97 to lowercase a. ASCII is a 7-bit code (often stored in 8 bits) and covers English letters, digits, and punctuation — 128 symbols. It cannot represent Ọ, é, or Chinese characters. Unicode is the larger mapping; UTF-8 is the common encoding that represents ASCII bytes unchanged and uses extra bytes for other characters. That is why a file written as 'plain ASCII' is also valid UTF-8.",
            },
            {
              page: 38,
              content:
                "The same bit pattern can mean different things depending on type. 01000001 is ASCII 'A', the integer 65, or a tiny piece of an image or a sound sample. Types we care about in CIT 102: integers (whole numbers, often two's complement), floating-point (scientific notation for reals), characters, strings (sequences of characters), booleans (true/false, often 1 and 0), and collections of bits for graphics (pixels) and audio (samples). The important sentence to remember: bits are meaningless until the program decides how to interpret them.",
            },
          ],
          questions: [
            {
              stem: "ASCII 'A' is stored as decimal 65. What is a correct implication?",
              choices: [
                "The computer stores the glyph shape of A in RAM as a picture",
                "The integer 65 and the character A can share the same bit pattern",
                "Unicode cannot represent A",
                "65 in binary cannot fit in one byte",
              ],
              correctIndex: 1,
              explanation:
                "Encodings map characters to numbers. 65 is both the integer sixty-five and the ASCII code for A; meaning depends on type.",
              difficulty: "analysis",
            },
          ],
        },
      ],
    },
    {
      title: "Chapter 4 — Problem Solving",
      topics: [
        {
          title: "Algorithms and Flowcharts",
          summary:
            "An algorithm is a finite, unambiguous sequence of steps that solves a problem. Flowcharts and pseudocode are the usual ways to express algorithms before coding.",
          keyIdeas: [
            "Properties of algorithms",
            "Pseudocode",
            "Flowchart symbols",
            "Sequence, selection, iteration",
          ],
          chunks: [
            {
              page: 41,
              content:
                "An algorithm must be finite (it stops), definite (each step is unambiguous), effective (each step is doable), and it must have inputs and at least one output. 'Cook a tasty soup' is not an algorithm; 'add 4 grams of salt, simmer 12 minutes' is closer. Pseudocode writes those steps in structured English: INPUT, IF…THEN…ELSE, WHILE, FOR, OUTPUT. A flowchart draws them: oval for start/end, parallelogram for input/output, rectangle for a process, diamond for a decision, arrows for flow. Every useful algorithm is assembled from three control structures: sequence (do this, then that), selection (choose a path), and iteration (repeat until a condition fails).",
            },
            {
              page: 42,
              content:
                "Example: convert a decimal integer n to binary. Algorithm: if n is 0, output 0 and stop. Otherwise, while n > 0, divide n by 2, record the remainder, replace n with the quotient. When n becomes 0, write the remainders in reverse order. That is exactly the conversion method in Chapter 3, stated as an algorithm. Drawing it as a flowchart would put a diamond on 'n > 0?' and a loop arrow back from 'record remainder'. CIT 102 often asks you to pick the correct flowchart symbol or to identify which control structure a fragment uses.",
            },
          ],
          questions: [
            {
              stem: "Which flowchart symbol is used for a decision?",
              choices: ["Oval", "Rectangle", "Diamond", "Parallelogram"],
              correctIndex: 2,
              explanation:
                "Diamonds are decisions. Ovals start/stop, rectangles process, parallelograms input/output.",
              difficulty: "recall",
            },
          ],
        },
        {
          title: "Programming Fundamentals",
          summary:
            "A program is an algorithm written in a programming language. Variables, data types, control structures, and debugging are the first practical skills.",
          keyIdeas: [
            "Variable and assignment",
            "Syntax vs semantics",
            "Compilation vs interpretation",
            "Debugging",
          ],
          chunks: [
            {
              page: 44,
              content:
                "A program implements an algorithm in a language the translator can accept. A variable is a named location in memory whose value can change. Assignment copies a value into that location. Languages have rules of form (syntax) and meaning (semantics). 'x = = 3' may be a syntax error; 'divide total by count' when count is 0 is a semantic/runtime error. Compilers translate the whole source into machine code before execution. Interpreters execute source more directly, line by line. Many modern languages mix the two. Debugging is the systematic search for the difference between what you meant and what the machine did, using the error message, the current values of variables, and tests on small inputs.",
            },
            {
              page: 45,
              content:
                "Good 100-level practice: write the algorithm first, then the code. Trace a small example by hand (for number conversion, trace n=13). Keep variable names meaningful. Do not confuse the language's operator for equality with assignment. When an exam asks for the output of a short fragment, execute it on paper exactly as the machine would, not as you wish it would. These habits transfer to every later programming course.",
            },
          ],
          questions: [
            {
              stem: "The difference between syntax and semantics is that",
              choices: [
                "Syntax is meaning; semantics is spelling",
                "Syntax is the form of the language; semantics is what a construct means",
                "They are two names for compilation",
                "Semantics only applies to flowcharts",
              ],
              correctIndex: 1,
              explanation:
                "Syntax = form. Semantics = meaning. A program can be syntactically valid and still do the wrong thing.",
              difficulty: "recall",
            },
          ],
        },
      ],
    },
  ],
};
