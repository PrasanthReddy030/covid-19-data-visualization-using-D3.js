var margin2 = { left: 50, right: 20, top: 20, bottom: 50 };
var width2 = 960 - margin2.left - margin2.right;
var height2 = 500 - margin2.top - margin2.bottom;
var xNudge2 = 50;
var yNudge2 = 20;

var parseYear = d3.time.format("%Y").parse; // Updated date parsing function

d3.csv("covid_19_linechart_data_new.csv", function(d) {
    return {
        continent: d.Continent,
        recovered: +d.Recovered || 0,
        confirmed: +d.Confirmed || 1,
        year: +d.Year // Extract just the year value
    };
}, function(error, rows) {
    if (error) {
        console.error("Error loading data:", error);
        return;
    }

    // Filter data for the years 2020 and 2021
    var filteredData = rows.filter(function(d) {
        return d.year === 2020 || d.year === 2021;
    });
    // Check if any data is available after filtering
    if (filteredData.length === 0) {
        console.warn("No data available for the years 2020 and 2021.");
        return;
    }

    // Aggregate data to calculate recovery rate for each year and continent
    var aggregatedData = d3.nest()
        .key(function(d) { return d.continent; })
        .key(function(d) { return d.year; })
        .rollup(function(v) {
            var totalRecovered = d3.sum(v, function(d) { return d.recovered; });
            var totalConfirmed = d3.sum(v, function(d) { return d.confirmed; });
            return totalRecovered / totalConfirmed;
        })
        .entries(filteredData);
  

    var y = d3.scale.linear()
        .domain([0, 1]) // Custom domain for Y-axis (from 0 to 1)
        .range([height2, 0]);

    var x = d3.scale.ordinal()
        .domain(["2020", "2021"]) // Custom domain for X-axis (only 2020 and 2021)
        .rangePoints([0, width2], 1); // Points equally spaced

    var yAxis = d3.svg.axis()
        .orient("left")
        .scale(y)
        .ticks(5) // Set the number of ticks on the Y-axis (0, 0.2, 0.4, 0.6, 0.8, 1.0)
        .tickFormat(d3.format(".1f")); // Format the tick labels with one decimal place

    var xAxis = d3.svg.axis()
        .orient("bottom")
        .scale(x);

    var svg = d3.select("#lineChart").append("svg").attr("id", "svg").attr("height", "100%").attr("width", "100%");
    var chartGroup = svg.append("g").attr("class", "chartGroup").attr("transform", "translate(" + xNudge2 + "," + yNudge2 + ")");

    // Custom color scale with brighter colors
var colorScale = d3.scale.ordinal()
.domain(aggregatedData.map(function(continent) { return continent.key; }))
.range(["#ff0000", "#00ff00", "#0000ff", "#ff00ff", "#ffff00", "#00ffff"]);


    // Manually draw the lines for each continent
aggregatedData.forEach(function(continent) {
    chartGroup.append("path")
        .datum(continent.values)
        .attr("class", "line")
        .attr("d", d3.svg.line()
            .x(function(d) { return x(d.key); }) // Use the year as the x-coordinate
            .y(function(d) { return y(d.values); })
            .interpolate("cardinal")
        )
        .style("stroke", colorScale(continent.key));
});

chartGroup.append("g")
    .attr("class", "axis x")
    .attr("transform", "translate(0," + height2 + ")")
    .call(xAxis);

chartGroup.append("g")
    .attr("class", "axis y")
    .call(yAxis);

// Legend
var legendGroup = chartGroup.append("g")
    .attr("class", "legend")
    .attr("transform", "translate(0," + (height2 + margin2.bottom + 20) + ")");

var legendItemWidth = 150;
var legendItemPadding = 60;

aggregatedData.forEach(function(continent, index) {
    var legendItem = legendGroup.append("g")
        .attr("class", "legend-item")
        .attr("transform", "translate(" + (legendItemWidth * index + legendItemPadding) + ", 0)");

    legendItem.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", 20)
        .attr("y2", 0)
        .style("stroke", colorScale(continent.key));

    legendItem.append("text")
        .attr("x", 30)
        .attr("y", 5)
        .text(continent.key)
        .style("font-size", "13px");
});

chartGroup.append("text")
    .attr("class", "chart-title")
    .attr("x", width2 / 2)
    .attr("y", -margin2.top / 8)
    .attr("text-anchor", "middle")
    .style("font-size", "24px")
    .text("Recovery Rate of a continent for 2020 and 2021");

chartGroup.append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -height2 / 2)
    .attr("y", -margin2.left + 10)
    .attr("text-anchor", "middle")
    .style("font-size", "13px")
    .text("Recovery to Confirmed Ratio");

chartGroup.append("text")
    .attr("class", "axis-label")
    .attr("x", width2 / 2)
    .attr("y", height2 + margin2.bottom - 10)
    .attr("text-anchor", "middle")
    .style("font-size", "13px")
    .text("Year");
});
