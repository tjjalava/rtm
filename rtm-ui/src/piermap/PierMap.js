import React from "react";
import "./piermap.css";
import pierconf from "./pierconf";
import moment from "moment";
import "moment/locale/fi";

moment.locale("fi");

let emptyCounter = 1;

const stats = {
  R: {
    total: pierconf.R.left.length + pierconf.R.right.length + 1
  },
  T: {
    total: pierconf.T.left.length + pierconf.T.right.length + 1
  },
  M: {
    total: pierconf.M.left.length + pierconf.M.right.length + 1
  }
};

const mapBerthType = (berthType) => {
  switch (berthType) {
    case "Kylkipaikka":
      return "KP";

    case "Poijupaikka":
      return "PP";

    case "Aisapaikka":
      return "AP";

    default: return null;
  }
};

const rendered = {};
const infoMissing = {};

const Berth = (props) => {
  const {berthConf, prevEmpty} = props;
  const classNames = ["berth"];
  const id = berthConf.id;
  const berth = berthConf.berthInfo;

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
  let pierId;
  if (id && berth && berth.customerName) {
    pierId = <a href={`https://suuli.spv.fi/#/berth-edit/${berth.id}`} target="_blank">{id}</a>
    pierInfo = <a href={`https://suuli.spv.fi/#/person/${berth.ownerId}`} target="_blank">{berth.customerName}</a>;
  } else {
    pierId = id;
  }

  const berthType = berth ? berth.berthType : null;

  if (berth) {
    rendered[id] = true;
  }

  return (
    <div className={classNames.join(" ")}>
      <div className="pier-id">{pierId}</div>
      <div className="pier-info">{pierInfo}</div>
      {berthType && <div className="pier-type badge">{berthType}</div>}
      {berth && <div className="pier-width badge">{berth.width.toFixed(1)}</div>}
    </div>
  );
};

const Pier = ({pierName, berths, statsComponent}) => {

  const createBerth = (berthConf, prevEmpty, className) => {
    berthConf.berthInfo = berths[berthConf.id];
    return <Berth key={berthConf.id || emptyCounter++} className={className} prevEmpty={prevEmpty} berthConf={berthConf}/>;
  };

  const mapBerths = berthList => {
    let prevEmpty = true;
    return berthList
      .filter(b => {
        if (b.id && !berths[b.id]) {
          infoMissing[b.id] = true;
          return false;
        }
        return true;
      })
      .map(b => {
        const berth = createBerth(b, prevEmpty);
        prevEmpty = !b.id;
        return berth;
      });
  };

  const getType = berth => {
    const berthInfo = berths[berth.id];
    if (berthInfo) {
      return berthInfo.berthType;
    } else {
      return null;
    }
  };

  const handleBeams = (berthList) => {
    let firstBeam = 0;
    while (firstBeam < berthList.length && "AP" !== getType(berthList[firstBeam])) {
      firstBeam++;
    }

    if (firstBeam >= 0 && firstBeam < berthList.length) {
      let i = firstBeam;
      for (; i < berthList.length && "AP" === getType(berthList[i]); i += 2) {
        berthList[i].beam = true;
      }
      if (i < berthList.length) {
        berthList[i].beam = true;
      }
    }
  };

  const pier = pierconf[pierName];
  handleBeams(pier.left);
  handleBeams(pier.right);
  return (
    <div className="pier-column">
      {statsComponent}
      <div className="pier">
        <div className="column column-left">
          {mapBerths(pier.left)}
        </div>
        <div className="pier-divider">
          <div className="pier-end"/>
          <div className="pier-filler"/>
          <div className="pier-name">{pierName}</div>
        </div>
        <div className="column column-right">
          {createBerth(pier.end, false, "pier-end")}
          {mapBerths(pier.right)}
        </div>
      </div>
    </div>
  );
};

