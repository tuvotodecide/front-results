import { useEffect } from "react";
import * as d3 from "d3";
import MapBoSvg from "../assets/MapBo.svg";
import "./mapa.css";

interface Department {
  code: string;
  name: string;
}

interface MapaProps {
  onDepartmentClick: (department: Department) => void;
}

const Mapa = ({ onDepartmentClick }: MapaProps) => {
  useEffect(() => {
    const mapObject = document.getElementById("map-svg") as HTMLObjectElement;

    const initializeMap = () => {
      const svgDoc = mapObject.contentDocument;
      if (!svgDoc) return;

      const svg = d3.select(svgDoc).select("svg");

      // Remove any fixed width/height and ensure responsive viewBox
      svg
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("preserveAspectRatio", "xMidYMid meet");

      // Department interactions
      svg
        .selectAll("#features .department")
        .on("mouseenter", function () {
          const dept = d3.select(this);
          if (!dept.classed("selected")) {
            dept
              .transition()
              .style("fill", "#9e9e9e")
              .style("cursor", "pointer");
          } else {
            dept
              .transition()
              .style("fill", "#3d9df3")
              .style("cursor", "pointer");
          }

          // Highlight corresponding label
          const code = dept.attr("data-dept-code");
          svg
            .select(`#label_points circle[id="${code}"]`)
            .transition()
            .style("fill", "#FF6B6B");
        })
        .on("mouseleave", function () {
          const dept = d3.select(this);
          if (!dept.classed("selected")) {
            dept.transition().style("fill", "#c2c2c2");

            // Reset label color
            const code = dept.attr("data-dept-code");
            svg
              .select(`#label_points circle[id="${code}"]`)
              .transition()
              .style("fill", "#6f9c76");
          } else {
            dept
              .transition()
              .style("fill", "#3d9df3")
              .style("cursor", "pointer");
          }
        })
        .on("click", function () {
          const dept = d3.select(this);
          const code = dept.attr("data-dept-code");
          const name = dept.attr("data-dept-name");

          // Interrupt any ongoing transitions and reset all departments
          svg
            .selectAll(".department")
            .interrupt()
            .classed("selected", false)
            .style("fill", "#c2c2c2");

          // Set new selection immediately without transition
          dept.classed("selected", true).interrupt().style("fill", "#3d9df3");

          // Update label immediately without transition
          svg
            .select(`#label_points circle[id="${code}"]`)
            .interrupt()
            .style("fill", "#FF6B6B");

          // Call the click handler instead of select handler
          onDepartmentClick({ code, name });
        });

      // Initial styling
      svg
        .selectAll("#features .department")
        .style("fill", "#c2c2c2")
        .style("stroke", "#ffffff")
        .style("stroke-width", "0.5px");
    };

    // Add load event listener to the object
    mapObject.addEventListener("load", initializeMap);

    // Cleanup
    return () => {
      mapObject.removeEventListener("load", initializeMap);
    };
  }, [onDepartmentClick]);

  return (
    <div className="map-container">
      <object
        id="map-svg"
        data={MapBoSvg}
        type="image/svg+xml"
        className="w-full h-full"
      />
    </div>
  );
};

export default Mapa;
