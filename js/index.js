
var svg = d3.select("#chart"),
    margin = {top: 20, right: 30, bottom: 30, left: 0},
    width = parseInt(svg.style("width")) - margin.left - margin.right,
    height = parseInt(svg.style("height")) - margin.top - margin.bottom,
    g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")").attr("id", "chart-content"),
    xRangePadding = 50;

var color = {
  "Vietnam": "#FED47D",
  "India": "#FABE9C",
  "Thailand": "#F6AB9A"
};


var xScale = d3.scaleLinear().range([xRangePadding, width]),
    yScale = d3.scaleLinear().range([height, 0]);

var xAxis = d3.axisBottom(xScale);
var yAxis = d3.axisRight(yScale).tickSize(width);

var line = d3.line()
    .x(function(d) { return xScale(d.Year); })
    .y(function(d) { return yScale(d.Rice); });

var countries;

d3.csv("_data/milledRiceEndingStocks.csv", type, function(error, data) {
  if (error) throw error;
  // console.log(data);
  // ex: [{Year: 1990, Vietnam: 0, India: 14500, Thailand: 941},...];
  countries = data.columns.slice(1).map(function(id) {
    return {
      id: id,
      values: data.map(function(d) {
        return {Year: d.Year, Rice: d[id]};
      })
    };
  });

  xScale.domain(d3.extent(data, function(d) { return d.Year; }));
  yScale.domain([
    d3.min(countries, function(c) { return d3.min(c.values, function(d) { return d.Rice; }); }),
    d3.max(countries, function(c) { return d3.max(c.values, function(d) { return d.Rice; }); })
  ]);


  
  // add the axis

  g.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis.tickArguments([5, "d"]))

  g.append("g")
      .attr("class", "axis axis--y")
      .call(customYAxis)
    .select(".domain")
      .remove();

  // add the lines

  var country = g.selectAll(".country")
    .data(countries)
    .enter().append("g")
      .attr("class", "country")
      .attr("class", function(d) { return d.id.toLowerCase() + " country";});

  country.append("path")
      .attr("class", "line")
      .attr("d", function(d) { return line(d.values); })
      .style("stroke", function(d) { return color[d.id]; })
      .attr("stroke-width", 2);

  // Add the scatterplot
  
  var seriesNames = d3.keys(data[0])
    .filter(function(d) { return d !== "x"; });

  // Map the data to an array of arrays of {x, y} tuples.
  var series = seriesNames.map(function(series) {
    return data.map(function(d) {
      return {x: +d.Year, y: +d[series]};
    });
  });

  series.splice(0,1); //remove the year

  // Add the points!

  d3.selectAll(".country")
      .data(series)
      .append("g")
        .attr("class", "scatterplot")
    .selectAll(".point")
      .data(function(d) {return d;})
    .enter().append("circle")
      .attr("class", "point")
      .attr("r", 4)
      .attr("cx", function(d) { return xScale(d.x); })
      .attr("cy", function(d) { return yScale(d.y); });

  // utility function

  function customYAxis(g) {
    g.call(yAxis.ticks(7));
    g.select(".domain").remove();
    g.selectAll(".tick line").attr("stroke", "#ddd");
    g.selectAll(".tick text").attr("x", 4).attr("dy", -4);
  }

  //event listener
  
  svg.on('click', function(d) { 
    var mouse_x = d3.mouse(this)[0];
    var closestYear = Math.round(xScale.invert(mouse_x));
    var yearMinMax = d3.extent(data, function(d) { return d.Year; });
    var index = (closestYear - yearMinMax[0]) < 0 ? 0: (closestYear - yearMinMax[0]);
    index = index > (yearMinMax[1]-yearMinMax[0])? (yearMinMax[1]-yearMinMax[0]): index;

    var t = d3.transition()
        .duration(150)
        .ease(d3.easeLinear);
    
    var format = d3.format(",");
    
    $(".legend .cta .year").text(data[index].Year);
    $(".point.active").removeClass("active");
    $(".country .scatterplot").each(function(id, el) {
      $(this).find(".point").eq(index).addClass("active");
    });

    var targetX = $(".point.active").attr("cx");

    if(!$("#vertical-line").length) {
      d3.select("#chart-content")
        .append("line")
          .lower()
          .attr("id", "vertical-line")
          .attr("x1", targetX)
          .attr("y1", "0")
          .attr("x2", targetX)
          .attr("y2", height)
      ;
    } else {
      d3.select("#vertical-line")
        .transition(t)
        .attr("x1", targetX)
        .attr("x2", targetX)
      ;
    }

    for(var i = 0; i < countries.length; i++) {
      var country = countries[i].id;
      $(".legend .cta ." + country.toLowerCase() + " .rice").text(format(+data[index][country]));
    }

  });

  // Define responsive behavior
  function resize() {
    width = parseInt(d3.select("#chart").style("width")) - margin.left - margin.right;
    height = parseInt(d3.select("#chart").style("height")) - margin.top - margin.bottom;

    // Update the range of the scale with new width/height
    xScale.range([xRangePadding, width]);
    yScale.range([height, 0]);

    // Update the axis and text with the new scale
    svg.select('.axis.axis--x')
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);
    
    svg.select('.axis.axis--y');

    // Force D3 to recalculate and update the line
    svg.selectAll('.line')
      .attr("d", function(d) { return line(d.values); });

    svg.selectAll('.point')
      .attr("cx", function(d) { return xScale(d.x); })
      .attr("cy", function(d) { return yScale(d.y); });

    // Update the tick marks
    xAxis.tickArguments([Math.max(width/75, 2), "d"])
    //yAxe.tickArguments([Math.max(height/50, 7)]).tickSize(0);
    if($("#vertical-line").length) {
      d3.select("#vertical-line")
        .attr("x1", $(".point.active").attr("cx"))
        .attr("x2", $(".point.active").attr("cx"))
    }
  };

  // Call the resize function whenever a resize event occurs
  d3.select(window).on('resize', resize);

  // Call the resize function
  resize();

   
});


function type(d, _, columns) {
  //processing string value to a number
  for (var i = 0, n = columns.length, c; i < n; ++i) d[c = columns[i]] = +d[c];
  return d;
}

