d3.csv("covid_19_data.csv", function(error, covidData) {
  if (error) throw error;
  
  // Filter the data to include only 'Confirmed' and 'Recovered' cases
  var filteredData = covidData.map(function(d) {
    return {
      continent: d.Continent,
      confirmed: parseInt(d.Confirmed, 10),
      recovered: parseInt(d.Recovered, 10)
    };
  });

  // Group the data by continent and calculate the total confirmed and recovered cases for each continent
  var dataByContinent = d3.nest()
    .key(function(d) { return d.continent; })
    .rollup(function(values) {
      return {
        confirmed: d3.sum(values, function(d) { return d.confirmed; }),
        recovered: d3.sum(values, function(d) { return d.recovered; })
      };
    })
    .entries(filteredData);

  // Extract the continents and their respective confirmed and recovered cases
  var data = dataByContinent.filter(function(d) { return d.key !== ''; }).map(function(d) {
    return {
      continent: d.key,
      confirmed: d.values.confirmed,
      recovered: d.values.recovered
    };
  });

  // Filter out data points with missing or NaN values for 'confirmed' and 'recovered'
  data = data.filter(function(d) {
    return !isNaN(d.confirmed) && !isNaN(d.recovered);
  });

  var colors = ["orange", "blue"];

  var margin1 = 50;
  var width1 = 600;
  var height1 = 300;

  var svg1 = d3.select("#my_dataviz")
    .append("svg")
    .attr("width", width1 + margin1 + 40)
    .attr("height", height1 + margin1 + 80)
    .append("g")
    .attr("transform", "translate(" + (margin1 + 30) / 2 + "," + (margin1 / 2 + 40) + ")");

  var xScale = d3.scale.ordinal()
    .domain(data.map(function(d) { return d.continent; }))
    .rangeRoundBands([0, width1], 0.1); // Adjust the padding between bars here (0.1)

  var yScale = d3.scale.linear()
    .domain([0, d3.max(data, function(d) { return d.confirmed + d.recovered; })])
    .range([height1, 0]);

  var yAxis = d3.svg.axis()
    .scale(yScale)
    .orient("left")
    .ticks(6)
    .tickSize(-width1, 0, 0)
    .tickFormat(function(d) { return "＄" + (d / 1000000000).toFixed(1) + "B"; }); // Display y-axis values in billions

  var xAxis1 = d3.svg.axis()
    .scale(xScale)
    .orient("bottom");

  svg1.append("g")
    .attr("class", "y axis")
    .call(yAxis);

  svg1.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height1 + ")")
    .call(xAxis1);

    // Add a title for the chart
    svg1.append("text")
      .attr("x", width1 / 2)
      .attr("y", -20)
      .attr("text-anchor", "middle")
      .style("font-family", "Helvetica")
      .style("font-size", 18)
      .text("Confirmed cases and Recoveries in Continents");

  // X label
  svg1.append('text')
    .attr('x', width1 / 2)
    .attr('y', height1 + 45)
    .attr('text-anchor', 'middle')
    .style('font-family', 'Helvetica')
    .style('font-size', 16)
    .text('Continent');

  // Y label
  svg1.append('text')
    .attr('text-anchor', 'middle')
    .attr('transform', 'translate(-30,' + height1 / 2 + ')rotate(-90)')
    .style('font-family', 'Helvetica')
    .style('font-size', 14)
    .text('Cases (in billions)'); // Adjusted Y-axis label

// Add a legend for the colors
var legend = svg1.append("g")
  .attr("transform", "translate(-40," + (height1 + 40) + ")"); // Move the legend below the X-axis

var legendData = [
  { label: "Confirmed", color: "orange" },
  { label: "Recovered", color: "blue" }
];

var legendRectSize = 18;
var legendSpacing = 120; // Adjust the spacing between legend items here

var legends = legend.selectAll(".legends")
  .data(legendData)
  .enter()
  .append("g")
  .attr("class", "legends")
  .attr("transform", function(d, i) {
    var horz = i * legendSpacing;
    var vert = 0;
    return "translate(" + horz + "," + vert + ")";
  });

legends.append("rect")
  .attr("width", legendRectSize)
  .attr("height", legendRectSize)
  .attr("fill", function(d) { return d.color; });

legends.append("text")
  .attr("x", legendRectSize + 5) // Adjust the horizontal spacing between color and label
  .attr("y", legendRectSize - 5) // Adjust the vertical spacing between color and label
  .text(function(d) { return d.label; })
  .style("font-family", "Helvetica")
  .style("font-size", 12);
  
 
  var stack = d3.layout.stack()(["confirmed", "recovered"].map(function(type) {
    return data.map(function(d) {
      return { x: d.continent, y: d[type] };
    });
  }));

  var groups = svg1.selectAll(".bars")
    .data(stack)
    .enter().append("g")
    .attr("class", "bars")
    .style("fill", function(d, i) { return colors[i]; });

  var rect = groups.selectAll("rect")
    .data(function(d) { return d; })
    .enter()
    .append("rect")
    .attr("x", function(d) { return xScale(d.x); })
    .attr("y", function(d) { return yScale(d.y0 + d.y); })
    .attr("height", function(d) { return yScale(d.y0) - yScale(d.y0 + d.y); })
    .attr("width", xScale.rangeBand());

});
