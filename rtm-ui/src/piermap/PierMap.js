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



const Berth = (props) => {
  const {berthConf, prevEmpty} = props;
  const classNames = ["berth"];
  const id = berthConf.id;
  const berth = berthConf.berthOwner;

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

  return (
    <div className={classNames.join(" ")}>
      <div className="pier-id">{pierId}</div>
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

const Pier = ({pierName, berths, statsComponent}) => {

  const createBerth = (berthConf, prevEmpty, className) => {
    berthConf.berthOwner = berths[berthConf.id];
    return <Berth key={berthConf.id || emptyCounter++} className={className} prevEmpty={prevEmpty} berthConf={berthConf}/>;
  };

  const mapBerths = berthList => {
    let prevEmpty = true;
    return berthList.map(b => {
      const berth = createBerth(b, prevEmpty);
      prevEmpty = !b.id;
      return berth;
    });
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
          <div className="pier-end">
            <div className="pier-type badge">PP</div>
          </div>
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
      const total = stats[pier].total;
      const occupied = stats[pier].occupied = Object.entries(berths).filter(([b, e]) => b.startsWith(pier) && e.customerName).length;
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
