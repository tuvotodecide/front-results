import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

interface DataItem {
  totalVotes: number;
  ballotCount: number;
  partyId: string;
  color: string;
}

interface PieChartProps {
  resultsData: DataItem[];
}

const D3PieChart: React.FC<PieChartProps> = ({ resultsData }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const width = 900;
  const baseHeight = 500;
  const heightPerLabel = 50;

  // Sort data by votes in descending order
  const sortedData = [...resultsData].sort(
    (a, b) => b.totalVotes - a.totalVotes
  );

  // Configure pie layout to start from 180 degrees (left) so largest segments start from there
  const pie = d3
    .pie<DataItem>()
    .value((d) => d.totalVotes)
    .startAngle(Math.PI) // Start from left (180 degrees)
    .endAngle(Math.PI * 3); // Complete the circle (540 degrees)

  const smallSegmentsCount = resultsData.length
    ? pie(sortedData).filter((d) => d.endAngle - d.startAngle < 0.4).length
    : 0;
  const height = Math.max(
    baseHeight,
    baseHeight + smallSegmentsCount * heightPerLabel
  );

  useEffect(() => {
    if (!svgRef.current || !resultsData.length) return;

    // Clear previous chart
    d3.select(svgRef.current).selectAll("*").remove();

    const radius = Math.min(width, height) / 2;

    const svg = d3
      .select(svgRef.current)
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .append("g");

    const arc = d3
      .arc<d3.PieArcDatum<DataItem>>()
      .innerRadius(radius * 0.4)
      .outerRadius(radius);

    const outerArc = d3
      .arc<d3.PieArcDatum<DataItem>>()
      .innerRadius(radius)
      .outerRadius(radius);

    const arcs = pie(sortedData);

    // Add the arcs
    svg
      .selectAll("path")
      .data(arcs)
      .join("path")
      .attr("d", arc)
      .attr("fill", (d) => d.data.color)
      .attr("stroke", "white")
      .style("stroke-width", "2px");

    // Function to determine if a segment is small
    const isSmallSegment = (d: d3.PieArcDatum<DataItem>) => {
      return d.endAngle - d.startAngle < 0.4;
    };

    // Calculate positions for small segments' labels
    const smallSegments = arcs.filter(isSmallSegment);
    const verticalOffsets = new Map();

    smallSegments.forEach((d, i) => {
      const midAngle = (d.startAngle + d.endAngle) / 2;
      const invertedIndex = smallSegments.length - i;
      const yOffset = radius - Math.abs(Math.cos(midAngle)) * radius;
      const offset = yOffset + invertedIndex * 25;
      verticalOffsets.set(d, {
        offset: offset,
        index: smallSegments.length - i - 1,
      });
    });

    // Add polylines for small segments
    svg
      .selectAll("polyline")
      .data(arcs)
      .join("polyline")
      .filter(isSmallSegment)
      .style("fill", "none")
      .style("stroke", "gray")
      .style("stroke-dasharray", "2,2")
      .attr("stroke-width", 1)
      .attr("stroke-opacity", 0.9)
      .attr("points", (d) => {
        const pos = outerArc.centroid(d);
        const { offset } = verticalOffsets.get(d);
        const second = [pos[0], pos[1] + offset];
        const third = [-80, second[1]];
        return [pos, second, third];
      });

    // Add labels with dynamic positioning
    svg
      .selectAll("text")
      .data(arcs)
      .join("text")
      .attr("transform", (d) => {
        if (isSmallSegment(d)) {
          const pos = outerArc.centroid(d);
          const { offset } = verticalOffsets.get(d);
          return `translate(-100,${pos[1] + offset})`;
        }
        return `translate(${arc.centroid(d)})`;
      })
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .text((d) => d.data.partyId)
      .style("font-size", "16px")
      .style("fill", "black")
      .style("font-weight", "bold")
      .style("paint-order", "stroke fill")
      .style("stroke", "white")
      .style("stroke-width", "10px")
      .style("stroke-linecap", "round")
      .style("stroke-linejoin", "round");

    // Adjust SVG size to fit the g tag
    const gElement = svg.node();
    if (gElement) {
      const bbox = gElement.getBBox();
      d3.select(svgRef.current)
        .attr("width", "100%")
        .attr("height", "100%")
        .attr(
          "viewBox",
          `${bbox.x - 20} ${bbox.y - 20} ${bbox.width + 40} ${bbox.height + 40}`
        )
        .attr("preserveAspectRatio", "xMidYMid meet");
    }
  }, [resultsData]);

  return (
    <div className="flex justify-center items-center w-full h-full">
      <div
        className="p-0 w-full h-full"
        style={{
          maxWidth: "600px",
          position: "relative",
        }}
      >
        <svg ref={svgRef} style={{ width: "100%", height: "100%" }}></svg>
      </div>
    </div>
  );
};

export default D3PieChart;
