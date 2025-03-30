import * as d3 from "d3";
import React, { useEffect, useRef, useState } from "react";

const BarChart: React.FC = () => {
  const chartRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const resultsData = [
    {
      totalVotes: 87,
      ballotCount: 1,
      partyId: "MAS-IPSP",
      color: "#1a53ff",
    },
    {
      totalVotes: 33,
      ballotCount: 1,
      partyId: "C.C.",
      color: "#ffa300",
    },
    {
      totalVotes: 17,
      ballotCount: 1,
      partyId: "MTS",
      color: "#ebdc78",
    },
    {
      totalVotes: 3,
      ballotCount: 1,
      partyId: "FPV",
      color: "#b30000",
    },
    {
      totalVotes: 1,
      ballotCount: 1,
      partyId: "UCS",
      color: "#7c1158",
    },
    {
      totalVotes: 1,
      ballotCount: 1,
      partyId: "MNR",
      color: "#fdcce5",
    },
    {
      totalVotes: 0,
      ballotCount: 1,
      partyId: "PDC",
      color: "#ffee65",
    },
    {
      totalVotes: 0,
      ballotCount: 1,
      partyId: "PAN-BOL",
      color: "#87bc45",
    },
    {
      totalVotes: 0,
      ballotCount: 1,
      partyId: "21F",
      color: "#9b19f5",
    },
  ];

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
        setDimensions({
          width: containerWidth,
          height: Math.min(containerWidth * 0.6, 400), // Responsive height
        });
      }
    };

    handleResize(); // Initial size
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!chartRef.current || dimensions.width === 0) return;

    const svg = d3.select(chartRef.current);
    const margin = {
      top: 20,
      right: dimensions.width < 600 ? 40 : 60, // Adjust margins for mobile
      bottom: 30,
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
      .range([0, height])
      .padding(0.1);

    // Add x-axis with responsive font size
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .style("font-size", dimensions.width < 600 ? "12px" : "14px");

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
    <div ref={containerRef} className="w-full">
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
