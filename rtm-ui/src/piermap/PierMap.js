import React from "react";
import "./piermap.css";
import pierconf from "./pierconf";
import berths from "./berths";

let emptyCounter = 1;

const Berth = (props) => {
  const {berthConf, prevEmpty} = props;
  const classNames = ["berth"];
  const id = berthConf.id;
  const berth = berths[id];

  if (!id) {
    classNames.push("empty");
    if (!prevEmpty) {
      classNames.push("first-empty");
    }
  } 

  if (berth && berth.customerName && berth.customerName.length > 20) {
    berth.customerName = berth.customerName.split(",")[0];
  }

  if (props.className) {
    classNames.push(props.className);
  }

  if (berthConf.span) {
    classNames.push(`height-${berthConf.span}`);
  }

  if (berthConf.beam) {
    classNames.push("beam")
  }

  let pierInfo = berthConf.defaultOwner;
  if (id && berth && berth.customerName) {
    pierInfo = berth.customerName;
  }

  return (
    <div className={classNames.join(" ")}>
      <div className="pier-id">{id}</div>
      <div className="pier-info">{pierInfo}</div>
      {berthConf.type && <div className="pier-type badge">{berthConf.type}</div>}
      {berthConf.width && <div className="pier-width badge">{berthConf.width.toFixed(1)}</div>}
    </div>
  );
};

const handleBeams = (berthList) => {
  const firstBeam = berthList.findIndex(b => "AP" === b.type);
  if (firstBeam >= 0) {
    let i = firstBeam;
    for (; i < berthList.length && "AP" === berthList[i].type; i += 2) {
      berthList[i].beam = true;
    }
    if (i < berthList.length) {
      berthList[i].beam = true;
    }
  }
};

const Pier = ({pierName}) => {

  const mapBerths = berthList => {
    let prevEmpty = true;
    return berthList.map(b => {
      const berth = <Berth key={b.id || emptyCounter++} prevEmpty={prevEmpty} berthConf={b}/>;
      prevEmpty = !b.id;
      return berth;
    });
  };

  const pier = pierconf[pierName];
  handleBeams(pier.left);
  handleBeams(pier.right);
  return (
    <div className="pier">
      <div className="column column-left">
        {mapBerths(pier.left)}
      </div>
      <div className="pier-divider">
        <div className="pier-end">
          <div className="pier-type badge">PP</div>
        </div>
        <div className="pier-filler"/>
        <div className="pier-name">{pierName}</div>
      </div>
      <div className="column column-right">
        <Berth className="pier-end" berthConf={pier.end}/>
        {mapBerths(pier.right)}
      </div>
    </div>
  );
};

const PierMap = () => (
  <div className="pier-map">
    <Pier pierName="R"/>
    <Pier pierName="T"/>
    <Pier pierName="M"/>
  </div>
);

export default PierMap;
