import { useEffect, useRef, useState } from "react";
import s from "./GraphWrapper.module.scss";

export interface GraphWrapperProps {
  svgUri: string;
  setSelectedResource: (resource: string) => void;
}

export const GraphWrapper = ({ svgUri, setSelectedResource }: GraphWrapperProps) => {
  const [graphSvg, setGraphSvg] = useState<string>();
  const svgWrapperRef = useRef<HTMLDivElement>(null);

  /** fetch svg for graph */
  useEffect(() => {
    fetch(svgUri).then(async (res) => {
      const text = await res.text();
      setGraphSvg(text);
    });
  }, [svgUri]);

  function onSvgGClick(e: any) {
    const resourceName = e.currentTarget.querySelector("title").textContent;
    setSelectedResource(resourceName);
  }

  useEffect(() => {
    if (!svgWrapperRef.current) return;
    svgWrapperRef.current.innerHTML = graphSvg || "";
    const svgGs = svgWrapperRef.current.querySelectorAll("svg g.node");
    if (!svgGs) return;

    svgGs.forEach((svgG) => svgG.addEventListener("click", onSvgGClick, false));
    return () => svgGs.forEach((svgG) => svgG.removeEventListener("click", onSvgGClick));
  }, [svgWrapperRef, graphSvg]);

  return <div className={s.graphWrapper} ref={svgWrapperRef} />;
};
