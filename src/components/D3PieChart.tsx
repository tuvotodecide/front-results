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

  const pie = d3.pie<DataItem>().value((d) => d.totalVotes);
  const smallSegmentsCount = resultsData.length
    ? pie(resultsData).filter((d) => d.endAngle - d.startAngle < 0.4).length
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
      .outerRadius(radius * 0.8);

    const outerArc = d3
      .arc<d3.PieArcDatum<DataItem>>()
      .innerRadius(radius * 0.9)
      .outerRadius(radius * 0.9);

    const arcs = pie(resultsData);

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

    // Calculate vertical offsets for small segments
    const smallSegments = arcs.filter(isSmallSegment);
    const verticalOffsets = new Map();

    smallSegments.forEach((d, i) => {
      const midAngle = (d.startAngle + d.endAngle) / 2;
      const baseOffset = Math.sin(midAngle) * 20;
      // Increase vertical spacing between labels
      const spreadFactor = (i - (smallSegments.length - 1) / 2) * 40;
      verticalOffsets.set(d, baseOffset + spreadFactor);
    });

    // Add polylines for small segments
    svg
      .selectAll("polyline")
      .data(arcs)
      .join("polyline")
      .filter(isSmallSegment)
      .style("fill", "none")
      .style("stroke", "gray")
      .attr("stroke-width", 1)
      .attr("points", (d) => {
        const pos = outerArc.centroid(d);
        const midAngle = (d.startAngle + d.endAngle) / 2;
        const verticalOffset = verticalOffsets.get(d);
        pos[0] = radius * 1.1 * (midAngle < Math.PI ? 1 : -1);
        pos[1] = pos[1] + verticalOffset;
        const mid = outerArc.centroid(d);
        mid[1] = mid[1] + verticalOffset * 0.5;
        return [arc.centroid(d), mid, pos];
      });

    // Add labels with dynamic positioning
    svg
      .selectAll("text")
      .data(arcs)
      .join("text")
      .attr("transform", (d) => {
        if (isSmallSegment(d)) {
          const pos = outerArc.centroid(d);
          const midAngle = (d.startAngle + d.endAngle) / 2;
          const verticalOffset = verticalOffsets.get(d);
          // Increase horizontal offset and adjust vertical position
          pos[0] = radius * 1.1 * (midAngle < Math.PI ? 1 : -1);
          pos[1] = pos[1] + verticalOffset;
          return `translate(${pos})`;
        }
        return `translate(${arc.centroid(d)})`;
      })
      .attr("text-anchor", (d) => {
        if (isSmallSegment(d)) {
          const midAngle = (d.startAngle + d.endAngle) / 2;
          return midAngle < Math.PI ? "start" : "end";
        }
        return "middle";
      })
      .attr("dy", "0.35em")
      .text((d) => d.data.partyId)
      .style("font-size", "12px")
      .style("fill", (d) => (isSmallSegment(d) ? "black" : "white"));

    // Add legends
    const legend = svg
      .selectAll(".legend")
      .data(resultsData)
      .join("g")
      .attr("class", "legend")
      .attr(
        "transform",
        (d, i) =>
          `translate(${(i % 2) * 150 - radius}, ${
            radius + 50 + Math.floor(i / 2) * 30
          })` // Moved to the bottom of the graph
      );

    legend
      .append("rect")
      .attr("width", 20)
      .attr("height", 20)
      .style("fill", (d) => d.color);

    legend
      .append("text")
      .attr("x", 30)
      .attr("y", 15)
      .text((d) => `${d.partyId} (${d.totalVotes})`)
      .style("font-size", "14px"); // Increased font size

    // Adjust SVG size to fit the g tag
    const gElement = svg.node();
    if (gElement) {
      const bbox = gElement.getBBox();
      d3.select(svgRef.current)
        .attr("width", "100%") // Ensure full responsiveness
        .attr("height", "100%")
        .attr(
          "viewBox",
          `${bbox.x - 20} ${bbox.y - 20} ${bbox.width + 40} ${bbox.height + 40}`
        ) // Add padding to prevent cut-off
        .attr("preserveAspectRatio", "xMidYMid meet"); // Maintain aspect ratio
    }
  }, [resultsData]);

  return (
    <div className="flex justify-center items-center w-full h-full min-h-[500px]">
      <div
        style={{
          width: "100%",
          height: "100%",
          maxWidth: "1200px",
          position: "relative",
        }}
      >
        <svg ref={svgRef} style={{ width: "100%", height: "100%" }}></svg>
      </div>
    </div>
  );
};

export default D3PieChart;
