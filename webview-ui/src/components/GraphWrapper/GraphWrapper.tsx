import { useEffect, useRef, useState } from "react";
import s from "./GraphWrapper.module.scss";

export interface GraphWrapperProps {
  svgUri: string;
}

export const GraphWrapper = ({ svgUri }: GraphWrapperProps) => {
  const [graphSvg, setGraphSvg] = useState<string>();
  const svgWrapperRef = useRef<HTMLDivElement>(null);

  /** fetch graph svg content */
  useEffect(() => {
    fetch(svgUri).then(async (res) => {
      const text = await res.text();
      setGraphSvg(text);
    });
  }, [svgUri]);

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
    });

    return () => {
      svgGs.forEach((svgG) => {
        svgG.removeEventListener("click", onSvgGClick);
      });
    };
  }, [svgWrapperRef, graphSvg]);

  return <div className={s.graphWrapper} ref={svgWrapperRef} />;
};