class PierStats extends React.Component {
  render () {
    const {berths} = this.props;
    stats.total = {
      total: 0,
      occupied: 0,
      vacant: 0
    };
    ["R", "T", "M"].forEach(pier => {
      const pierList = Object.entries(berths).filter(([b]) => b.startsWith(pier));
      const total = stats[pier].total = pierList.length;
      const occupied = stats[pier].occupied = pierList.filter(([_, e]) => e.customerName).length;
      const vacant = stats[pier].vacant = total - occupied;
      stats.total.total += total;
      stats.total.occupied += occupied;
      stats.total.vacant += vacant;
    });

    return (
      <table className="stats-table">
        <tbody>
          {["R", "T", "M"].map(pier => (
            <tr key={pier}>
              <th>{pier}</th>
              <td>{stats[pier].total}</td>
              <td>{stats[pier].occupied}</td>
              <td>{stats[pier].vacant}</td>
            </tr>
          ))}
        </tbody>
        <thead>
          <tr>
            <th>Laituri</th>
            <th>Paikkoja</th>
            <th>Varattu</th>
            <th>Vapaana</th>
          </tr>
        </thead>
        <tfoot>
          <tr>
            <th>Yhteensä</th>
            <th>{stats.total.total}</th>
            <th>{stats.total.occupied}</th>
            <th>{stats.total.vacant}</th>
          </tr>
        </tfoot>
      </table>
    );
  }
}

class PierMap extends React.Component {

  constructor (props) {
    super(props);
    this.state = {
      berths: null
    };
  }

  fetchBerths = async () => {
    const resp = await fetch(new Request("/api/berths"), {
      mode: "same-origin",
      credentials: "include"
    });
    if (resp.ok) {
      const berths = await resp.json();
      for (const berthId in berths) {
        if (berths.hasOwnProperty(berthId)) {
          const berth = berths[berthId];
          berth.berthType = mapBerthType(berth.berthType);
          const origWidth = berth.width;
          const billingWidth = parseFloat(berth.name.replace(/^.*(\d,\d)m$/, "$1").replace(",", "."));
          if (isNaN(billingWidth)) {
            console.warn("Laituri " + berthId + ": laskutusleveyttä ei pystytty lukemaan, käytetään " +
              "määriteltyä leveyttä (" + origWidth + ")");
          }
          if (origWidth !== billingWidth && !isNaN(billingWidth)) {
            console.warn("Laituri " + berthId + ": määritelty leveys (" + origWidth +
              ") ei vastaa laskutusleveyttä (" + billingWidth + "). Käytetään laskutusleveyttä.");
          }
          berth.width = billingWidth;
        }
      }
      this.setState({berths});
    } else {
      const error = new Error(resp.statusText);
      error.status = resp.status;
      this.props.errorHandler(error);
    }
  };

  async componentDidMount () {
    await this.fetchBerths();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const berths = this.state.berths;
    const notRendered = [];
    for (const berthId in berths) {
      if (berths.hasOwnProperty(berthId) && !rendered[berthId]) {
        notRendered.push(berthId);
      }
    }

    if (notRendered.length) {
      console.warn("Laiturit määritelty Suulissa mutta ei laiturikartassa: " + notRendered.sort().join(","));
    }

    const missing = Object.entries(infoMissing).map(([id, _]) => id);
    if (missing.length) {
      console.warn("Laiturit määritelty laiturikartassa mutta ei Suulissa: " + missing.sort().join(","));
    }
  }

  render () {
    const berths = this.state.berths;
    const printDate = moment();
    const statsComponent = (
      <div className="stats-component">
        <h1><span>RTM:n laiturikartta {printDate.format("YYYY")}</span><button onClick={this.fetchBerths}>Päivitä</button></h1>
        <PierStats berths={berths}/>
        <div className="print-date">Tulostettu: {printDate.format("LLL")}</div>
      </div>
    );
    if (berths) {
      return (
        <div className="pier-map">
          <Pier pierName="R" berths={berths} statsComponent={statsComponent}/>
          <Pier pierName="T" berths={berths}/>
          <Pier pierName="M" berths={berths}/>
        </div>
      );
    } else {
      return null;
    }
  }
}

export default PierMap;
