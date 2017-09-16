
var svg = d3.select("svg"),
    margin = {top: 20, right: 80, bottom: 30, left: 50},
    width = svg.attr("width") - margin.left - margin.right,
    height = svg.attr("height") - margin.top - margin.bottom,
    g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var color = {
  "Vietnam": "#FED47D",
  "India": "#FABE9C",
  "Thailand": "#F6AB9A"
};


var x = d3.scaleLinear().range([0, width]),
    y = d3.scaleLinear().range([height, 0]),
    z = d3.scaleOrdinal(d3.schemeCategory10);

var line = d3.line()
    .x(function(d) { return x(d.Year); })
    .y(function(d) { return y(d.Rice); });

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
    return d3.axisLeft(y).ticks(7);
  }

  x.domain(d3.extent(data, function(d) { return d.Year; }));

  y.domain([
    d3.min(countries, function(c) { return d3.min(c.values, function(d) { return d.Rice; }); }),
    d3.max(countries, function(c) { return d3.max(c.values, function(d) { return d.Rice; }); })
  ]);

  z.domain(countries.map(function(c) { return c.id; }));
  
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
      .call(d3.axisBottom(x).tickArguments([5, "d"]))

  g.append("g")
      .attr("class", "axis axis--y")
      .attr("transform", "translate(0, -5)")
      .call(d3.axisLeft(y).tickArguments([7]).tickSize(0))
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