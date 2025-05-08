document.addEventListener('DOMContentLoaded', () => {
    const summaryBody = document.getElementById('summary-body');
    const backBtn = document.getElementById('back-to-estimator-btn');
    const backToLandingBtnSummary = document.getElementById('back-to-landing-btn-summary');
    const grandTotalHoursEl = document.getElementById('grand-total-hours');
    const grandTotalCostEl = document.getElementById('grand-total-cost');

    const LOCAL_STORAGE_KEY = 'estimatorJiraSoftwareData'; // Must match the script.js key
    const HOURLY_RATE = 250; // Assuming same rate

    // More specific display names for Jira Software phases
    const phaseDisplayNames = {
        "sw-discovery": "Initiation & Discovery",
        "sw-setup": "Jira Software Setup",
        "sw-confluence": "Confluence",
        "sw-board-workflow": "Board & Workflow",
        "sw-plans": "Plans Config",
        "sw-adv-reporting": "Adv. Reporting",
        "sw-automation": "Automation",
        "sw-devops-int": "DevOps Integration",
        "sw-data-migration": "Data Migration",
        "sw-third-party-apps": "3rd Party Apps",
        "sw-extra-training": "Extra Training",
        "sw-production-release": "Production Release",
        "sw-warranty": "Warranty",
    };

    const scoreDisplayMapping = {
        "na": "N/A",
        "cs1": "Complexity 1",
        "cs2": "Complexity 2",
        "cs3": "Complexity 3",
    };

    function updateGrandTotals(hours, cost) {
        grandTotalHoursEl.textContent = hours;
        grandTotalCostEl.textContent = formatCurrency(cost);
    }

    function loadAndDisplaySummary() {
        summaryBody.innerHTML = '';
        let grandTotalHours = 0;
        let grandTotalCost = 0;

        const storedDataString = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (!storedDataString) {
            displayMessage("No Jira Software estimation data found.");
            updateGrandTotals(0, 0);
            return;
        }

        let teamsData;
        try {
            teamsData = JSON.parse(storedDataString);
            if (typeof teamsData !== 'object' || teamsData === null) throw new Error("Parsed data invalid.");
        } catch (error) {
            displayMessage("Error loading estimation data.");
            updateGrandTotals(0, 0);
            return;
        }

        const teamNames = Object.keys(teamsData);
        if (teamNames.length === 0) {
            displayMessage("No projects/teams found in the estimation data.");
            updateGrandTotals(0, 0);
            return;
        }

        teamNames.forEach(teamName => {
            const team = teamsData[teamName];
            if (!team || typeof team.selections !== 'object' || typeof team.customPhaseHours !== 'object') return;

            const row = document.createElement('tr');
            const nameCell = document.createElement('td');
            nameCell.textContent = teamName;
            row.appendChild(nameCell);

            const detailsCell = document.createElement('td');
            detailsCell.innerHTML = `<div class="summary-details">${generateDetailsList(team)}</div>`;
            row.appendChild(detailsCell);

            const hoursCell = document.createElement('td');
            const totalHours = team.totalHours || 0;
            hoursCell.textContent = totalHours;
            grandTotalHours += totalHours;
            row.appendChild(hoursCell);

            const costCell = document.createElement('td');
            const totalCost = totalHours * HOURLY_RATE;
            costCell.textContent = formatCurrency(totalCost);
            grandTotalCost += totalCost;
            row.appendChild(costCell);
            summaryBody.appendChild(row);
        });
        updateGrandTotals(grandTotalHours, grandTotalCost);
    }

    function generateDetailsList(teamData) {
        const details = [];
        if (teamData.customPhaseHours) {
            for (const phaseKey in teamData.customPhaseHours) {
                const hours = teamData.customPhaseHours[phaseKey];
                if (hours > 0) { // Only show if hours are entered
                    const phaseName = phaseDisplayNames[phaseKey] || phaseKey;
                    details.push(`${phaseName}: ${hours} hrs`);
                }
            }
        }
        for (const phaseKey in teamData.selections) {
            const selectedValue = teamData.selections[phaseKey];
            if (selectedValue !== "na") { // Only show if not N/A
                const phaseName = phaseDisplayNames[phaseKey] || phaseKey;
                const scoreDisplay = scoreDisplayMapping[selectedValue] || selectedValue;
                details.push(`${phaseName}: ${scoreDisplay}`);
            }
        }
        if (teamData.miscHours && teamData.miscHours > 0) {
            details.push(`Misc Hours: ${teamData.miscHours}`);
        }
        return details.length > 0 ? `<ul>${details.map(item => `<li>${item}</li>`).join('')}</ul>` : '--';
    }

    function displayMessage(message) {
        summaryBody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px;">${message}</td></tr>`;
    }

    function formatCurrency(amount) {
        return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    backBtn.addEventListener('click', () => {
        window.location.href = 'jira-software-estimator.html';
    });
    
    backToLandingBtnSummary.addEventListener('click', () => {
        window.location.href = 'index.html'; // Assumes your landing page is index.html
    });

    loadAndDisplaySummary();
});