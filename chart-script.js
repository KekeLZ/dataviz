document.addEventListener('DOMContentLoaded', function() {
    const margin = {top: 20, right: 20, bottom: 30, left: 50};
    const width = 960 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    let svgSankey, sankey, sankeyData;
    let cumulativeTotals = {};

    async function initSankeyChart() {
        svgSankey = d3.select("#sankey")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        sankey = d3.sankey()
            .nodeWidth(36)
            .nodePadding(40)
            .size([width, height]);

        try {
            const response = await fetch('sankeyData.json');
            sankeyData = await response.json();
            console.log(sankeyData); // Add this line to log the data


            // Initialize cumulative totals for each target node
            sankeyData.nodes.forEach(node => {
                cumulativeTotals[node.name] = {value: 0, nodes: []};
            });

            // Start the animation
            animateSankey();
        } catch (error) {
            console.error('Error loading the Sankey chart data:', error);
            displayErrorMessage('An error occurred while loading the Sankey chart data. Please try again later.');
        }
    }

    function displayErrorMessage(message) {
        const errorMessageContainer = document.createElement('div');
        errorMessageContainer.style.color = 'red';
        errorMessageContainer.textContent = message;
        document.body.appendChild(errorMessageContainer);
    }

    function updateSankey(yearlyData) {
        const graph = {
            nodes: sankeyData.nodes.map(d => ({...d})),
            links: yearlyData.map(d => {
                // Update cumulative totals
                const targetNodeName = sankeyData.nodes[d.target].name;
                cumulativeTotals[targetNodeName].value += d.value;
                // Add nodes for the dots that will move
                cumulativeTotals[targetNodeName].nodes.push({...d, value: d.value});
                return {...d, value: cumulativeTotals[targetNodeName].value};
            })
        };
        sankey(graph);

        // Bind the new data to the links
        const link = svgSankey.selectAll(".link")
            .data(graph.links, d => `${d.source.name}-${d.target.name}-${d.year}`);

        link.enter()
            .append("path")
            .attr("class", "link")
            .merge(link)
            .transition()
            .duration(750)
            .attr("d", d3.sankeyLinkHorizontal())
            .style("stroke-width", d => Math.max(1, d.width));

        link.exit().remove();

        // Update nodes with new positions and values
        const node = svgSankey.selectAll(".node")
            .data(graph.nodes, d => d.name);

        const nodeEnter = node.enter()
            .append("g")
            .attr("class", "node");

        nodeEnter.append("rect")
            .merge(node.select("rect"))
            .transition()
            .duration(750)
            .attr("height", d => d.y1 - d.y0)
            .attr("width", sankey.nodeWidth())
            .style("fill", d => d.color);

        nodeEnter.append("text")
            .merge(node.select("text"))
            .attr("x", -6)
            .attr("y", d => (d.y1 - d.y0) / 2)
            .attr("dy", "0.35em")
            .attr("text-anchor", "end")
            .text(d => `${d.name} (${cumulativeTotals[d.name].value})`)
            .filter(d => d.x0 < width / 2)
            .attr("x", 6 + sankey.nodeWidth())
            .attr("text-anchor", "start");

        node.exit().remove();

// Create and move dots for each case published that year
        graph.links.forEach(link => {
            const movingDots = svgSankey.selectAll(".dot")
                .data(cumulativeTotals[link.targetNodeName].nodes, d => d.id);

            const enterDots = movingDots.enter()
                .append("circle")
                .attr("class", "dot")
                .attr("r", 5) // radius of dots
                .style("fill", link.color);

            movingDots.merge(enterDots)
                .transition()
                .duration(750)
                .attr("cx", d => sankey.nodeWidth() / 2 + d.x0)
                .attr("cy", d => d.y0 + (d.y1 - d.y0) / 2)
                .on("end", function () {
                    // Remove the dots once they've reached their destination
                    d3.select(this).remove();
                });

            movingDots.exit().remove();
        });
    }

    function animateSankey() {
        const years = Array.from(new Set(sankeyData.links.map(link => link.year))).sort(d3.ascending);
        let currentYear = years[0]; // Start at the earliest year

        function updateYear() {
            const yearlyData = sankeyData.links.filter(link => link.year === currentYear);
            if (yearlyData && yearlyData.length > 0) {
                updateSankey(yearlyData);
            } else {
                console.error('Yearly data is empty or undefined for year:', currentYear);
            }

            updateSankey(yearlyData);
            currentYear++;
            if (currentYear > years[years.length - 1]) {
                clearInterval(animationInterval); // Stop the animation after the last year
            }
        }

        const animationInterval = setInterval(updateYear, 1000); // Update every second
        updateYear(); // Start the animation immediately
    }


// Initialize the chart
    initSankeyChart();
});