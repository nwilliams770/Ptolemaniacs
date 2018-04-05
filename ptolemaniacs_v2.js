// Philadelphoi

var width =1920,
  height = 1000;

var svg = d3.select("#chart")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

var force = d3.forceSimulation()
// preshipped force, simulates charged molecules where each repels or attracts until stable state
  .force("charge", d3.forceManyBody().strength(-2000).distanceMin(100).distanceMax(500))
  .force("link", d3.forceLink().id(function (d) { return d.index }))
  .force("center", d3.forceCenter(width / 2, height / 2))
  .force("y", d3.forceY(0.001))
  .force("x", d3.forceX(0.001));

// load the data, some people call json param graph instead
// best to load data as func in case any errors
d3.json("data.json", function (error, json) {
  if (error) throw error;
  force
    .nodes(json.nodes)
    .force("link")
    .links(json.links);

// add directional markers
// taken from Mike Bostock example

// **** PLAY WITH ARGS HERE **** 
  svg.append("defs").selectAll("marker")
    .data(["child"])      // Different link/path types can be defined here
    .enter().append("marker")    // This section adds in the arrows
    .attr("id", function(d) { return d;})
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 15)
    .attr("refY", -1.5)
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("orient", "auto")
    .append("path")
    .attr("d", "M0,-5L10,0L0,5")
    .attr("fill", "red");

// add links, color based on type
  var link = svg.append("g").selectAll('.link')
    .data(json.links)
    .enter()
    .append("line")
    .attr("class", function (d) { return "link " + d.type; })
    .attr("marker-end", function (d) {
      if (d.type === 'child') {
        return "url(#child)";
      }
    })
    .style("stroke", function (d) {
      switch (d.type) {
        case "child":
          return "red";
        case "marriage":
          return "blue";
        case "corule":
          return "green";
      }
    });
  const header = document.querySelector('#label');

// add nodes, color based on generation
  var node = svg.selectAll(".node")
    .data(json.nodes)
    .enter().append("g")
    .attr("class", "node")
    .style('fill', 'white')
    .on('dblclick', connectedNodes)
    .call(d3.drag()
      .on("start", dragBegin)
      .on("drag", dragging)
      .on("end", dragEnded))
    .on("mouseover", function(d) {
      header.innerHTML = d.name;
      var circle = d3.select(this).select('circle');
      circle.attr('data-color', `${circle.style("fill")}`)
      circle.style('fill', 'yellowgreen');
      })
    .on("mouseleave", function (d) {
      var circle = d3.select(this).select('circle');
      circle.style('fill', `${circle.attr("data-color")}`);
  });

// add the actual circles to the nodes
  var circle = node.append('circle')
    .attr('r', 6)
    // .style("fill", function (d) {
    // switch (d.generation) {
    //   case 1:
    //     return "0052d4";
    //   case 2:
    //     return "0d61d9";
    //   case 3:
    //     return "1f77df";
    //   case 4:
    //     return "3490e7";
    //   case 5:
    //     return "49a9ee";
    //   case 6:
    //     return "5dbff5";
    //   case 7:
    //     return "6bcdf8";
    //   case 8:
    //     return "79d8fb";
    //   case 9:
    //     return "84dffb";
    //   case 10:
    //     return "96e9fb";
    //   case 11:
    //     return "9cebfb";
  //   // }
  // });

// add labels to nodes, hover effect done in css
  var label = node.append("text")
    .attr("dy", ".35em")
    .attr("dx", "1em")
    .attr("class", "text")
    .text(function (d) { return d.name; });


// our tick function, 
  force.on("tick", function () {
    link.attr("x1", function (d) {
      return d.source.x;
    })
      .attr("y1", function (d) {
        return d.source.y;
      })
      .attr("x2", function (d) {
        return d.target.x;
      })
      .attr("y2", function (d) {
        return d.target.y;
      });
    node.attr("transform", function (d) {
      return "translate(" + d.x + "," + d.y + ")";
    });
  });

// drag and drop funcs
// *** RENAME THESE
  function dragBegin(d) {
    if (!d3.event.active) force.alphaTarget(0.3).restart();
    d.fx = d.x, d.fy = d.y;
  }

  function dragging(d) {
    d.fx = d3.event.x, d.fy = d3.event.y;
  }

  function dragEnded(d) {
    if (!d3.event.active) force.alphaTarget(0);
    d.fx = null, d.fy = null;
  }


// NODE HIGHLIGHTING 
  var toggleConnections, toggleMurders = 1;

  //Create an array logging what is connected to what
  var linkedByIndex = {};
  for (i = 0; i < json.nodes.length; i++) {
    linkedByIndex[i + "," + i] = 1;
  };
  

  json.links.forEach(function (d) {
    linkedByIndex[d.source.index + "," + d.target.index] = 1;
  });

  //This function looks up whether a pair are neighbours
  function neighboring(a, b) {
    return linkedByIndex[a.index + "," + b.index];
  }

  function connectedNodes() {
    if (toggleMurders === 0) return;
    if (toggleConnections === 1) {
      //Reduce the opacity of all but the neighbouring nodes
      d = d3.select(this).node().__data__;
      node.style("opacity", function (o) {
        return neighboring(d, o) | neighboring(o, d) ? 1 : 0.1;
      });
      label.style("display", function (o) {
        return neighboring(d, o) | neighboring(o, d) ? "inline" : "";
      });

      link.style("opacity", function (o) {
        return d.index == o.source.index | d.index == o.target.index ? 1 : 0.1;
      });
      //Reduce the op
      toggleConnections = 1;
    } else {
      //Put them back to opacity=1
      node.style("opacity", 1);
      link.style("opacity", 1);
      label.style("display", "none");
      toggleConnections = 0;
    }
  }

  // ETC FUNCTIONALITY *****
  function filterRegencies() {
    var nodes = svg.selectAll('.node');
    var selected = nodes.filter(function (d, i) {
      return d.generation != 3;
    });
    selected.style('opacity', '0');
    d3.selectAll(".node").transition().duration(5000);
  }



  // const labels = document.querySelectorAll('.node text');
  const labelButton = document.querySelector('.bttn-labels');
  // let labelsShown = false;

  function filterMurders(e) {
    var nodes = svg.selectAll(".node");
    var selected = nodes.filter(function (d) {
      return d.murdered;
    })
    var notSelected = nodes.filter(function (d) {
      return !(d.murdered);
    })
    if (toggleMurders === 1) {
      d3.selectAll(".link").style("opacity", "0");      
      notSelected.style('opacity', '0');
      selected.selectAll('circle').style('fill', 'red');
      selected.selectAll('text').style('display', 'inline');
      toggleMurders = 0;
    } else {
      d3.selectAll(".link").style("opacity", "1");            
      notSelected.style('opacity', '1');
      selected.selectAll('circle').style('fill', 'white');
      selected.selectAll('text').style('display', 'none');
      toggleMurders = 1;
    }
    
  }

  labelButton.addEventListener('click', filterMurders);
  

});

