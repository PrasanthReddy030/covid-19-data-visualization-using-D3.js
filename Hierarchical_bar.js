

var margin = {top: 200, right: 200, bottom: 50, left: 200},
    width = 1600 - margin.left - margin.right,
    height = 800 - margin.top - 150;

var x = d3.scale.linear()
    .range([0, width]);

var barHeight = 20;

var color = d3.scale.ordinal()
    .range(["steelblue", "#ccc"]);

var duration = 750,
    delay = 25;

// Function to display the message
function displayMessage(message) {
    const messageFontSize = 14; // Adjust the font size as needed
    const messageMargin = 8; // Margin from the bottom and left of the chart

    svg.append("text")
      .attr("class", "message")
      .attr("x", messageMargin) // Adjust the x position to move the message to the left
      .attr("y", height - messageMargin) // Adjust the y position to move the message to the bottom
      .attr("text-anchor", "start")
      .style("font-size", messageFontSize) // Set the font size using the style attribute
      .text(message);
  }
  
  // Function to remove the message
  function removeMessage() {
    svg.select(".message").remove();
  }

let buttonType = "confirmed";

// Function to set the initial active state for the buttons
function setInitialActiveState() {
    var buttons = document.querySelectorAll("#button-container button");
    buttons.forEach(function (button) {
        if (button.getAttribute("id") === buttonType + "-button") {
            button.classList.add("active");
        } else {
            button.classList.remove("active");
        }
    });
}

// Wait for the DOM to load before setting the initial active state
document.addEventListener("DOMContentLoaded", function () {
    setInitialActiveState();
});

// Function to update the data based on the selected button
function updateData(type) {
    buttonType = type;

    // Remove the 'active' class from all buttons
    var buttons = document.querySelectorAll("#button-container button");
    buttons.forEach(function(button) {
        button.classList.remove("active");
    });

    // Add the 'active' class to the clicked button
    var activeButton = document.getElementById(type + "-button");
    activeButton.classList.add("active");

    d3.json("output.json", function(error, root) {
        if (error) throw error;

        partition.nodes(root);
        x.domain([0, root.value]).nice();
        down(root, 0);
        displayMessage("Click a blue bar to drill down, or click the background to go back up.");
    });
}

var partition = d3.layout.partition()
    .value(function(d) { return d[buttonType]; });

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("top")
    .tickFormat(function(d) {
        // Format the tick values in billions (suffix "B")
        return d / 1e9 + "B";
    });

var svg = d3.select("#chart-container").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


svg.append("rect")
    .attr("class", "background")
    .attr("width", width)
    .attr("height", height)
    .on("click", up);

svg.append("g")
    .attr("class", "x axis");

svg.append("g")
    .attr("class", "y axis")
  .append("line")
  .attr("y1", height) // Reduce the length of the y-axis line by changing this value


var heading = "Covid-19 Summary of Continents and Countries";
var xAxisLabel = "Cases in Billions";
var yAxisLabel = "Continents";

// Append heading
svg.append("text")
    .attr("class", "chart-heading")
    .attr("x", width / 2)
    .attr("y", -margin.top / 1.5) // Adjust this value to position the heading closer to the top
    .style("text-anchor", "middle")
    .style("font-size", "36px") // Increase the font size for the heading
    .text(heading);

// Append x-axis label
svg.append("text")
    .attr("class", "axis-label")
    .attr("x", width / 2)
    .attr("y", -margin.top / 6) // Adjust this value to position the label closer to the x-axis
    .style("text-anchor", "middle")
    .style("font-size", "15px") // Increase the font size
    .text(xAxisLabel);

// Append y-axis label
svg.append("text")
    .attr("class", "axis-label")
    .attr("x", -margin.left / 3) // Adjust this value to position the label closer to the y-axis
    .attr("y", -margin.top / 2) // Adjust this value to position the label properly
    .attr("transform", "rotate(-90)")
    .style("text-anchor", "middle")
    .style("font-size", "16px") // Increase the font size
    .text(yAxisLabel);

d3.json("output.json", function(error, root) {
  if (error) throw error;

  partition.nodes(root);
  x.domain([0, root.value]).nice();
  down(root, 0);
  displayMessage("Click a blue bar to drill down, or click the background to go back up.");
});

