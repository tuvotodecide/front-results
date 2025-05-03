import * as d3 from "d3";
import React, { useEffect, useRef, useState } from "react";

interface ResultData {
  totalVotes: number;
  ballotCount: number;
  partyId: string;
  color: string;
}

interface BarChartProps {
  resultsData: ResultData[];
}

const BarChart: React.FC<BarChartProps> = ({ resultsData }) => {
  const chartRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const totalVotes = resultsData.reduce(
    (acc, party) => acc + party.totalVotes,
    0
  );

  const maxVotes = resultsData.reduce(
    (max, party) => Math.max(max, party.totalVotes),
    0
  );

  const maxPercentage = (maxVotes / totalVotes) * 100;
  const maxPercentageWithMargin =
    maxPercentage + 10 < 100 ? maxPercentage + 10 : 100;

  const resultsDataWithPercentage = resultsData.map((party) => ({
    ...party,
    percentage: ((party.totalVotes / totalVotes) * 100).toFixed(2),
  }));

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const barHeight = 60; // Height per bar
        const totalBars = resultsData.filter((d) => d.totalVotes > 0).length;
        const minHeight = Math.max(totalBars * barHeight, 200); // Minimum height of 200px

        setDimensions({
          width: containerWidth,
          height: minHeight + 100, // Add extra space for axes and labels
        });
      }
    };

    handleResize(); // Initial size
  }, [resultsData]); // Add resultsData as dependency since we use it for calculation

  useEffect(() => {
    if (!chartRef.current || dimensions.width === 0) return;

    const svg = d3.select(chartRef.current);
    const margin = {
      top: 10, // Reduced from 20
      right: dimensions.width < 600 ? 40 : 60,
      bottom: 60, // Increased bottom margin to accommodate label
      left: dimensions.width < 600 ? 60 : 100,
    };

    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    // Clear previous content
    svg.selectAll("*").remove();

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Sort data by votes
    const sortedData = [...resultsDataWithPercentage]
      .sort((a, b) => b.totalVotes - a.totalVotes)
      .filter((d) => d.totalVotes > 0); // Only show parties with votes

    // Create scales
    const x = d3
      .scaleLinear()
      .domain([0, maxPercentageWithMargin])
      .range([0, width]);

    const y = d3
      .scaleBand()
      .domain(sortedData.map((d) => d.partyId))
      .range([margin.top, height])
      .padding(0.25);

    // Add gridlines with increased visibility
    g.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(0,${height})`)
      .call(
        d3
          .axisBottom(x)
          .tickSize(-(height - margin.top))
          .tickFormat(() => "")
      )
      .attr("color", "gray") // Using a Tailwind gray-200 color
      .attr("stroke-opacity", 0.3) // Increased opacity
      .style("stroke-dasharray", "2,2") // Adding a dashed pattern
      .selectAll("line")
      .attr("stroke", "gray"); // Matching stroke color

    // Add x-axis with responsive font size
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .style("font-size", dimensions.width < 600 ? "12px" : "14px")
      .attr("dy", "1.5em"); // Add space between axis line and numbers

    // Add x-axis label
    g.append("text")
      .attr("class", "x-axis-label")
      .attr("text-anchor", "middle")
      .attr("x", width / 2)
      .attr("y", height + 50) // Position below x-axis
      .style("font-size", dimensions.width < 600 ? "14px" : "16px")
      .text("Porcentaje");

    // Add y-axis with responsive font size
    g.append("g")
      .call(d3.axisLeft(y))
      .selectAll("text")
      .style("font-size", dimensions.width < 600 ? "12px" : "14px");

    // Add bars
    g.selectAll(".bar")
      .data(sortedData)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("y", (d) => y(d.partyId) || 0)
      .attr("height", y.bandwidth())
      .attr("fill", (d) => d.color)
      .attr("x", 0)
      .attr("width", 0)
      .transition()
      .duration(1000)
      .attr("width", (d) => x(parseFloat(d.percentage))); // Use percentage for width

    // Update labels to show percentage and votes in two lines
    // First line: percentage
    g.selectAll(".percentage-label")
      .data(sortedData)
      .enter()
      .append("text")
      .attr("class", "percentage-label")
      .attr("y", (d) => (y(d.partyId) || 0) + y.bandwidth() / 3)
      .attr("x", (d) => x(parseFloat(d.percentage)) + 5)
      .attr("dy", ".35em")
      .style("font-size", dimensions.width < 600 ? "14px" : "16px")
      .text((d) => `${d.percentage} %`);

    // Second line: votes
    g.selectAll(".votes-label")
      .data(sortedData)
      .enter()
      .append("text")
      .attr("class", "votes-label")
      .attr("y", (d) => (y(d.partyId) || 0) + (y.bandwidth() * 2) / 3)
      .attr("x", (d) => x(parseFloat(d.percentage)) + 5)
      .attr("dy", ".35em")
      .style("font-size", dimensions.width < 600 ? "10px" : "12px")
      .text((d) => `${d.totalVotes} votos`);
  }, [resultsDataWithPercentage, dimensions]);

  return (
    <div ref={containerRef} className="w-ful overflow-auto min-h-[700px]">
      <svg
        ref={chartRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full"
      />
    </div>
  );
};

export default BarChart;
