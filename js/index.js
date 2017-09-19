
var svg = d3.select("#chart"),
    margin = {top: 20, right: 30, bottom: 30, left: 30},
    width = parseInt(svg.style("width")) - margin.left - margin.right,
    height = parseInt(svg.style("height")) - margin.top - margin.bottom,
    g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")").attr("id", "chart-content"),
    xRangePadding = 20;

var color = {
  "Vietnam": "#FED47D",
  "India": "#FABE9C",
  "Thailand": "#F6AB9A"
};


var xScale = d3.scaleLinear().range([xRangePadding, width]),
    yScale = d3.scaleLinear().range([height, 0]);

var xAxis = d3.axisBottom(xScale);
var yAxis = d3.axisLeft(yScale);

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
  yScale.domain([0,
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
      .attr("stroke-width", 2)
      .on("click", function() {
        d3.event.stopPropagation();
        $(".line.active").removeClass("active");
        $(this).closest("svg").addClass("line-active");
        $(this).addClass("active");
      });

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
        .lower()
    .selectAll(".point")
      .data(function(d) {return d;})
    .enter().append("circle")
      .attr("class", "point")
      .attr("r", 4)
      .attr("cx", function(d) { return xScale(d.x); })
      .attr("cy", function(d) { return yScale(d.y); })
  ;

  

  //event listener
  
  svg.on('click', function(d) { 
    var mouse_x = d3.mouse(this)[0] - margin.left;
    var closestYear = Math.round(xScale.invert(mouse_x));
    var yearMinMax = d3.extent(data, function(d) { return d.Year; });
    var index = (closestYear - yearMinMax[0]) < 0 ? 0: (closestYear - yearMinMax[0]);
    index = index > (yearMinMax[1]-yearMinMax[0])? (yearMinMax[1]-yearMinMax[0]): index;

    var t = d3.transition()
        .duration(150)
        .ease(d3.easeLinear);
    
    var format = d3.format(",.1f");

    $(".svg-chart-wrapper").addClass("details");
    
    
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

    d3.select(".tooltip")
      .transition(t)
      .attr("style", function() {
          var ttWidth = parseInt(d3.select(this).style("width"));
          if(ttWidth + (+targetX) > width) {
            return "right: "+ (width - parseInt(targetX,10) + 35) +"px;"; 
          } else {
            return "left: "+ (+targetX + 35) +"px;"; 
          }
          
        })
      ;

    for(var i = 0; i < countries.length; i++) {
      var country = countries[i].id;
      $(".tooltip ." + country.toLowerCase() + " .val").text(format(+data[index][country]));
      $(".legend .cta ." + country.toLowerCase() + " .rice").text(format(+data[index][country]));
    }
    // year
    $(".legend .cta .year, .tooltip .tt-year").text(data[index].Year);

    //reset tooltip to viewable
    $(".tooltip .tt-meta li").removeClass("hide");
    //removing non-active cta from tooltip
    $("[data-cta]:not(.active)").each(function() {
      var targetClass = $(this).attr("class");
      $(".tooltip ."+targetClass).addClass("hide");
    });

    if($(this).hasClass("line-active")) {
      $(".line.active").removeClass("active");
      $(this).removeClass("line-active");
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
    svg.select('.axis.axis--y')
      .call(customYAxis);

    // Force D3 to recalculate and update the line
    svg.selectAll('.line')
      .attr("d", function(d) { return line(d.values); });

    svg.selectAll('.point')
      .attr("cx", function(d) { return xScale(d.x); })
      .attr("cy", function(d) { return yScale(d.y); });

    // Update the tick marks
    xAxis.tickArguments([Math.max(width/75, 2), "d"])
    //yAxis.tickArguments([Math.max(height/50, 2)]);

    if($("#vertical-line").length) {
      d3.select("#vertical-line")
        .attr("x1", $(".point.active").attr("cx"))
        .attr("x2", $(".point.active").attr("cx"))
        .attr("y1", "0")
        .attr("y2", height);
    }
  };

  // Call the resize function whenever a resize event occurs
  d3.select(window).on('resize', resize);

  // Call the resize function
  resize();

   
});

// utility function

function customYAxis(g) {
  g.call(yAxis.tickSize(-width).tickArguments([Math.max(height/50, 3)]));
  g.select(".domain").remove();
  g.selectAll(".tick line")
    .attr("stroke", "#ddd")
    .attr("x1", - margin.left)
  ;
  g.selectAll(".tick text").attr("x", 4).attr("dy", -4);
}


function type(d, _, columns) {
  //processing string value to a number
  for (var i = 0, n = columns.length, c; i < n; ++i) d[c = columns[i]] = +d[c];
  return d;
}

$(".legend .cta a").on("click", function() {
  var requireUpdate = true;
  var activeCountry = [];
  var classname;

  //check if it's the last active country 
  if($(this).closest('li').hasClass('active')) {
    //this is attempt to turn off a line graph
    //check if it's the only remaining active
    if($(".legend .active").length == 1) {
      console.log('you cant switch off the last country!');
      requireUpdate = false; //flag to not update the view
    } else {
      $(this).closest("li").toggleClass("active");
      classname = $(this).closest("li").attr("class");
      d3.select("."+classname +".country").transition()
        .style("opacity", 0)
        .attr("transform", "translate(0,"+(2*height)+")")
      ;
    }
  } else {
    //this is turning on line graph
    classname = $(this).closest("li").attr("class");
    d3.select("."+classname +".country").transition()
      .style("opacity", 1)
      .attr("transform", "translate(0,0)")
    ;
    $(this).closest("li").toggleClass("active");
  }
  
  if(requireUpdate) {
    $(".legend .active").each(function() {
      activeCountry.push($(this).attr("class").replace(/active/g, '').trim());
    });
    updateDomain(activeCountry);
    resetLegend();
    sortingCta.call(this);
  }
  
});

function resetLegend() {
  $(".legend .cta .year, .legend .cta .rice").text('');
  $(".svg-chart-wrapper").removeClass("details");
}

function updateDomain(countriesArr) {
  var maxRice = d3.max(countries, function(d) {
    function memberOf(country) {
      return country == d.id.toLowerCase();
    }
    if(countriesArr.some(memberOf)) {
      return d3.max(d.values, function(r) {
        return r.Rice;
      });
    }
  });
  yScale.domain([0,maxRice]);
  d3.select(".axis.axis--y").transition().call(customYAxis);
  d3.selectAll(".line").transition().attr("d", function(d) { return line(d.values); });
  d3.selectAll(".point").transition()
    .attr("cx", function(d) { return xScale(d.x); })
    .attr("cy", function(d) { return yScale(d.y); });
}

function sortingCta() {
  var array = [];
  $("[data-cta]").each(function(id, el) {
    var res = '';
    res += ($(el).hasClass('active')) ? '0' : '1';
    res += $(el).data('cta');
    array.push(res);
    $(this).attr('data-sort-val', res);
  });

  var arrAnimation = array.slice().sort();
  var viewportWidth = $(window).width();
  var duration = viewportWidth > 450 ? 300 : 0;
  if(viewportWidth > 450) {
    $("[data-cta]").each(function(id, el) {
      var $li = $(el).closest('li');
      var currIndex = $("[data-cta]").index($li[0]);
      var sortIndex = arrAnimation.findIndex(function(val) {
        return val == $li.attr('data-sort-val');
      });
      var direction = sortIndex - currIndex;
      $li.addClass('transit');
      $li.css('transform', 'translateY('+(direction*100)+'%)');

    });
  }

  setTimeout(function() {
    $("[data-cta]").removeClass('transit').removeAttr('style');
    d3.selectAll("[data-cta]")
      .data(array)
      .sort(function(a, b) {
          return a - b;
        })
    ;
  }, duration)
  
}