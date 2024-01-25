"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
require("./App.css");
function App() {
    const [graphSvg, setGraphSvg] = (0, react_1.useState)();
    const svgWrapperRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
        fetch("/graph.svg").then((res) => __awaiter(this, void 0, void 0, function* () {
            const text = yield res.text();
            setGraphSvg(text);
        }));
    }, []);
    (0, react_1.useEffect)(() => {
        if (!svgWrapperRef.current)
            return;
        svgWrapperRef.current.innerHTML = graphSvg || "";
        const svgGs = svgWrapperRef.current.querySelectorAll("svg g.node");
        console.log(svgGs);
        if (!svgGs)
            return;
        function onSvgGClick(e) {
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
    return (<div>
            <div ref={svgWrapperRef}/>

    </div>);
}
exports.default = App;
//# sourceMappingURL=App.js.map