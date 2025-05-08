document.addEventListener('DOMContentLoaded', () => {
    const teamNameInput = document.getElementById('team-name-input');
    const addTeamBtn = document.getElementById('add-team-btn');
    const teamSelect = document.getElementById('team-select');
    const deleteTeamBtn = document.getElementById('delete-team-btn');
    const estimatorTbody = document.getElementById('estimator-tbody');
    const miscHoursInput = document.getElementById('misc-hours-input');
    const totalHoursDisplay = document.getElementById('total-hours-display');
    const viewSummaryBtn = document.getElementById('view-summary-btn');
    const clearAllBtn = document.getElementById('clear-all-btn');
    const backToLandingBtn = document.getElementById('back-to-landing-btn');

    // Custom phase hour inputs specific to Jira Software Estimator
    const discoveryHoursInput = document.getElementById('sw-discovery-hours-input');
    const releaseHoursInput = document.getElementById('sw-release-hours-input');
    const warrantyHoursInput = document.getElementById('sw-warranty-hours-input');

    // Map phase keys to their respective input elements
    const customPhaseInputs = {
        'sw-discovery': discoveryHoursInput,
        'sw-production-release': releaseHoursInput,
        'sw-warranty': warrantyHoursInput
    };

    const LOCAL_STORAGE_KEY = 'estimatorJiraSoftwareData'; // Unique key for this estimator
    const LAST_SELECTED_TEAM_KEY = 'lastSelectedJiraSoftwareTeam'; // Unique key

    let teamsData = {}; // { teamName: { selections: {}, customPhaseHours: {}, miscHours: 0, totalHours: 0 } }
    let currentTeam = null;

    function loadTeams() {
        const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedData) {
            try {
                teamsData = JSON.parse(storedData);
                if (typeof teamsData !== 'object' || teamsData === null) teamsData = {};
                Object.values(teamsData).forEach(team => { // Ensure customPhaseHours exists
                    if (!team.customPhaseHours) {
                        team.customPhaseHours = {
                            'sw-discovery': 0,
                            'sw-production-release': 0,
                            'sw-warranty': 0
                        };
                    }
                });
            } catch (e) {
                console.error("Error parsing localStorage data for Jira Software:", e);
                teamsData = {};
            }
        }
        populateTeamSelector();
        const lastTeam = localStorage.getItem(LAST_SELECTED_TEAM_KEY);
        if (lastTeam && teamsData[lastTeam]) {
            teamSelect.value = lastTeam;
            selectTeam(lastTeam);
        } else if (Object.keys(teamsData).length > 0) {
            const firstTeam = Object.keys(teamsData)[0];
            teamSelect.value = firstTeam;
            selectTeam(firstTeam);
        } else {
            resetFormToDefaults();
            calculateTotalHours();
        }
    }

    function populateTeamSelector() {
        teamSelect.innerHTML = '<option value="">-- Select a Project/Team --</option>';
        Object.keys(teamsData).forEach(teamName => {
            const option = document.createElement('option');
            option.value = teamName;
            option.textContent = teamName;
            teamSelect.appendChild(option);
        });
    }

    addTeamBtn.addEventListener('click', () => {
        const teamName = teamNameInput.value.trim();
        if (teamName && !teamsData[teamName]) {
            teamsData[teamName] = {
                selections: {},
                customPhaseHours: { // Initialize with current values or defaults
                    'sw-discovery': parseInt(discoveryHoursInput.value, 10) || 30,
                    'sw-production-release': parseInt(releaseHoursInput.value, 10) || 25,
                    'sw-warranty': parseInt(warrantyHoursInput.value, 10) || 20
                },
                miscHours: 0,
                totalHours: 0
            };
            currentTeam = teamName;
            populateTeamSelector();
            teamSelect.value = teamName;
            resetFormForNewTeam(); // Clears selections, keeps custom inputs as they are
            loadTeamData(teamName); // Load the newly created data
            calculateTotalHours();
            saveData();
            teamNameInput.value = '';
            localStorage.setItem(LAST_SELECTED_TEAM_KEY, currentTeam);
        } else if (teamsData[teamName]) {
            alert('Project/Team name already exists.');
        } else {
            alert('Please enter a valid Project/Team name.');
        }
    });

    deleteTeamBtn.addEventListener('click', () => {
        const teamToDelete = teamSelect.value;
        if (!teamToDelete) {
            alert("Please select a Project/Team to delete.");
            return;
        }
        if (confirm(`Are you sure you want to delete "${teamToDelete}"?`)) {
            delete teamsData[teamToDelete];
            if (currentTeam === teamToDelete) {
                currentTeam = null;
                localStorage.removeItem(LAST_SELECTED_TEAM_KEY);
                resetFormToDefaults();
            }
            populateTeamSelector();
            teamSelect.value = "";
            calculateTotalHours();
            saveData();
        }
    });

    teamSelect.addEventListener('change', () => selectTeam(teamSelect.value));

    function selectTeam(teamName) {
        if (teamName && teamsData[teamName]) {
            currentTeam = teamName;
            loadTeamData(teamName);
            localStorage.setItem(LAST_SELECTED_TEAM_KEY, currentTeam);
        } else {
            currentTeam = null;
            resetFormToDefaults();
            localStorage.removeItem(LAST_SELECTED_TEAM_KEY);
        }
        calculateTotalHours();
    }

    function loadTeamData(teamName) {
        if (!teamsData[teamName]) return;
        const teamData = teamsData[teamName];
        clearSelectionsVisually();

        for (const phaseKey in teamData.selections) {
            const value = teamData.selections[phaseKey];
            const row = estimatorTbody.querySelector(`tr[data-phase-key="${phaseKey}"]`);
            if (row) {
                const cell = row.querySelector(`td.selectable-cell[data-value="${value}"]`);
                if (cell) cell.classList.add('selected');
            }
        }

        // Load custom phase hours
        for (const phaseKey in teamData.customPhaseHours) {
            if (customPhaseInputs[phaseKey]) {
                customPhaseInputs[phaseKey].value = teamData.customPhaseHours[phaseKey];
            }
        }
        miscHoursInput.value = teamData.miscHours || 0;
    }

    function clearSelectionsVisually() {
        estimatorTbody.querySelectorAll('.selectable-cell.selected')
            .forEach(cell => cell.classList.remove('selected'));
    }

    function resetFormToDefaults() {
        clearSelectionsVisually();
        discoveryHoursInput.value = 30; // Default from PDF/request
        releaseHoursInput.value = 25; // Default from PDF/request
        warrantyHoursInput.value = 20; // Default from PDF/request
        miscHoursInput.value = 0;
        teamNameInput.value = '';
    }
    
    function resetFormForNewTeam() {
        clearSelectionsVisually();
        // Custom phase inputs are handled by addTeamBtn based on current values on screen
        miscHoursInput.value = 0;
    }

    function calculateTotalHours() {
        let total = 0;
        Object.values(customPhaseInputs).forEach(input => {
            total += parseInt(input.value, 10) || 0;
        });

        estimatorTbody.querySelectorAll('.selectable-cell.selected').forEach(cell => {
            const row = cell.closest('tr');
            if (row && row.hasAttribute('data-hours')) {
                const hoursData = JSON.parse(row.getAttribute('data-hours'));
                const selectedValue = cell.getAttribute('data-value');
                if (hoursData && hoursData[selectedValue] !== undefined) {
                    total += hoursData[selectedValue];
                }
            }
        });

        total += parseInt(miscHoursInput.value, 10) || 0;
        totalHoursDisplay.textContent = total;

        if (currentTeam && teamsData[currentTeam]) {
            teamsData[currentTeam].totalHours = total;
        }
        return total;
    }

    estimatorTbody.addEventListener('click', (event) => {
        const clickedCell = event.target.closest('.selectable-cell');
        if (!clickedCell) return;
        if (!currentTeam) {
            alert("Please add or select a Project/Team.");
            return;
        }
        const row = clickedCell.closest('tr');
        const phaseKey = row.getAttribute('data-phase-key');
        const value = clickedCell.getAttribute('data-value');
        if (!phaseKey) return;

        teamsData[currentTeam].selections[phaseKey] = value;
        row.querySelectorAll('.selectable-cell').forEach(cell => cell.classList.remove('selected'));
        clickedCell.classList.add('selected');
        calculateTotalHours();
        saveData();
    });

    Object.entries(customPhaseInputs).forEach(([phaseKey, inputElement]) => {
        inputElement.addEventListener('input', () => {
            if (!currentTeam) {
                 calculateTotalHours(); // Update display even if no team for immediate feedback
                return;
            }
            teamsData[currentTeam].customPhaseHours[phaseKey] = parseInt(inputElement.value, 10) || 0;
            calculateTotalHours();
            saveData();
        });
    });

    miscHoursInput.addEventListener('input', () => {
        if (!currentTeam) {
            calculateTotalHours(); // Update display
            return;
        }
        teamsData[currentTeam].miscHours = parseInt(miscHoursInput.value, 10) || 0;
        calculateTotalHours();
        saveData();
    });

    function saveData() {
        if (currentTeam && teamsData[currentTeam]) {
            teamsData[currentTeam].totalHours = calculateTotalHours();
        }
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(teamsData));
    }

    viewSummaryBtn.addEventListener('click', () => {
        saveData();
        if (Object.keys(teamsData).length === 0) {
            alert("No Project/Team data entered yet.");
            return;
        }
        // Navigate to a new summary page specific to Jira Software or a generic one
        // For now, let's assume a jira-software-summary.html page
        window.location.href = 'jira-software-summary.html';
    });

    clearAllBtn.addEventListener('click', () => {
        if (confirm("Are you sure you want to delete ALL Jira Software estimation data?")) {
            teamsData = {};
            currentTeam = null;
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            localStorage.removeItem(LAST_SELECTED_TEAM_KEY);
            populateTeamSelector();
            teamSelect.value = "";
            resetFormToDefaults();
            calculateTotalHours();
        }
    });

    backToLandingBtn.addEventListener('click', () => {
        window.location.href = 'index.html'; // Assumes your landing page is index.html
    });

    loadTeams();
});