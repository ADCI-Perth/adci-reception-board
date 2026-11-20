// Static hub content for the non-teaching modes. Copied verbatim from the old boards.

// Standard_reception_hub_tuition_free_week.html CONFIG.breakTips (uncommented entries, lines 390-402).
export const tuitionTips = [
    { title: "LIGHT REVIEW", desc: "Keep concepts fresh with short, low-pressure revision sessions.", icon: "🧠", color: "#3f51b5" },
    { title: "MOVE YOUR BODY", desc: "Go for a walk, gym session, or beach run to reset your focus.", icon: "🏃‍♂️", color: "#2e7d32" },
    { title: "SLEEP RESET", desc: "Catch up on quality sleep—memory and focus depend on it.", icon: "😴", color: "#6a1b9a" },
    { title: "STUDY SPOTS", desc: "Try a new study location like a café or quiet campus corner.", icon: "☕", color: "#00838f" },
    { title: "GROUP CHECK-IN", desc: "Meet with classmates to review tricky topics together.", icon: "👥", color: "#c62828" },
    { title: "DIGITAL DETOX", desc: "Take a break from screens to reduce stress and recharge.", icon: "📴", color: "#455a64" },
    { title: "PRACTICE MODE", desc: "Run through past exam questions under timed conditions.", icon: "📝", color: "#f9a825" }
];

// Exam_Week_Hub.html CONFIG.breakTips (uncommented entries, lines 387-392).
export const examRules = [
    { title: "NO PHONES ALLOWED", desc: "Mobile devices must be switched off and stored in your bag during all examinations.", icon: "📵", color: "#002b55" },
    { title: "ARRIVE EARLY", desc: "Be seated at least 10 minutes before your exam starts. Late entry may be refused.", icon: "⏰", color: "#ed6c02" },
    { title: "STUDENT ID REQUIRED", desc: "You must present your student ID card to sit any examination. No exceptions.", icon: "🪪", color: "#0056b3" },
    { title: "OPEN BOOK POLICY", desc: "Check your unit outline — some units permit notes. Confirm with your trainer if unsure.", icon: "📖", color: "#2e7d32" },
    { title: "ACADEMIC INTEGRITY", desc: "Any attempt to cheat or plagiarise will result in an automatic fail and disciplinary action.", icon: "⚖️", color: "#6200ea" },
    { title: "SUPPORT AVAILABLE", desc: "IT Support and Student Services are open 9AM–5PM. Reach out if you need any assistance.", icon: "🙋", color: "#00838f" }
];

// Semester_Break_Hubv2.html CONFIG.quotes (lines 455-461).
export const quotes = [
    "“The secret of getting ahead is getting started.” — Mark Twain",
    "“Believe you can and you’re halfway there.” — Theodore Roosevelt",
    "“It always seems impossible until it’s done.” — Nelson Mandela",
    "“Preparation is the key to success.” — Alexander Graham Bell",
    "“You’ve studied hard. Trust yourself. You’ve got this.”"
];

// Semester-break visitor lines (2026 redesign; the mockup's "free tea and coffee" line is not used).
export const welcomeLines = [
    { icon: "👋", lead: "Visiting us?", text: "Please take a seat — a team member will be with you shortly." },
    { icon: "📝", lead: "Enrolling?", text: "Ask at reception for course information." }
];

// Christmas thank-you lines; year = year the closure block starts.
export function christmasLines(year) {
    return [
        `Thank you to every student, lecturer and visitor who made ${year} a great year.`,
        `Enjoy a safe and happy holiday season — see you in ${year + 1}!`
    ];
}
