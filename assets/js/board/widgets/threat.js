/* --- THREAT WATCH (CISA Known Exploited Vulnerabilities) ---
   Ported from Semester_Break_Hubv2.html 557-659 (fetchJsonWithTimeout shared from news.js).
   Only change: the immediate fetch/setInterval calls moved into start(). */
import { fetchJsonWithTimeout } from './news.js';

const CISA_KEV_URL = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json";
const CISA_KEV_GITHUB_URL = "https://raw.githubusercontent.com/cisagov/kev-data/develop/known_exploited_vulnerabilities.json";
const CISA_KEV_PROXY_URL = "https://api.allorigins.win/raw?url=" + encodeURIComponent(CISA_KEV_URL);
const GITHUB_ADVISORY_URL = "https://api.github.com/advisories?per_page=5&sort=published&direction=desc";
let threatItems = [];
let threatIndex = 0;
let threatSource = "CISA KEV";

function shortThreatText(value, maxLength) {
    const text = String(value || "").trim();
    return text.length > maxLength ? text.slice(0, maxLength - 3) + "..." : text;
}

function showThreatItem() {
    const cveEl = document.getElementById("threat-cve");
    const titleEl = document.getElementById("threat-title");
    const addedEl = document.getElementById("threat-added");
    const countEl = document.getElementById("threat-count");
    if (!cveEl || !titleEl || !addedEl || !countEl) return;

    if (!threatItems.length) {
        cveEl.textContent = "Threat Feed";
        titleEl.textContent = "Live feed is temporarily unavailable. Retrying automatically.";
        addedEl.textContent = "CISA KEV";
        countEl.textContent = "Retrying";
        return;
    }

    const item = threatItems[threatIndex % threatItems.length];
    const vendorProduct = [item.vendorProject, item.product].filter(Boolean).join(" ");
    const title = vendorProduct || item.vulnerabilityName || "Known exploited vulnerability";
    const ransomware = item.knownRansomwareCampaignUse === "Known" ? "Ransomware: Known" : "Active exploit";

    cveEl.textContent = item.cveID || "CVE update";
    titleEl.textContent = shortThreatText(title, 58);
    addedEl.textContent = item.dateAdded ? "Added " + item.dateAdded : ransomware;
    countEl.textContent = threatItems.totalCount ? threatItems.totalCount + " tracked" : threatSource;
    threatIndex++;
}

function useCisaThreatData(data) {
    const vulnerabilities = Array.isArray(data.vulnerabilities) ? data.vulnerabilities : [];
    threatItems = vulnerabilities
        .slice()
        .sort((a, b) => String(b.dateAdded || "").localeCompare(String(a.dateAdded || "")))
        .slice(0, 5);
    threatItems.totalCount = vulnerabilities.length;
    threatSource = "CISA KEV";
}

function useGithubThreatData(data) {
    const advisories = Array.isArray(data) ? data : [];
    threatItems = advisories.map(item => ({
        cveID: item.cve_id || item.ghsa_id || "Security advisory",
        vendorProject: item.vulnerabilities && item.vulnerabilities[0] ? item.vulnerabilities[0].package.name : item.type,
        product: item.severity ? item.severity.toUpperCase() : "",
        vulnerabilityName: item.summary,
        knownRansomwareCampaignUse: "",
        dateAdded: item.published_at ? item.published_at.slice(0, 10) : ""
    })).slice(0, 5);
    threatItems.totalCount = 0;
    threatSource = "GitHub Advisory";
}

function fetchThreatData() {
    document.getElementById("threat-cve").textContent = "Updating...";
    document.getElementById("threat-title").textContent = "Checking public cyber threat feeds";

    fetchJsonWithTimeout(CISA_KEV_GITHUB_URL, 9000)
    .then(useCisaThreatData)
    .catch(() => fetchJsonWithTimeout(CISA_KEV_URL, 6000).then(useCisaThreatData))
    .catch(() => fetchJsonWithTimeout(CISA_KEV_PROXY_URL, 9000).then(useCisaThreatData))
    .catch(() => fetchJsonWithTimeout(GITHUB_ADVISORY_URL, 9000).then(useGithubThreatData))
    .then(() => {
        threatIndex = 0;
        showThreatItem();
    })
    .catch(() => {
        threatItems = [];
        threatSource = "CISA KEV";
        showThreatItem();
    });
}

export function start() {
    fetchThreatData();
    setInterval(showThreatItem, 8000);
    setInterval(fetchThreatData, 1800000);
}
