// Assuming d3 and other necessary libraries are already imported

document.addEventListener('DOMContentLoaded', function() {
    const margin = { top: 20, right: 20, bottom: 30, left: 50 },
        width = 1920 - margin.left - margin.right, // Adjusted width
        height = 500 - margin.top - margin.bottom;

    let svgBarChart;
    let originalData;

    // Set up the SVG for the bar chart
    function setupSVG() {
        svgBarChart = d3.select("#bar-chart")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
    }

    // Draw the bar chart with the filtered data
    function drawBarChart(data) {
        // Clear previous chart
        svgBarChart.selectAll("*").remove();

        // Set up scales
        const xScale = d3.scaleBand()
            .range([0, width])
            .padding(0.1)
            .domain(data.map(d => d.year)); // Use 'year' for the x-axis

        const yScale = d3.scaleLinear()
            .range([height, 0])
            .domain([0, d3.max(data, d => d.count)]); // Use 'count' for the y-axis

        // Add x-axis to the SVG
        svgBarChart.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale)) // Assuming xScale is your x-axis scale
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-65)");


        // Add y-axis to the SVG
        svgBarChart.append("g")
            .call(d3.axisLeft(yScale));

        // Bind data and create bars
        svgBarChart.selectAll(".bar")
            .data(data)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", d => xScale(d.year))
            .attr("width", xScale.bandwidth())
            .attr("y", d => yScale(d.count))
            .attr("height", d => height - yScale(d.count))
            .attr("fill", "steelblue"); // Set bar color
    }

    // Function to filter the original dataset based on selections
    function filterData(selectedIssues, selectedDisciplines) {
        return originalData.filter(d => {
            const issueMatch = selectedIssues.length === 0 || selectedIssues.includes(d.issue);
            const disciplineMatch = selectedDisciplines.length === 0 || selectedDisciplines.includes(d.discipline);
            return issueMatch && disciplineMatch;
        });
    }

    // Function to update the chart based on selections
    function updateChart() {
        const selectedIssues = $('#chart-type-select').val(); // Array of selected EDI issues
        const selectedDisciplines = $('#discipline-select').val(); // Array of selected disciplines

        const filteredData = filterData(selectedIssues, selectedDisciplines);
        drawBarChart(filteredData);
    }

    // Initialize chart and multi-selects
    function init() {
        setupSVG();
        d3.json('barChartData.json').then(data => {
            originalData = data;
            setupMultiSelects(data);
            drawBarChart(data);
        }).catch(error => console.error('Error loading the bar chart data:', error));
    }

    // Setup multi-select options and event listeners
    function setupMultiSelects(data) {
        // Clear previous options
        $('#chart-type-select').empty();
        $('#discipline-select').empty();

        // Assuming your data structure has 'issue' and 'discipline' fields
        const issues = [...new Set(data.map(d => d.issue))];
        const disciplines = [...new Set(data.map(d => d.discipline))];

        // Add a default option or placeholder (optional)
        $('#chart-type-select').append(new Option('Select EDI Issues', ''));
        $('#discipline-select').append(new Option('Select Disciplines', ''));

        // Populate issues dropdown
        issues.forEach(issue => {
            $('#chart-type-select').append(new Option(issue, issue));
        });

        // Populate disciplines dropdown
        disciplines.forEach(discipline => {
            $('#discipline-select').append(new Option(discipline, discipline));
        });

        // Initialize Select2
        $(document).ready(function() {
            $('#chart-type-select').select2({ placeholder: 'Select EDI Issues', allowClear: true });
            $('#discipline-select').select2({ placeholder: 'Select Disciplines', allowClear: true });

            // Attach the updateChart function to the change event of the Select2 elements
            $('#chart-type-select').on('change', updateChart);
            $('#discipline-select').on('change', updateChart);
        });
    }

    // Call the init function to set everything up
    init();
});
