# Ptolemaniacs
A force-directed graph layout of the [Ptolemaic Dynasty](https://en.wikipedia.org/wiki/Ptolemaic_dynasty). Data for this project was sourced from Wikipedia. Please note that specific dates, even the legitmacy of some heirs, are still debated amongst scholars and should be considered when viewing this visualization. 

Many thanks to [Mike Bostock](https://github.com/mbostock) for such comprehensive support and examples.

[Live](https://nwilliams770.github.io/Ptolemaniacs/)

## Implementation
This project served as an oppurtunity for me to familiarize myself and experiment with the [d3](https://github.com/d3/d3) API whilst delving into a topic I enjoy. I implemented a force-layout with the following features:
* Toggleable filters for familicides and diarchies within the Ptolemaic Dynasty
![Data Filters Gif](https://github.com/nwilliams770/Ptolemaniacs/blob/master/assets/filters.gif)
* Toggleable view of a specific node's immediate relatives and details
![Data Filters Gif](https://github.com/nwilliams770/Ptolemaniacs/blob/master/assets/node-details.gif)
* Detailed display of Ptolemaic lineage and line of rule
![Data Filters Gif](https://github.com/nwilliams770/Ptolemaniacs/blob/master/assets/lineage.gif)
* Toggleable tooltips and information window that updates as users explore the visualization
* Dynamic sizing based on window size
* Draggable nodes



## Future Direction
I'd like to create a more impactful experience for the user and a visualization that isn't just static data on a screen. A live data visualization is what's next

[d3 Real Time Chart (2018)](https://bl.ocks.org/boeric/6a83de20f780b42fadb9)
