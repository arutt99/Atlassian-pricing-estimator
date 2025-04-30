document.addEventListener('DOMContentLoaded', () => {
    // --- Get references to HTML elements ---
    const complexityInput = document.getElementById('complexity');
    const usersInput = document.getElementById('users');
    const adminsInput = document.getElementById('admins');
    const calculateBtn = document.getElementById('calculateBtn');
    const resultDiv = document.getElementById('result');
    const detailsDiv = document.getElementById('calculation-details');

    // --- Configuration Constants ---
    const BASE_FACTOR = 7500; // The foundational cost multiplier

    // --- Helper Functions for Multipliers ---

    /**
     * Determines the multiplier based on the total number of users.
     * @param {number} numUsers - The total number of users.
     * @returns {number} The calculated user tier multiplier.
     */
    function getUserTierMultiplier(numUsers) {
        if (numUsers <= 0) return 0; // Handle invalid input

        if (numUsers <= 25) {       // Tier 1: 1-25 Users
            return 0.70;
        } else if (numUsers <= 100) { // Tier 2: 26-100 Users
            return 0.85;
        } else if (numUsers <= 200) { // Tier 3: 101-200 Users
            return 1.00;
        } else {                      // Tier 4: 201+ Users
            return 1.20;
        }
    }

    /**
     * Determines the multiplier based on the number of trained administrators.
     * Uses explicit ranges for clarity.
     * @param {number} numAdmins - The number of trained administrators.
     * @returns {number} The calculated admin tier multiplier.
     */
    function getAdminTierMultiplier(numAdmins) {
        if (numAdmins <= 0) return 0; // Handle invalid input

        if (numAdmins < 5) { // Tier A: 1-4 Admins
            return 1.05; // Slightly higher cost due to potentially more support needed
        } else if (numAdmins >= 5 && numAdmins < 10) { // Tier B: 5-9 Admins
            return 1.10; // Baseline admin team size
        } else { // Tier C: 10+ Admins (numAdmins will be >= 10 here)
            return 1.20; // <<-- MODIFIED: Increased multiplier for 10+ admins
        }
    }

    // --- Main Calculation Function ---

    /**
     * Calculates the estimated annual maintenance cost based on inputs.
     */
    function calculateMaintenance() {
        // --- Get and Validate Inputs ---
        const complexityScore = parseFloat(complexityInput.value);
        const numUsers = parseInt(usersInput.value, 10);
        const numAdmins = parseInt(adminsInput.value, 10);

        let errorMessage = "";
        // Validate complexity score
        if (isNaN(complexityScore) || complexityScore < 1.0 || complexityScore > 3.0) {
            errorMessage += "Complexity Score must be between 1.0 and 3.0. ";
        }
        // Validate user count
        if (isNaN(numUsers) || numUsers <= 0) {
             errorMessage += "Number of Users must be a positive number. ";
        }
        // Validate admin count
         if (isNaN(numAdmins) || numAdmins <= 0) {
             errorMessage += "Number of Admins must be a positive number. ";
        }

        // If any errors found, display them and stop
        if(errorMessage) {
            resultDiv.textContent = "Error!";
            resultDiv.style.color = 'red'; // Make error message red
            detailsDiv.innerHTML = `<p style="color: red;">${errorMessage}</p>`;
            detailsDiv.style.display = 'block';
            return; // Stop calculation
        }

        // --- Determine Multipliers ---
        const userMultiplier = getUserTierMultiplier(numUsers);
        const adminMultiplier = getAdminTierMultiplier(numAdmins); // Uses the robust version

        // --- Calculate Price ---
        const estimatedPrice = BASE_FACTOR * complexityScore * userMultiplier * adminMultiplier;

        // --- Display Results ---
        resultDiv.textContent = `Estimated Annual Maintenance: ${estimatedPrice.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`;
        resultDiv.style.color = '#28a745'; // Reset to green for successful result

        // --- Display Calculation Details ---
        detailsDiv.innerHTML = `
            <p><strong>Calculation Breakdown:</strong></p>
            <p>Base Factor: ${BASE_FACTOR.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</p>
            <p>Avg. Complexity Score (WACS): ${complexityScore.toFixed(2)}</p>
            <p>User Tier (${numUsers} users): Multiplier = ${userMultiplier.toFixed(2)}</p>
            <p>Admin Tier (${numAdmins} admins): Multiplier = ${adminMultiplier.toFixed(2)}</p>
            <p><strong>Formula:</strong> Base Factor * WACS * User Multiplier * Admin Multiplier</p>
            <p><strong>Result:</strong> ${BASE_FACTOR} * ${complexityScore.toFixed(2)} * ${userMultiplier.toFixed(2)} * ${adminMultiplier.toFixed(2)} = ${estimatedPrice.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</p>
        `;
        detailsDiv.style.display = 'block'; // Make details visible
    }

    // --- Event Listener ---
    // Attach the calculateMaintenance function to the button's click event
    calculateBtn.addEventListener('click', calculateMaintenance);

    // Optional: Perform an initial calculation when the page loads
    // calculateMaintenance();
});