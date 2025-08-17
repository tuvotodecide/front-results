import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface GraphData {
  name: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: GraphData[];
}

const D3PieChart: React.FC<PieChartProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const width = 900;
  const baseHeight = 500;
  const heightPerLabel = 50;

  // Filter out data with value 0 and sort by votes in descending order
  const sortedData = [...data]
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);

  // Configure pie layout to start from 180 degrees (left) so largest segments start from there
  const pie = d3
    .pie<GraphData>()
    .value((d) => d.value)
    .startAngle(Math.PI) // Start from left (180 degrees)
    .endAngle(Math.PI * 3); // Complete the circle (540 degrees)

  const smallSegmentsCount = sortedData.length
    ? pie(sortedData).filter((d) => d.endAngle - d.startAngle < 0.4).length
    : 0;
  const height = Math.max(
    baseHeight,
    baseHeight + smallSegmentsCount * heightPerLabel
  );

  useEffect(() => {
    if (!svgRef.current || !sortedData.length) return;

    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove();

    // Calculate total for percentage calculation
    const total = sortedData.reduce((sum, d) => sum + d.value, 0);

    const radius = Math.min(width, height) / 2;

    const svg = d3
      .select(svgRef.current)
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .append('g');

    const arc = d3
      .arc<d3.PieArcDatum<GraphData>>()
      .innerRadius(radius * 0.4)
      .outerRadius(radius);

    const outerArc = d3
      .arc<d3.PieArcDatum<GraphData>>()
      .innerRadius(radius)
      .outerRadius(radius);

    const arcs = pie(sortedData);

    // Add the arcs
    svg
      .selectAll('path')
      .data(arcs)
      .join('path')
      .attr('d', arc)
      .attr('fill', (d) => d.data.color)
      .attr('stroke', 'white')
      .style('stroke-width', '2px');

    // Function to determine if a segment is small
    const isSmallSegment = (d: d3.PieArcDatum<GraphData>) => {
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
      .selectAll('polyline')
      .data(arcs)
      .join('polyline')
      .filter(isSmallSegment)
      .style('fill', 'none')
      .style('stroke', 'gray')
      .style('stroke-dasharray', '2,2')
      .attr('stroke-width', 1)
      .attr('stroke-opacity', 0.9)
      .attr('points', (d) => {
        const pos = outerArc.centroid(d);
        const { offset } = verticalOffsets.get(d);
        const second = [pos[0], pos[1] + offset];
        const third = [-80, second[1]];
        return [
          [pos[0], pos[1]],
          [second[0], second[1]],
          [third[0], third[1]],
        ].join(',');
      });

    // Add labels with dynamic positioning
    const textElements = svg
      .selectAll('text')
      .data(arcs)
      .join('text')
      .attr('transform', (d) => {
        if (isSmallSegment(d)) {
          const pos = outerArc.centroid(d);
          const { offset } = verticalOffsets.get(d);
          return `translate(-100,${pos[1] + offset})`;
        }
        return `translate(${arc.centroid(d)})`;
      })
      .attr('text-anchor', 'middle')
      .style('font-size', '20px')
      .style('fill', 'black')
      .style('font-weight', 'bold')
      .style('letter-spacing', '1px')
      .style('paint-order', 'stroke fill')
      .style('stroke', 'white')
      .style('stroke-width', '10px')
      .style('stroke-linecap', 'round')
      .style('stroke-linejoin', 'round');

    // Function to wrap text for long names
    const wrapText = (text: string, maxLength: number = 15) => {
      if (text.length <= maxLength) return [text];

      const words = text.split(' ');
      const lines = [];
      let currentLine = '';

      for (const word of words) {
        if ((currentLine + word).length <= maxLength) {
          currentLine += (currentLine ? ' ' : '') + word;
        } else {
          if (currentLine) lines.push(currentLine);
          currentLine = word;
        }
      }
      if (currentLine) lines.push(currentLine);

      return lines;
    };

    // Add name as first line(s) with text wrapping
    textElements.each(function (d) {
      const element = d3.select(this);
      const isSmall = isSmallSegment(d);

      // For small segments, show everything in one line
      if (isSmall) {
        const percentage = ((d.data.value / total) * 100).toFixed(1);
        element
          .append('tspan')
          .attr('x', 0)
          .attr('dy', '0.35em')
          .text(`${d.data.name} ${percentage}%`);
      } else {
        // For large segments, use the original multi-line approach
        const lines = wrapText(d.data.name);

        lines.forEach((line, i) => {
          element
            .append('tspan')
            .attr('x', 0)
            .attr('dy', i === 0 ? '-0.8em' : '1.1em')
            .text(line);
        });

        // Add percentage as last line with more spacing
        element
          .append('tspan')
          .attr('x', 0)
          .attr('dy', '1.8em')
          .text(() => {
            const percentage = ((d.data.value / total) * 100).toFixed(1);
            return `${percentage}%`;
          })
          .style('font-size', '20px')
          .style('font-weight', 'bold');
      }
    });

    // Adjust SVG size to fit the g tag
    const gElement = svg.node();
    if (gElement) {
      const bbox = gElement.getBBox();
      d3.select(svgRef.current)
        .attr('width', '100%')
        .attr('height', '100%')
        .attr(
          'viewBox',
          `${bbox.x - 20} ${bbox.y - 20} ${bbox.width + 40} ${bbox.height + 40}`
        )
        .attr('preserveAspectRatio', 'xMidYMid meet');
    }
  }, [sortedData]);

  if (sortedData.length === 0) {
    return (
      <div
        className="flex justify-center items-center w-full h-full"
        style={{ minHeight: '500px' }}
      >
        No hay datos
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center w-full h-full">
      <div
        className="p-0 w-full h-full"
        style={{
          maxWidth: '600px',
          position: 'relative',
        }}
      >
        <svg ref={svgRef} style={{ width: '100%', height: '100%' }}></svg>
      </div>
    </div>
  );
};

export default D3PieChart;
