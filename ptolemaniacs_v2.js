// Philadelphoi

var width =1920,
  height = 1000;
  aspect = width / height;

var svg = d3.select("#chart")
  .append("svg")
  // .attr("width", width)
  // .attr("height", height);
  .attr("viewBox", "0 0 " + width + " " + height)
  .attr("preserveAspectRatio", "xMidYMid meet");


var force = d3.forceSimulation()
// preshipped force, simulates charged molecules where each repels or attracts until stable state
  // .force("charge", d3.forceManyBody().strength(-10000).distanceMin(-200).distanceMax(800))
  .force("charge", d3.forceManyBody().strength(-125))
  .force("center", d3.forceCenter(width / 2, height / 2))
  
  .force('collision', d3.forceCollide().radius(function (d) {
    return d.r;
  }))
  .force("link", d3.forceLink().distance(75).id(function (d) { return d.index }))
  // .force("y", d3.forceY(0.0001))
  // .force("x", d3.forceX(0.0001));

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
  svg.append("defs").selectAll("marker")
    .data(["child"])      // Different link/path types can be defined here
    .enter().append("marker")    // This section adds in the arrows
    .attr("id", function(d) { return d;})
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 20)
    .attr("refY", -0.5)
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
        case "rule":
          return "purple";
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
      // showHeader(d);
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
    .attr('r', 12)
    .style("fill", function (d) {
    if (d.generation < 4) {
      return "#abcb42";
    } else if (d.generation > 4 && d.generation < 7) {
      return "#feaf17";
    } else {
      return "#f35001";
    }
    });

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
  })
  // force.restart();

  // console.log(force)


