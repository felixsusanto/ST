
var svg = d3.select("#chart"),
    margin = {top: 20, right: 80, bottom: 30, left: 50},
    width = parseInt(svg.style("width")) - margin.left - margin.right,
    height = parseInt(svg.style("height")) - margin.top - margin.bottom,
    g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var color = {
  "Vietnam": "#FED47D",
  "India": "#FABE9C",
  "Thailand": "#F6AB9A"
};


var xScale = d3.scaleLinear().range([0, width]),
    yScale = d3.scaleLinear().range([height, 0]);

var xAxis = d3.axisBottom(xScale);

var line = d3.line()
    .x(function(d) { return xScale(d.Year); })
    .y(function(d) { return yScale(d.Rice); });

d3.csv("_data/milledRiceEndingStocks.csv", type, function(error, data) {
  if (error) throw error;
  //console.log(data);
  // ex: [{Year: 1990, Vietnam: 0, India: 14500, Thailand: 941},...];
  var countries = data.columns.slice(1).map(function(id) {
    return {
      id: id,
      values: data.map(function(d) {
        return {Year: d.Year, Rice: d[id]};
      })
    };
  });

  // gridlines in y axis function
  function make_y_gridlines() {   
    return d3.axisLeft(yScale).ticks(7);
  }

  xScale.domain(d3.extent(data, function(d) { return d.Year; }));

  yScale.domain([
    d3.min(countries, function(c) { return d3.min(c.values, function(d) { return d.Rice; }); }),
    d3.max(countries, function(c) { return d3.max(c.values, function(d) { return d.Rice; }); })
  ]);

  // add the Y gridlines
  g.append("g")     
      .attr("class", "grid")
      .attr("transform", "translate(-"+margin.left+",0)")
      .call(make_y_gridlines()
        .tickSize(-width-margin.left)
        .tickFormat("")
      )
    .select(".domain")
      .remove();

  g.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis.tickArguments([5, "d"]))

  g.append("g")
      .attr("class", "axis axis--y")
      .attr("transform", "translate(0, -5)")
      .call(d3.axisLeft(yScale).tickArguments([7]).tickSize(0))
    .select(".domain")
      .remove();

  var country = g.selectAll(".country")
    .data(countries)
    .enter().append("g")
      .attr("class", "country");

  country.append("path")
      .attr("class", "line")
      .attr("d", function(d) { return line(d.values); })
      .style("stroke", function(d) { return color[d.id]; })
      .attr("stroke-width", 2);
      
});

function type(d, _, columns) {
  //processing string value to a number
  for (var i = 0, n = columns.length, c; i < n; ++i) d[c = columns[i]] = +d[c];
  return d;
}

// Define responsive behavior
function resize() {
  var width = parseInt(d3.select("#chart").style("width")) - margin.left - margin.right,
  height = parseInt(d3.select("#chart").style("height")) - margin.top - margin.bottom;

  // Update the range of the scale with new width/height
  xScale.range([0, width]);
  yScale.range([height, 0]);

  // Update the axis and text with the new scale
  svg.select('.axis.axis--x')
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);
  var yAxe = d3.axisLeft(yScale);
  svg.select('.axis.axis--y')
      .call(yAxe)
    .select(".domain")
     .remove();

  // Force D3 to recalculate and update the line
  svg.selectAll('.line')
    .attr("d", function(d) { return line(d.values); });

  // Update the tick marks
  xAxis.tickArguments([Math.max(width/75, 2), "d"])
  yAxe.tickArguments([Math.max(height/50, 7)]).tickSize(0);
  console.log(Math.max(height/50, 7));
  //debugger;
};

// Call the resize function whenever a resize event occurs
d3.select(window).on('resize', resize);

// Call the resize function
resize();