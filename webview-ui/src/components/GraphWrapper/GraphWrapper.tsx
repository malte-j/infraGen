import { useEffect, useRef, useState } from "react";
import s from "./GraphWrapper.module.scss";
import { cssStyle } from "./utils";

export interface ResourceSelection {
  resourceId: string;
  nodeId: string;
}

export interface GraphWrapperProps {
  svgUri: string;
  selectedResource: ResourceSelection | null;
  setSelectedResource: (selection: ResourceSelection | null) => void;
}

export const GraphWrapper = ({
  svgUri,
  selectedResource,
  setSelectedResource,
}: GraphWrapperProps) => {
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
    const resourceId = e.currentTarget.querySelector("title").textContent;
    const nodeId = e.currentTarget.id;
    setSelectedResource({
      resourceId,
      nodeId,
    });
    e.stopPropagation();
  }

  function onOutsideCLick() {
    setSelectedResource(null);
  }

  useEffect(() => {
    if (!svgWrapperRef.current) return;
    svgWrapperRef.current.innerHTML = graphSvg || "";
    const svgGs = svgWrapperRef.current.querySelectorAll("svg g.node");
    if (!svgGs) return;

    svgGs.forEach((svgG) => svgG.addEventListener("click", onSvgGClick, false));

    svgWrapperRef.current.addEventListener("click", (e) => {
      onOutsideCLick();
    });

    // add style from cssStyle function to div element

    if (selectedResource?.resourceId) {
      const styleElement = document.createElement("style");
      styleElement.innerHTML = cssStyle(selectedResource.nodeId);
      svgWrapperRef.current.prepend(styleElement);
    }

    return () => svgGs.forEach((svgG) => svgG.removeEventListener("click", onSvgGClick));
  }, [svgWrapperRef.current, graphSvg, selectedResource]);

  return (
    <div
      data-active-resource={selectedResource?.resourceId}
      className={s.graphWrapper}
      ref={svgWrapperRef}
    />
  );
};