//******************* RESIZING: 
  // d3.select(window)
  //   .on("resize", function () {
  //     console.log("something's happening");
  //     var targetWidth = svg.node().getBoundingClientRect().width;
  //     svg.attr("width", targetWidth);
  //     svg.attr("height", targetWidth / aspect);
  //   });
  // resize();
  // d3.select(window).on("resize", resize);

  // function resize() {
  //   width = window.innerWidth, height = window.innerHeight;
  //   svg.attr("width", width).attr("height", height);
  //   force.size([width, height]).resume();
  // }


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
  var toggleConnections = 1;
  var toggleMurders = 1;
  var toggleCorules = 1;
  var toggleLabels = 1;
  var toggleRule = 1;

  //Create an array logging what is connected to what
  var linkedByIndex = {};
  for (i = 0; i < json.nodes.length; i++) {
    linkedByIndex[i + "," + i] = 1;
  };
  

  json.links.forEach(function (d) {
    if (d.type === "child" || d.type === "marriage") {
      linkedByIndex[d.source.index + "," + d.target.index] = 1;
    }
  });

  //This function looks up whether a pair are neighbours
  function neighboring(a, b) {
    return linkedByIndex[a.index + "," + b.index];
  }

  function connectedNodes() {
    if (toggleMurders === 0 || toggleCorules === 0) return;
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
        ((d.index == o.source.index | d.index == o.target.index) && (o.type !== "corule" && o.type !== "rule")) ? "1" : "0.1" 
      })
      //Reduce the op
      toggleConnections = 0;
    } else {
      //Put them back to opacity=1
      node.style("opacity", 1);
      link.style("opacity", function (d) {
        return (d.type === "corule" || d.type === "rule") ? "0" : "1"
      });           
      label.style("display", "none");
      toggleConnections = 1;
    }
  }

  // ETC FUNCTIONALITY *****

  function showHeader(node) {
    var parents = d3.selectAll('.node').filter(function (d) {
      console.log(node);
      return neighboring(d, node) || neighboring(node, d);
    })
    console.log(parents);
  }


  const labelButton = document.querySelector('.bttn-labels');
  const murdersButton = document.querySelector('.bttn-murders');
  const corulesButton = document.querySelector('.bttn-corules');
  const lineOfRuleButton = document.querySelector('.bttn-rule');
  var animDuration = 500;
  
  // let labelsShown = false;

  function toggleButton(el) {
    let label = el.innerHTML;
    label.includes("Show") ? label = label.replace("Show", "Hide") : label = label.replace("Hide", "Show")
    el.innerHTML = label;
  }
  function filterMurders() {
    if (toggleCorules === 0) return;
    toggleButton(this);    
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
      d3.selectAll(".link").style("opacity", function (d) {
        return (d.type === "corule" || d.type === "rule" ) ? "0" : "1"
      });           
      notSelected.style('opacity', '1');
      selected.selectAll('text').style('display', 'none');
      colorizeNodes(selected.selectAll('circle'));
      toggleMurders = 1;
    }
  }

  function filterCorules() {
    if (toggleMurders === 0 || (toggleCorules === 0 && toggleRule === 0)) return;
    toggleButton(this);        
    if (toggleCorules === 1) {
      d3.selectAll(".link").style("opacity", function (d) {
        return d.type === "corule" ? "1" : "0"
      });   
      d3.selectAll(".node circle").style("opacity", function (d) {
        return d.familial_ruler ? "1" : "0"
      })
      d3.selectAll(".node text").style("display", function (d) {
        return d.familial_ruler ? "inline" : "none"
      })
      toggleCorules = 0;
    } else {
      d3.selectAll(".link").style("opacity", function (d) {
        return d.type === "corule" ? "0" : "1"
      });            
      d3.selectAll(".node circle").style("opacity", "1");
      d3.selectAll(".node text").style("display", "none");
      toggleCorules = 1;
    }
  }

  function showLabels() {
    if (toggleMurders === 0 || toggleCorules === 0) return;
    toggleButton(this);    
    if (toggleLabels === 1) {
      d3.selectAll(".node text").style("display", "inline");
      toggleLabels = 0;
    } else {
      d3.selectAll(".node text").style("display", "none");
      toggleLabels = 1;
    }
  }



  function filterLineOfRule(i) {
    d3.selectAll(".link").transition().duration(10)
      .style("opacity", "0");
    var links = d3.selectAll(".link.rule");
    links.transition().duration(1000).style("opacity", "1");
    var circles = d3.selectAll(".node circle").filter(function (d) {
      return d.rule === i;
    })
    var text = d3.selectAll(".node text").filter(function (d) {
      return d.rule === i;
    })

    circles.transition().duration(700).delay(1000 * i)
      .style("fill", "pink");
    text.transition().duration(1000).delay(1000 * i).style("display", "inline");
  }

  function colorizeNodes(nodes) {
    if (nodes) {
      nodes.style("fill", function (d) {
        if (d.generation < 4) {
          return "#abcb42";
        } else if (d.generation > 4 && d.generation < 7) {
          return "#feaf17";
        } else {
          return "#f35001";
        }
      })
    } else {
      d3.selectAll(".node circle").style("fill", function (d) {
        if (d.generation < 4) {
          return "#abcb42";
        } else if (d.generation > 4 && d.generation < 7) {
          return "#feaf17";
        } else {
          return "#f35001";
        }
      });
    }
  }


  function visitNodes () {
    if (toggleMurders === 0 || toggleConnections === 0) return;
    toggleButton(this);    
    
    if (toggleRule === 1) {
      for (let i = 1; i < 16; i++) {
        filterLineOfRule(i);
      }
      toggleRule = 0;   
    } else {
      console.log("made it!")
      var circles = d3.selectAll(".node circle").filter(function (d) {
        return d.rule === i;
      })
      var text = d3.selectAll(".node text").filter(function (d) {
        return d.rule === i;
      })
      circles.interrupt()
        .transition();
      text.interrupt()
        .transition();
      d3.selectAll(".link").style("opacity", function (d) {
        if (d.type === "child" || d.type === "marriage") {
          return "1";
        } else {
          return "0";
        }
      colorizeNodes();
      })
      toggleRule = 1;
    }

  }






  murdersButton.addEventListener('click', filterMurders);
  corulesButton.addEventListener('click', filterCorules);
  labelButton.addEventListener('click', showLabels);
  lineOfRuleButton.addEventListener('click', visitNodes);
});

