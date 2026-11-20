/* --- DATA SCIENCE PULSE (GitHub Public API) ---
   Ported from Semester_Break_Hubv2.html 660-717 (fetchJsonWithTimeout shared from news.js).
   Only change: the immediate fetch/setInterval calls moved into start(). */
import { fetchJsonWithTimeout } from './news.js';

const DATA_SCIENCE_REPOS = [
    { owner: "pandas-dev", repo: "pandas", label: "pandas" },
    { owner: "scikit-learn", repo: "scikit-learn", label: "scikit-learn" },
    { owner: "pytorch", repo: "pytorch", label: "PyTorch" },
    { owner: "tensorflow", repo: "tensorflow", label: "TensorFlow" }
];
let dataPulseItems = [];
let dataPulseIndex = 0;

function compactNumber(value) {
    return new Intl.NumberFormat("en-AU", { notation: "compact", maximumFractionDigits: 1 }).format(value || 0);
}

function showDataPulseItem() {
    if (!dataPulseItems.length) return;
    const item = dataPulseItems[dataPulseIndex % dataPulseItems.length];
    const updated = item.updated_at ? new Date(item.updated_at).toLocaleDateString("en-AU", { day: "numeric", month: "short" }) : "GitHub API";

    document.getElementById("sidebar-ds-title").textContent = item.label + " activity";
    document.getElementById("sidebar-ds-summary").textContent = "Live open-source signal from a major data science project.";
    document.getElementById("sidebar-ds-stars").textContent = compactNumber(item.stargazers_count);
    document.getElementById("sidebar-ds-forks").textContent = compactNumber(item.forks_count);
    document.getElementById("sidebar-ds-issues").textContent = compactNumber(item.open_issues_count);
    document.getElementById("sidebar-ds-updated").textContent = "Updated " + updated;
    dataPulseIndex++;
}

function fetchDataSciencePulse() {
    Promise.all(DATA_SCIENCE_REPOS.map(repo =>
        fetchJsonWithTimeout(`https://api.github.com/repos/${repo.owner}/${repo.repo}`, 9000)
            .then(data => ({ ...data, label: repo.label }))
    ))
    .then(items => {
        dataPulseItems = items;
        dataPulseIndex = 0;
        showDataPulseItem();
    })
    .catch(() => {
        dataPulseItems = [{
            label: "Data Science",
            stargazers_count: 0,
            forks_count: 0,
            open_issues_count: 0,
            updated_at: ""
        }];
        document.getElementById("sidebar-ds-title").textContent = "Data science activity";
        document.getElementById("sidebar-ds-summary").textContent = "Live project data is temporarily unavailable.";
        document.getElementById("sidebar-ds-stars").textContent = "--";
        document.getElementById("sidebar-ds-forks").textContent = "--";
        document.getElementById("sidebar-ds-issues").textContent = "--";
        document.getElementById("sidebar-ds-updated").textContent = "Retrying";
    });
}

export function start() {
    fetchDataSciencePulse();
    setInterval(showDataPulseItem, 10000);
    setInterval(fetchDataSciencePulse, 1800000);
}