function down(d, i) {
  if (!d.children || this.__transition__) return;
 // Sort the children nodes based on their values in descending order.
 d.children.sort(function(a, b) {
    return b.value - a.value;
  });
  
  // Show only the top 15 bars (if there are more than 15 children).
  var top15Children = d.children.slice(0, 15);

  // Calculate the end duration for the transition.
  var end = duration + top15Children.length * delay;

  // Mark any currently-displayed bars as exiting.
  var exit = svg.selectAll(".enter")
      .attr("class", "exit");

  // Entering nodes immediately obscure the clicked-on bar, so hide it.
  exit.selectAll("rect").filter(function(p) { return p === d; })
      .style("fill-opacity", 1e-6);

  // Enter the new bars for the clicked-on data.
  // Per above, entering bars are immediately visible.
  var enter = bar({children: top15Children})
      .attr("transform", stack(i))
      .style("opacity", 1);

  // Have the text fade-in, even though the bars are visible.
  // Color the bars as parents; they will fade to children if appropriate.
  enter.select("text").style("fill-opacity", 1e-6);
  enter.select("rect").style("fill", color(true));

  // Update the x-scale domain.
  x.domain([0, d3.max(top15Children, function(d) { return d.value; })]).nice();

  // Update the x-axis.
  svg.selectAll(".x.axis").transition()
      .duration(duration)
      .call(xAxis);

  // Transition entering bars to their new position.
  var enterTransition = enter.transition()
      .duration(duration)
      .delay(function(d, i) { return i * delay; })
      .attr("transform", function(d, i) { return "translate(0," + barHeight * i * 1.2 + ")"; });

  // Transition entering text.
  enterTransition.select("text")
      .style("fill-opacity", 1);

  // Transition entering rects to the new x-scale.
  enterTransition.select("rect")
      .attr("width", function(d) { return x(d.value); })
      .style("fill", function(d) { return color(!!d.children); });

  // Transition exiting bars to fade out.
  var exitTransition = exit.transition()
      .duration(duration)
      .style("opacity", 1e-6)
      .remove();

  // Transition exiting bars to the new x-scale.
  exitTransition.selectAll("rect")
      .attr("width", function(d) { return x(d.value); });

  // Rebind the current node to the background.
  svg.select(".background")
      .datum(d)
    .transition()
      .duration(end);

  d.index = i;
}

function up(d) {
  if (!d.parent || this.__transition__) return;
  var end = duration + d.children.length * delay;

  // Mark any currently-displayed bars as exiting.
  var exit = svg.selectAll(".enter")
      .attr("class", "exit");

  // Enter the new bars for the clicked-on data's parent.
  var enter = bar(d.parent)
      .attr("transform", function(d, i) { return "translate(0," + barHeight * i * 1.2 + ")"; })
      .style("opacity", 1e-6);

  // Color the bars as appropriate.
  // Exiting nodes will obscure the parent bar, so hide it.
  enter.select("rect")
      .style("fill", function(d) { return color(!!d.children); })
    .filter(function(p) { return p === d; })
      .style("fill-opacity", 1e-6);

  // Update the x-scale domain.
  x.domain([0, d3.max(d.parent.children, function(d) { return d.value; })]).nice();

  // Update the x-axis.
  svg.selectAll(".x.axis").transition()
      .duration(duration)
      .call(xAxis);

  // Transition entering bars to fade in over the full duration.
  var enterTransition = enter.transition()
      .duration(end)
      .style("opacity", 1);

  // Transition entering rects to the new x-scale.
  // When the entering parent rect is done, make it visible!
  enterTransition.select("rect")
      .attr("width", function(d) { return x(d.value); })
      .each("end", function(p) { if (p === d) d3.select(this).style("fill-opacity", null); });

  // Transition exiting bars to the parent's position.
  var exitTransition = exit.selectAll("g").transition()
      .duration(duration)
      .delay(function(d, i) { return i * delay; })
      .attr("transform", stack(d.index));

  // Transition exiting text to fade out.
  exitTransition.select("text")
      .style("fill-opacity", 1e-6);

  // Transition exiting rects to the new scale and fade to parent color.
  exitTransition.select("rect")
      .attr("width", function(d) { return x(d.value); })
      .style("fill", color(true));

  // Remove exiting nodes when the last child has finished transitioning.
  exit.transition()
      .duration(end)
      .remove();

  // Rebind the current parent to the background.
  svg.select(".background")
      .datum(d.parent)
    .transition()
      .duration(end);
}

// Creates a set of bars for the given data node, at the specified index.
function bar(d) {
  var bar = svg.insert("g", ".y.axis")
      .attr("class", "enter")
      .attr("transform", "translate(0,5)")
    .selectAll("g")
      .data(d.children)
    .enter().append("g")
      .style("cursor", function(d) { return !d.children ? null : "pointer"; })
      .on("click", down);

  bar.append("text")
      .attr("x", -6)
      .attr("y", barHeight / 2)
      .attr("dy", ".35em")
      .style("text-anchor", "end")
      .text(function(d) { return d.name; });

  bar.append("rect")
      .attr("width", function(d) { return x(d.value); })
      .attr("height", barHeight);

  return bar;
}

// A stateful closure for stacking bars horizontally.
function stack(i) {
  var x0 = 0;
  return function(d) {
    var tx = "translate(" + x0 + "," + barHeight * i * 1.2 + ")";
    x0 += x(d.value);
    return tx;
  };
}


