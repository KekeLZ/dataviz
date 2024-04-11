const fs = require('fs');
const path = require('path');

// Helper function to get the year from a date string
function getYearFromDate(dateString) {
    const date = new Date(dateString);
    return date.getFullYear();
}

// Main function to read the data, aggregate it, and write the aggregatedData.json
function aggregateData() {
    // Read the existing data.json file
    const dataFilePath = path.resolve(__dirname, 'data.json');
    const rawData = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));

    // Create an object to hold the count of cases per year
    const countsByYear = {};

    // Loop over each entry in the raw data and increment the count for the corresponding year
    rawData.forEach(entry => {
        const year = getYearFromDate(entry['Original Publication Date']);
        if (!countsByYear[year]) {
            countsByYear[year] = 0;
        }
        countsByYear[year]++;
    });

    // Convert the countsByYear object into an array of objects with year and count properties
    const aggregatedData = Object.keys(countsByYear).map(year => ({
        year: parseInt(year, 10),
        count: countsByYear[year]
    }));

    // Write the aggregated data to aggregatedData.json
    const aggregatedDataPath = path.resolve(__dirname, 'aggregatedData.json');
    fs.writeFileSync(aggregatedDataPath, JSON.stringify(aggregatedData, null, 2), 'utf8');

    console.log('Data has been aggregated and saved to aggregatedData.json');
}

// Run the aggregation function
aggregateData();
