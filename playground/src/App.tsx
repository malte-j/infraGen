import { useEffect, useRef, useState } from "react";
import "./App.css";

function App() {
  const [graphSvg, setGraphSvg] = useState<string>();
  const svgWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/graph.svg").then(async (res) => {
      const text = await res.text();
      setGraphSvg(text);
    });
  }, []);

  useEffect(() => {
    if (!svgWrapperRef.current) return;

    svgWrapperRef.current.innerHTML = graphSvg || "";

    const svgGs = svgWrapperRef.current.querySelectorAll("svg g.node");
    if (!svgGs) return;

    function onSvgGClick(e: any) {
      console.log(e.currentTarget);
      console.log(e.currentTarget.querySelector("title").textContent);
    }

    svgGs.forEach((svgG) => {
      svgG.addEventListener("click", onSvgGClick, false);

      
      // // for every child of svgG, make cursor pointer
      // svgG.childNodes.forEach((child) => {
      //   if (child) {
      //     // child.style.cursor = "pointer";
      //   }
      // });
    });

    return () => {
      svgGs.forEach((svgG) => {
        svgG.removeEventListener("click", onSvgGClick);
      });
    };
  }, [svgWrapperRef, graphSvg]);

  return (
    <div>
      <div 
      ref={svgWrapperRef} />
    </div>
  );
}

export default App;
