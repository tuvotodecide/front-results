import React, { useRef, useEffect } from "react";
import * as d3 from "d3";

const Resultados: React.FC = () => {
  const chartRef = useRef<SVGSVGElement>(null);

  const dummyData = {
    results: [
      {
        totalVotes: 87,
        ballotCount: 1,
        partyId: "MAS-IPSP",
      },
      {
        totalVotes: 33,
        ballotCount: 1,
        partyId: "C.C.",
      },
      {
        totalVotes: 17,
        ballotCount: 1,
        partyId: "MTS",
      },
      {
        totalVotes: 3,
        ballotCount: 1,
        partyId: "FPV",
      },
      {
        totalVotes: 1,
        ballotCount: 1,
        partyId: "UCS",
      },
      {
        totalVotes: 1,
        ballotCount: 1,
        partyId: "MNR",
      },
      {
        totalVotes: 0,
        ballotCount: 1,
        partyId: "PDC",
      },
      {
        totalVotes: 0,
        ballotCount: 1,
        partyId: "PAN-BOL",
      },
      {
        totalVotes: 0,
        ballotCount: 1,
        partyId: "21F",
      },
    ],
    totals: {
      validVotes: 142,
      nullVotes: 6,
      blankVotes: 64,
      totalBallots: 1,
    },
    filters: {},
    generatedAt: "2025-03-30T00:07:53.293Z",
  };

  useEffect(() => {
    if (!chartRef.current) return;

    const svg = d3.select(chartRef.current);
    const margin = { top: 20, right: 20, bottom: 30, left: 100 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Clear previous content
    svg.selectAll("*").remove();

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Sort data by votes
    const sortedData = [...dummyData.results].sort(
      (a, b) => b.totalVotes - a.totalVotes
    );

    // Create scales
    const x = d3
      .scaleLinear()
      .domain([0, d3.max(sortedData, (d) => d.totalVotes) || 0])
      .range([0, width]);

    const y = d3
      .scaleBand()
      .domain(sortedData.map((d) => d.partyId))
      .range([0, height])
      .padding(0.1);

    // Add x-axis
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x));

    // Add y-axis
    g.append("g").call(d3.axisLeft(y));

    // Add bars
    g.selectAll(".bar")
      .data(sortedData)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("y", (d) => y(d.partyId) || 0)
      .attr("height", y.bandwidth())
      .attr("fill", "#4299e1")
      .attr("x", 0)
      .attr("width", 0)
      .transition()
      .duration(1000)
      .attr("width", (d) => x(d.totalVotes));

    // Add vote count labels
    g.selectAll(".label")
      .data(sortedData)
      .enter()
      .append("text")
      .attr("class", "label")
      .attr("y", (d) => (y(d.partyId) || 0) + y.bandwidth() / 2)
      .attr("x", (d) => x(d.totalVotes) + 5)
      .attr("dy", ".35em")
      .text((d) => d.totalVotes);
  }, [dummyData]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Resultados</h1>
      <svg ref={chartRef} width="800" height="400"></svg>
    </div>
  );
};

export default Resultados;
